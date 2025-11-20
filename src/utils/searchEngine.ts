/**
 * Advanced Search Engine using Fuse.js
 * Provides client-side full-text search with fuzzy matching
 */

import Fuse from 'fuse.js';

export interface SearchableItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  location?: string;
  author?: string;
  date?: string;
  type: 'project' | 'event' | 'ngo' | 'volunteer';
  [key: string]: any;
}

export interface SearchFilters {
  category?: string;
  location?: string;
  type?: string;
  dateRange?: { start: Date; end: Date };
  tags?: string[];
}

export interface SearchOptions {
  threshold?: number; // 0.0 = perfect match, 1.0 = match anything
  includeScore?: boolean;
  limit?: number;
  filters?: SearchFilters;
}

export interface SearchResult<T> {
  item: T;
  score?: number;
  matches?: any[];
}

/**
 * Search Engine Class
 */
export class SearchEngine<T extends SearchableItem> {
  private fuse: Fuse<T> | null = null;
  private data: T[] = [];
  
  constructor(data: T[] = []) {
    this.data = data;
    this.initializeFuse();
  }

  /**
   * Initialize Fuse.js with configuration
   */
  private initializeFuse() {
    const fuseOptions: Fuse.IFuseOptions<T> = {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'category', weight: 0.2 },
        { name: 'tags', weight: 0.1 },
        { name: 'location', weight: 0.1 },
        { name: 'author', weight: 0.05 },
      ],
      threshold: 0.4, // Default threshold for fuzzy matching
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
      useExtendedSearch: true,
    };

    this.fuse = new Fuse(this.data, fuseOptions);
  }

  /**
   * Update the searchable data
   */
  updateData(newData: T[]) {
    this.data = newData;
    this.initializeFuse();
  }

  /**
   * Add items to the search index
   */
  addItems(items: T[]) {
    this.data = [...this.data, ...items];
    this.initializeFuse();
  }

  /**
   * Remove item from search index
   */
  removeItem(id: string) {
    this.data = this.data.filter(item => item.id !== id);
    this.initializeFuse();
  }

  /**
   * Main search function
   */
  search(query: string, options: SearchOptions = {}): SearchResult<T>[] {
    if (!this.fuse || !query.trim()) {
      return this.getAllItems(options.limit);
    }

    const {
      threshold = 0.4,
      includeScore = true,
      limit = 50,
      filters,
    } = options;

    // Update Fuse options if needed
    if (threshold !== 0.4 || !includeScore) {
      this.fuse.setCollection(this.data);
    }

    // Perform the search
    let results = this.fuse.search(query);

    // Map results to our format
    let searchResults: SearchResult<T>[] = results.map((result: any) => ({
      item: result.item,
      score: result.score,
      matches: result.matches,
    }));

    // Apply filters if provided
    if (filters) {
      searchResults = this.applyFilters(searchResults, filters);
    }

    // Apply limit
    return searchResults.slice(0, limit);
  }

  /**
   * Search with advanced filters
   */
  advancedSearch(query: string, filters: SearchFilters, options: SearchOptions = {}): SearchResult<T>[] {
    return this.search(query, { ...options, filters });
  }

  /**
   * Get search suggestions (auto-complete)
   */
  getSuggestions(query: string, limit: number = 10): string[] {
    if (!query.trim() || !this.fuse) {
      return [];
    }

    const results = this.fuse.search(query, { limit });
    return results.map((result: any) => result.item.title);
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(results: SearchResult<T>[], filters: SearchFilters): SearchResult<T>[] {
    return results.filter(result => {
      const item = result.item;

      // Filter by category
      if (filters.category && item.category !== filters.category) {
        return false;
      }

      // Filter by location
      if (filters.location && item.location !== filters.location) {
        return false;
      }

      // Filter by type
      if (filters.type && item.type !== filters.type) {
        return false;
      }

      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        if (!item.tags || !filters.tags.some(tag => item.tags?.includes(tag))) {
          return false;
        }
      }

      // Filter by date range
      if (filters.dateRange && item.date) {
        const itemDate = new Date(item.date);
        if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get all items (with optional limit)
   */
  private getAllItems(limit?: number): SearchResult<T>[] {
    const items = limit ? this.data.slice(0, limit) : this.data;
    return items.map(item => ({ item }));
  }

  /**
   * Get similar items based on an item
   */
  findSimilar(itemId: string, limit: number = 5): SearchResult<T>[] {
    const targetItem = this.data.find(item => item.id === itemId);
    if (!targetItem || !this.fuse) {
      return [];
    }

    // Search using the item's title and tags
    const query = `${targetItem.title} ${targetItem.tags?.join(' ') || ''}`;
    const results = this.search(query, { limit: limit + 1 });

    // Remove the target item from results
    return results.filter(result => result.item.id !== itemId).slice(0, limit);
  }

  /**
   * Get trending items (based on recent and popular)
   */
  getTrending(limit: number = 10): T[] {
    // Sort by date (most recent) and return
    return [...this.data]
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  /**
   * Get total count of indexed items
   */
  getCount(): number {
    return this.data.length;
  }

  /**
   * Clear all data
   */
  clear() {
    this.data = [];
    this.initializeFuse();
  }
}

/**
 * Create a search engine instance
 */
export function createSearchEngine<T extends SearchableItem>(data: T[] = []): SearchEngine<T> {
  return new SearchEngine<T>(data);
}

/**
 * Rank search results by relevance
 */
export function rankResults<T>(results: SearchResult<T>[]): SearchResult<T>[] {
  return results.sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreA - scoreB; // Lower score = better match
  });
}

/**
 * Highlight matches in text
 */
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Extract keywords from query
 */
export function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Build search query with operators
 */
export function buildQuery(terms: string[], operator: 'AND' | 'OR' = 'OR'): string {
  if (operator === 'AND') {
    return terms.map(term => `'${term}`).join(' ');
  }
  return terms.join(' | ');
}
