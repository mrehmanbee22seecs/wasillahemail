/**
 * Offline Manager Utility
 * Handles offline data caching, form submission queue, and synchronization
 */

import { collection, doc, setDoc, getDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Offline queue storage key
const OFFLINE_QUEUE_KEY = 'wasillah_offline_queue';
const OFFLINE_DATA_KEY = 'wasillah_offline_data';

interface QueuedRequest {
  id: string;
  type: 'submission' | 'application' | 'update';
  data: any;
  timestamp: number;
  retries: number;
}

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiry?: number;
}

/**
 * Check if the browser is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Get offline queue from localStorage
 */
export const getOfflineQueue = (): QueuedRequest[] => {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error reading offline queue:', error);
    return [];
  }
};

/**
 * Add item to offline queue
 */
export const addToOfflineQueue = (type: QueuedRequest['type'], data: any): string => {
  const queue = getOfflineQueue();
  const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const queuedRequest: QueuedRequest = {
    id,
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  };
  
  queue.push(queuedRequest);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  
  console.log(`Added ${type} to offline queue:`, id);
  return id;
};

/**
 * Remove item from offline queue
 */
export const removeFromOfflineQueue = (id: string): void => {
  const queue = getOfflineQueue();
  const updated = queue.filter(item => item.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  console.log('Removed from offline queue:', id);
};

/**
 * Process offline queue when back online
 */
export const processOfflineQueue = async (): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> => {
  if (!isOnline()) {
    console.log('Cannot process offline queue: still offline');
    return { success: 0, failed: 0, errors: [] };
  }

  const queue = getOfflineQueue();
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  console.log(`Processing ${queue.length} items from offline queue...`);

  for (const item of queue) {
    try {
      await processQueuedItem(item);
      removeFromOfflineQueue(item.id);
      results.success++;
      console.log(`Successfully processed: ${item.id}`);
    } catch (error) {
      console.error(`Failed to process ${item.id}:`, error);
      results.failed++;
      results.errors.push(`${item.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Update retry count
      item.retries++;
      if (item.retries >= 3) {
        // Remove after 3 retries
        removeFromOfflineQueue(item.id);
        console.log(`Removed ${item.id} after 3 failed retries`);
      } else {
        // Update queue with new retry count
        const queue = getOfflineQueue();
        const index = queue.findIndex(q => q.id === item.id);
        if (index !== -1) {
          queue[index] = item;
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        }
      }
    }
  }

  return results;
};

/**
 * Process a single queued item
 */
const processQueuedItem = async (item: QueuedRequest): Promise<void> => {
  switch (item.type) {
    case 'submission':
      await processSubmission(item.data);
      break;
    case 'application':
      await processApplication(item.data);
      break;
    case 'update':
      await processUpdate(item.data);
      break;
    default:
      throw new Error(`Unknown queue item type: ${item.type}`);
  }
};

/**
 * Process queued submission
 */
const processSubmission = async (data: any): Promise<void> => {
  const submissionRef = doc(collection(db, 'submissions'), data.id || `sub_${Date.now()}`);
  await setDoc(submissionRef, {
    ...data,
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now(),
    syncedAt: Timestamp.now(),
    wasOffline: true,
  });
};

/**
 * Process queued application
 */
const processApplication = async (data: any): Promise<void> => {
  const applicationRef = doc(collection(db, 'applications'), data.id || `app_${Date.now()}`);
  await setDoc(applicationRef, {
    ...data,
    createdAt: data.createdAt || Timestamp.now(),
    syncedAt: Timestamp.now(),
    wasOffline: true,
  });
};

/**
 * Process queued update
 */
const processUpdate = async (data: any): Promise<void> => {
  const { collection: collectionName, id, ...updateData } = data;
  const docRef = doc(db, collectionName, id);
  await setDoc(docRef, {
    ...updateData,
    updatedAt: Timestamp.now(),
    syncedAt: Timestamp.now(),
  }, { merge: true });
};

/**
 * Cache data for offline use
 */
export const cacheData = (key: string, data: any, expiryMinutes?: number): void => {
  try {
    const cached = getCachedData();
    const cachedItem: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiry: expiryMinutes ? Date.now() + (expiryMinutes * 60 * 1000) : undefined,
    };
    cached[key] = cachedItem;
    localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(cached));
  } catch (error) {
    console.error('Error caching data:', error);
  }
};

/**
 * Get cached data
 */
export const getCachedDataItem = (key: string): any | null => {
  try {
    const cached = getCachedData();
    const item = cached[key];
    
    if (!item) return null;
    
    // Check expiry
    if (item.expiry && Date.now() > item.expiry) {
      delete cached[key];
      localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(cached));
      return null;
    }
    
    return item.data;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

/**
 * Get all cached data
 */
const getCachedData = (): Record<string, CachedData> => {
  try {
    const cached = localStorage.getItem(OFFLINE_DATA_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading cached data:', error);
    return {};
  }
};

/**
 * Clear expired cached data
 */
export const clearExpiredCache = (): void => {
  try {
    const cached = getCachedData();
    const now = Date.now();
    let hasChanges = false;
    
    Object.keys(cached).forEach(key => {
      if (cached[key].expiry && now > cached[key].expiry) {
        delete cached[key];
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(cached));
      console.log('Cleared expired cache items');
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
};

/**
 * Clear all offline data
 */
export const clearOfflineData = (): void => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  localStorage.removeItem(OFFLINE_DATA_KEY);
  console.log('Cleared all offline data');
};

/**
 * Get offline storage stats
 */
export const getOfflineStats = (): {
  queueSize: number;
  cacheSize: number;
  oldestItem?: number;
} => {
  const queue = getOfflineQueue();
  const cached = getCachedData();
  const cacheKeys = Object.keys(cached);
  
  let oldestItem: number | undefined;
  if (queue.length > 0) {
    oldestItem = Math.min(...queue.map(item => item.timestamp));
  }
  
  return {
    queueSize: queue.length,
    cacheSize: cacheKeys.length,
    oldestItem,
  };
};

/**
 * Listen for online/offline events
 */
export const setupOfflineListeners = (
  onOnline?: () => void,
  onOffline?: () => void
): (() => void) => {
  const handleOnline = async () => {
    console.log('Browser is online - processing queue...');
    if (onOnline) onOnline();
    
    // Process offline queue
    try {
      const results = await processOfflineQueue();
      console.log('Queue processing results:', results);
      
      if (results.success > 0) {
        // Notify user of successful sync
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'QUEUE_PROCESSED',
            data: results,
          });
        }
      }
    } catch (error) {
      console.error('Error processing offline queue:', error);
    }
  };
  
  const handleOffline = () => {
    console.log('Browser is offline - enabling offline mode...');
    if (onOffline) onOffline();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Register service worker for background sync
 */
export const registerBackgroundSync = async (tag: string): Promise<void> => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  } else {
    console.log('Background sync not supported');
  }
};
