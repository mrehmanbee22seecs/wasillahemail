/**
 * Caching Layer for Performance Optimization
 * 
 * Features:
 * - In-memory cache with TTL
 * - IndexedDB cache for persistent data
 * - Cache invalidation strategies
 * - Cache warming
 * - Query result caching
 * - API response caching
 */

// In-Memory Cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 100;

  set<T>(key: string, data: T, ttl: number = 300000): void {
    // TTL in milliseconds (default 5 minutes)
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): {
    size: number;
    maxSize: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const memoryCache = new MemoryCache();

// IndexedDB Cache
const DB_NAME = 'wasilah_cache';
const DB_VERSION = 1;
const STORE_NAME = 'data_cache';

class IndexedDBCache {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('category', 'category', { unique: false });
        }
      };
    });
  }

  async set<T>(key: string, data: T, category: string = 'general', ttl: number = 3600000): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const entry = {
        key,
        data,
        category,
        timestamp: Date.now(),
        ttl,
      };

      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(entry.data as T);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async invalidateByCategory(category: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('category');
      const request = index.openCursor(IDBKeyRange.only(category));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async cleanExpired(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value;
          if (Date.now() - entry.timestamp > entry.ttl) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export const idbCache = new IndexedDBCache();

// Cache key generators
export const generateCacheKey = (...parts: (string | number | undefined)[]): string => {
  return parts.filter(Boolean).join(':');
};

export const generateQueryCacheKey = (collection: string, filters: Record<string, any>): string => {
  const filterStr = JSON.stringify(filters, Object.keys(filters).sort());
  return `query:${collection}:${filterStr}`;
};

// Cache warming
export const warmCache = async (keys: Array<{ key: string; fetcher: () => Promise<any> }>): Promise<void> => {
  const promises = keys.map(async ({ key, fetcher }) => {
    if (!memoryCache.has(key)) {
      try {
        const data = await fetcher();
        memoryCache.set(key, data);
      } catch (error) {
        console.error(`Failed to warm cache for ${key}:`, error);
      }
    }
  });

  await Promise.all(promises);
};

// Cache decorator for functions
export const cacheable = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyGenerator: (...args: Parameters<T>) => string;
    ttl?: number;
    useIndexedDB?: boolean;
  }
): T => {
  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator(...args);

    // Check memory cache first
    let cached = memoryCache.get(key);
    if (cached) return cached;

    // Check IndexedDB if enabled
    if (options.useIndexedDB) {
      cached = await idbCache.get(key);
      if (cached) {
        memoryCache.set(key, cached, options.ttl);
        return cached;
      }
    }

    // Fetch fresh data
    const result = await fn(...args);

    // Store in caches
    memoryCache.set(key, result, options.ttl);
    if (options.useIndexedDB) {
      await idbCache.set(key, result, 'api', options.ttl);
    }

    return result;
  }) as T;
};

// Stale-while-revalidate pattern
export const staleWhileRevalidate = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300000
): Promise<T> => {
  const cached = memoryCache.get<T>(key);

  if (cached) {
    // Return cached data immediately
    // Revalidate in background
    fetcher()
      .then(data => memoryCache.set(key, data, ttl))
      .catch(console.error);
    
    return cached;
  }

  // No cache, fetch and cache
  const data = await fetcher();
  memoryCache.set(key, data, ttl);
  return data;
};

// Cache statistics
export const getCacheStats = (): {
  memory: ReturnType<MemoryCache['getStats']>;
} => {
  return {
    memory: memoryCache.getStats(),
  };
};

// Initialize caching layer
export const initCaching = async (): Promise<void> => {
  try {
    await idbCache.init();
    await idbCache.cleanExpired();
    console.log('Caching layer initialized');
  } catch (error) {
    console.error('Failed to initialize caching layer:', error);
  }
};

// Export cache instances
export { memoryCache as cache };
