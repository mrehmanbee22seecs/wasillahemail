/**
 * Search Service
 * Handles search operations, caching, history, and saved searches
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../utils/firebaseInit';
import { SearchableItem, SearchEngine, createSearchEngine, SearchFilters, SearchResult } from '../utils/searchEngine';

// Search history item
export interface SearchHistoryItem {
  id: string;
  userId: string;
  query: string;
  filters?: SearchFilters;
  timestamp: Date;
  resultCount: number;
}

// Saved search
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters?: SearchFilters;
  createdAt: Date;
  lastUsed?: Date;
}

// Search analytics
export interface SearchAnalytics {
  totalSearches: number;
  popularQueries: { query: string; count: number }[];
  averageResultCount: number;
  noResultQueries: string[];
}

class SearchService {
  private projectsEngine: SearchEngine<SearchableItem> | null = null;
  private eventsEngine: SearchEngine<SearchableItem> | null = null;
  private ngosEngine: SearchEngine<SearchableItem> | null = null;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Initialize search engines with data from Firestore
   */
  async initializeSearchEngines() {
    try {
      const [projects, events, ngos] = await Promise.all([
        this.fetchProjects(),
        this.fetchEvents(),
        this.fetchNGOs(),
      ]);

      this.projectsEngine = createSearchEngine(projects);
      this.eventsEngine = createSearchEngine(events);
      this.ngosEngine = createSearchEngine(ngos);

      console.log('Search engines initialized');
    } catch (error) {
      console.error('Error initializing search engines:', error);
    }
  }

  /**
   * Fetch projects from Firestore
   */
  private async fetchProjects(): Promise<SearchableItem[]> {
    const cached = this.getFromCache('projects');
    if (cached) return cached;

    try {
      const q = query(
        collection(db, 'submissions'),
        where('status', '==', 'approved'),
        where('type', '==', 'project')
      );
      const snapshot = await getDocs(q);
      
      const projects: SearchableItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          tags: data.tags || [],
          location: data.location || '',
          author: data.ngoName || data.ngoId || '',
          date: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
          type: 'project' as const,
          ...data,
        };
      });

      this.setCache('projects', projects);
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  /**
   * Fetch events from Firestore
   */
  private async fetchEvents(): Promise<SearchableItem[]> {
    const cached = this.getFromCache('events');
    if (cached) return cached;

    try {
      const q = query(
        collection(db, 'submissions'),
        where('status', '==', 'approved'),
        where('type', '==', 'event')
      );
      const snapshot = await getDocs(q);
      
      const events: SearchableItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          tags: data.tags || [],
          location: data.location || '',
          author: data.ngoName || data.ngoId || '',
          date: data.eventDate || data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
          type: 'event' as const,
          ...data,
        };
      });

      this.setCache('events', events);
      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  /**
   * Fetch NGOs from Firestore
   */
  private async fetchNGOs(): Promise<SearchableItem[]> {
    const cached = this.getFromCache('ngos');
    if (cached) return cached;

    try {
      const snapshot = await getDocs(collection(db, 'users'));
      
      const ngos: SearchableItem[] = snapshot.docs
        .filter(doc => doc.data().role === 'ngo')
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.displayName || data.organizationName || '',
            description: data.bio || data.description || '',
            category: data.category || '',
            tags: data.tags || [],
            location: data.location || '',
            author: data.displayName || '',
            date: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
            type: 'ngo' as const,
            ...data,
          };
        });

      this.setCache('ngos', ngos);
      return ngos;
    } catch (error) {
      console.error('Error fetching NGOs:', error);
      return [];
    }
  }

  /**
   * Search across all content types
   */
  async searchAll(query: string, filters?: SearchFilters, limit: number = 20): Promise<SearchResult<SearchableItem>[]> {
    if (!this.projectsEngine || !this.eventsEngine || !this.ngosEngine) {
      await this.initializeSearchEngines();
    }

    const [projectResults, eventResults, ngoResults] = await Promise.all([
      this.projectsEngine?.search(query, { filters, limit: Math.ceil(limit / 3) }) || [],
      this.eventsEngine?.search(query, { filters, limit: Math.ceil(limit / 3) }) || [],
      this.ngosEngine?.search(query, { filters, limit: Math.ceil(limit / 3) }) || [],
    ]);

    // Combine and sort by relevance
    const allResults = [...projectResults, ...eventResults, ...ngoResults];
    return allResults
      .sort((a, b) => (a.score || 0) - (b.score || 0))
      .slice(0, limit);
  }

  /**
   * Search projects only
   */
  async searchProjects(query: string, filters?: SearchFilters, limit: number = 20): Promise<SearchResult<SearchableItem>[]> {
    if (!this.projectsEngine) {
      await this.initializeSearchEngines();
    }
    return this.projectsEngine?.search(query, { filters, limit }) || [];
  }

  /**
   * Search events only
   */
  async searchEvents(query: string, filters?: SearchFilters, limit: number = 20): Promise<SearchResult<SearchableItem>[]> {
    if (!this.eventsEngine) {
      await this.initializeSearchEngines();
    }
    return this.eventsEngine?.search(query, { filters, limit }) || [];
  }

  /**
   * Search NGOs only
   */
  async searchNGOs(query: string, filters?: SearchFilters, limit: number = 10): Promise<SearchResult<SearchableItem>[]> {
    if (!this.ngosEngine) {
      await this.initializeSearchEngines();
    }
    return this.ngosEngine?.search(query, { filters, limit }) || [];
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query: string, type?: string): Promise<string[]> {
    if (!this.projectsEngine || !this.eventsEngine || !this.ngosEngine) {
      await this.initializeSearchEngines();
    }

    if (type === 'project') {
      return this.projectsEngine?.getSuggestions(query, 5) || [];
    } else if (type === 'event') {
      return this.eventsEngine?.getSuggestions(query, 5) || [];
    } else if (type === 'ngo') {
      return this.ngosEngine?.getSuggestions(query, 5) || [];
    }

    // Return suggestions from all types
    const [projectSuggestions, eventSuggestions, ngoSuggestions] = await Promise.all([
      this.projectsEngine?.getSuggestions(query, 3) || [],
      this.eventsEngine?.getSuggestions(query, 3) || [],
      this.ngosEngine?.getSuggestions(query, 3) || [],
    ]);

    return [...projectSuggestions, ...eventSuggestions, ...ngoSuggestions].slice(0, 10);
  }

  /**
   * Save search to history
   */
  async saveToHistory(userId: string, query: string, filters: SearchFilters | undefined, resultCount: number) {
    try {
      await addDoc(collection(db, 'search_history'), {
        userId,
        query: query.toLowerCase().trim(),
        filters: filters || null,
        timestamp: serverTimestamp(),
        resultCount,
      });
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  /**
   * Get search history for a user
   */
  async getSearchHistory(userId: string, limit: number = 20): Promise<SearchHistoryItem[]> {
    try {
      const q = query(
        collection(db, 'search_history'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          query: data.query,
          filters: data.filters,
          timestamp: data.timestamp?.toDate() || new Date(),
          resultCount: data.resultCount,
        };
      });
    } catch (error) {
      console.error('Error fetching search history:', error);
      return [];
    }
  }

  /**
   * Clear search history for a user
   */
  async clearSearchHistory(userId: string) {
    try {
      const q = query(
        collection(db, 'search_history'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  /**
   * Save a search for later
   */
  async saveSearch(userId: string, name: string, query: string, filters?: SearchFilters): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'saved_searches'), {
        userId,
        name,
        query,
        filters: filters || null,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  }

  /**
   * Get saved searches for a user
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      const q = query(
        collection(db, 'saved_searches'),
        where('userId', '==', userId),
        orderBy('lastUsed', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          name: data.name,
          query: data.query,
          filters: data.filters,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUsed: data.lastUsed?.toDate(),
        };
      });
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      return [];
    }
  }

  /**
   * Update last used time for saved search
   */
  async updateSavedSearchUsage(searchId: string) {
    try {
      const docRef = doc(db, 'saved_searches', searchId);
      await updateDoc(docRef, {
        lastUsed: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating saved search:', error);
    }
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(searchId: string) {
    try {
      await deleteDoc(doc(db, 'saved_searches', searchId));
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  }

  /**
   * Get trending content
   */
  async getTrendingContent(type?: string, limit: number = 10): Promise<SearchableItem[]> {
    if (!this.projectsEngine || !this.eventsEngine || !this.ngosEngine) {
      await this.initializeSearchEngines();
    }

    if (type === 'project') {
      return this.projectsEngine?.getTrending(limit) || [];
    } else if (type === 'event') {
      return this.eventsEngine?.getTrending(limit) || [];
    } else if (type === 'ngo') {
      return this.ngosEngine?.getTrending(limit) || [];
    }

    // Return trending from all types
    const [projects, events, ngos] = await Promise.all([
      this.projectsEngine?.getTrending(Math.ceil(limit / 3)) || [],
      this.eventsEngine?.getTrending(Math.ceil(limit / 3)) || [],
      this.ngosEngine?.getTrending(Math.ceil(limit / 3)) || [],
    ]);

    return [...projects, ...events, ...ngos].slice(0, limit);
  }

  /**
   * Get similar content
   */
  async getSimilarContent(itemId: string, type: string, limit: number = 5): Promise<SearchResult<SearchableItem>[]> {
    if (!this.projectsEngine || !this.eventsEngine || !this.ngosEngine) {
      await this.initializeSearchEngines();
    }

    if (type === 'project') {
      return this.projectsEngine?.findSimilar(itemId, limit) || [];
    } else if (type === 'event') {
      return this.eventsEngine?.findSimilar(itemId, limit) || [];
    } else if (type === 'ngo') {
      return this.ngosEngine?.findSimilar(itemId, limit) || [];
    }

    return [];
  }

  /**
   * Get recommended content for a user
   */
  async getRecommendedContent(userId: string, limit: number = 10): Promise<SearchableItem[]> {
    try {
      // Get user's search history to determine interests
      const history = await this.getSearchHistory(userId, 10);
      
      if (history.length === 0) {
        // Return trending content for new users
        return this.getTrendingContent(undefined, limit);
      }

      // Get most common queries
      const queries = history.map(h => h.query).slice(0, 3);
      
      // Search based on user's interests
      const results = await this.searchAll(queries.join(' '), undefined, limit);
      return results.map(r => r.item);
    } catch (error) {
      console.error('Error getting recommended content:', error);
      return this.getTrendingContent(undefined, limit);
    }
  }

  /**
   * Get search analytics (admin only)
   */
  async getSearchAnalytics(): Promise<SearchAnalytics> {
    try {
      const snapshot = await getDocs(collection(db, 'search_history'));
      
      const queries: Record<string, number> = {};
      let totalResults = 0;
      const noResultQueries: string[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const query = data.query;
        
        queries[query] = (queries[query] || 0) + 1;
        totalResults += data.resultCount || 0;
        
        if (data.resultCount === 0) {
          noResultQueries.push(query);
        }
      });

      const popularQueries = Object.entries(queries)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalSearches: snapshot.docs.length,
        popularQueries,
        averageResultCount: snapshot.docs.length > 0 ? totalResults / snapshot.docs.length : 0,
        noResultQueries: [...new Set(noResultQueries)].slice(0, 10),
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return {
        totalSearches: 0,
        popularQueries: [],
        averageResultCount: 0,
        noResultQueries: [],
      };
    }
  }

  /**
   * Refresh search indexes
   */
  async refreshIndexes() {
    this.clearCache();
    await this.initializeSearchEngines();
  }

  /**
   * Cache helpers
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const searchService = new SearchService();
