/**
 * useSearch Hook
 * React hook for search functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchService, SearchHistoryItem, SavedSearch } from '../services/searchService';
import { SearchableItem, SearchFilters, SearchResult } from '../utils/searchEngine';
import { useAuth } from '../contexts/AuthContext';

export interface UseSearchOptions {
  type?: 'all' | 'project' | 'event' | 'ngo';
  autoSearch?: boolean;
  debounceMs?: number;
  saveHistory?: boolean;
}

export interface UseSearchReturn {
  // Search state
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult<SearchableItem>[];
  isSearching: boolean;
  error: string | null;
  
  // Filters
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  clearFilters: () => void;
  
  // Actions
  search: (q?: string) => Promise<void>;
  clearResults: () => void;
  
  // Suggestions
  suggestions: string[];
  getSuggestions: (q: string) => Promise<void>;
  
  // History
  searchHistory: SearchHistoryItem[];
  clearHistory: () => Promise<void>;
  
  // Saved searches
  savedSearches: SavedSearch[];
  saveCurrentSearch: (name: string) => Promise<void>;
  loadSavedSearch: (search: SavedSearch) => Promise<void>;
  deleteSavedSearch: (searchId: string) => Promise<void>;
  
  // Discovery
  trendingContent: SearchableItem[];
  recommendedContent: SearchableItem[];
  refreshTrending: () => Promise<void>;
  refreshRecommended: () => Promise<void>;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    type = 'all',
    autoSearch = false,
    debounceMs = 300,
    saveHistory = true,
  } = options;

  const { user } = useAuth();
  
  // State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult<SearchableItem>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [trendingContent, setTrendingContent] = useState<SearchableItem[]>([]);
  const [recommendedContent, setRecommendedContent] = useState<SearchableItem[]>([]);
  
  // Refs
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const initialized = useRef(false);

  /**
   * Initialize search service
   */
  useEffect(() => {
    if (!initialized.current) {
      searchService.initializeSearchEngines().catch(console.error);
      initialized.current = true;
    }
  }, []);

  /**
   * Load user data
   */
  useEffect(() => {
    if (user) {
      loadSearchHistory();
      loadSavedSearches();
      loadRecommendedContent();
    }
  }, [user]);

  /**
   * Load trending content on mount
   */
  useEffect(() => {
    loadTrendingContent();
  }, [type]);

  /**
   * Auto-search on query change (with debounce)
   */
  useEffect(() => {
    if (autoSearch && query.trim()) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        search(query);
      }, debounceMs);
      
      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }
  }, [query, autoSearch, debounceMs]);

  /**
   * Main search function
   */
  const search = useCallback(async (q?: string) => {
    const searchQuery = q || query;
    
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      let searchResults: SearchResult<SearchableItem>[] = [];

      switch (type) {
        case 'project':
          searchResults = await searchService.searchProjects(searchQuery, filters);
          break;
        case 'event':
          searchResults = await searchService.searchEvents(searchQuery, filters);
          break;
        case 'ngo':
          searchResults = await searchService.searchNGOs(searchQuery, filters);
          break;
        default:
          searchResults = await searchService.searchAll(searchQuery, filters);
      }

      setResults(searchResults);

      // Save to history
      if (saveHistory && user) {
        await searchService.saveToHistory(user.uid, searchQuery, filters, searchResults.length);
        await loadSearchHistory();
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, type, filters, saveHistory, user]);

  /**
   * Get search suggestions
   */
  const getSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const suggestionList = await searchService.getSuggestions(
        q,
        type === 'all' ? undefined : type
      );
      setSuggestions(suggestionList);
    } catch (err) {
      console.error('Error getting suggestions:', err);
      setSuggestions([]);
    }
  }, [type]);

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setQuery('');
    setError(null);
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Load search history
   */
  const loadSearchHistory = useCallback(async () => {
    if (!user) return;

    try {
      const history = await searchService.getSearchHistory(user.uid);
      setSearchHistory(history);
    } catch (err) {
      console.error('Error loading search history:', err);
    }
  }, [user]);

  /**
   * Clear search history
   */
  const clearHistory = useCallback(async () => {
    if (!user) return;

    try {
      await searchService.clearSearchHistory(user.uid);
      setSearchHistory([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  }, [user]);

  /**
   * Load saved searches
   */
  const loadSavedSearches = useCallback(async () => {
    if (!user) return;

    try {
      const searches = await searchService.getSavedSearches(user.uid);
      setSavedSearches(searches);
    } catch (err) {
      console.error('Error loading saved searches:', err);
    }
  }, [user]);

  /**
   * Save current search
   */
  const saveCurrentSearch = useCallback(async (name: string) => {
    if (!user || !query.trim()) return;

    try {
      await searchService.saveSearch(user.uid, name, query, filters);
      await loadSavedSearches();
    } catch (err) {
      console.error('Error saving search:', err);
      throw err;
    }
  }, [user, query, filters, loadSavedSearches]);

  /**
   * Load a saved search
   */
  const loadSavedSearch = useCallback(async (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters || {});
    
    // Update last used
    await searchService.updateSavedSearchUsage(savedSearch.id);
    
    // Perform search
    await search(savedSearch.query);
  }, [search]);

  /**
   * Delete a saved search
   */
  const deleteSavedSearch = useCallback(async (searchId: string) => {
    try {
      await searchService.deleteSavedSearch(searchId);
      await loadSavedSearches();
    } catch (err) {
      console.error('Error deleting saved search:', err);
    }
  }, [loadSavedSearches]);

  /**
   * Load trending content
   */
  const loadTrendingContent = useCallback(async () => {
    try {
      const trending = await searchService.getTrendingContent(
        type === 'all' ? undefined : type
      );
      setTrendingContent(trending);
    } catch (err) {
      console.error('Error loading trending content:', err);
    }
  }, [type]);

  /**
   * Load recommended content
   */
  const loadRecommendedContent = useCallback(async () => {
    if (!user) return;

    try {
      const recommended = await searchService.getRecommendedContent(user.uid);
      setRecommendedContent(recommended);
    } catch (err) {
      console.error('Error loading recommended content:', err);
    }
  }, [user]);

  /**
   * Refresh trending content
   */
  const refreshTrending = useCallback(async () => {
    await searchService.refreshIndexes();
    await loadTrendingContent();
  }, [loadTrendingContent]);

  /**
   * Refresh recommended content
   */
  const refreshRecommended = useCallback(async () => {
    await loadRecommendedContent();
  }, [loadRecommendedContent]);

  return {
    // Search state
    query,
    setQuery,
    results,
    isSearching,
    error,
    
    // Filters
    filters,
    setFilters,
    clearFilters,
    
    // Actions
    search,
    clearResults,
    
    // Suggestions
    suggestions,
    getSuggestions,
    
    // History
    searchHistory,
    clearHistory,
    
    // Saved searches
    savedSearches,
    saveCurrentSearch,
    loadSavedSearch,
    deleteSavedSearch,
    
    // Discovery
    trendingContent,
    recommendedContent,
    refreshTrending,
    refreshRecommended,
  };
}
