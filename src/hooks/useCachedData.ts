/**
 * useCachedData Hook
 * Custom hook for fetching and caching data with automatic invalidation
 */

import { useState, useEffect, useCallback } from 'react';
import { memoryCache } from '../utils/caching';

interface UseCachedDataOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number; // Time to live in milliseconds
  enabled?: boolean;
  refetchOnMount?: boolean;
}

interface UseCachedDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Custom hook for fetching and caching data
 * Integrates with the application's caching layer
 */
export function useCachedData<T>({
  key,
  fetcher,
  ttl = 5 * 60 * 1000, // 5 minutes default
  enabled = true,
  refetchOnMount = false,
}: UseCachedDataOptions<T>): UseCachedDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = memoryCache.get<T>(key);
      if (cached && !refetchOnMount) {
        setData(cached);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const freshData = await fetcher();
      
      // Store in cache
      memoryCache.set(key, freshData, ttl);
      
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error(`Error fetching data for key "${key}":`, err);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, enabled, refetchOnMount]);

  const invalidate = useCallback(() => {
    memoryCache.delete(key);
  }, [key]);

  const refetch = useCallback(async () => {
    invalidate();
    await fetchData();
  }, [fetchData, invalidate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
  };
}

export default useCachedData;
