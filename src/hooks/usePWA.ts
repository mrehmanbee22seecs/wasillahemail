/**
 * usePWA Hook
 * React hook for Progressive Web App functionality
 */

import { useState, useEffect, useCallback } from 'react';
import {
  setupOfflineListeners,
  isOnline,
  processOfflineQueue,
  getOfflineStats,
  addToOfflineQueue,
  registerBackgroundSync,
  clearExpiredCache,
} from '../utils/offlineManager';

interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  needsUpdate: boolean;
  offlineQueueSize: number;
  isSyncing: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstallable: false,
    isInstalled: false,
    needsUpdate: false,
    offlineQueueSize: 0,
    isSyncing: false,
  });

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateWaiting, setUpdateWaiting] = useState<ServiceWorker | null>(null);

  // Update offline queue size
  const updateQueueSize = useCallback(() => {
    const stats = getOfflineStats();
    setState(prev => ({
      ...prev,
      offlineQueueSize: stats.queueSize,
    }));
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const cleanup = setupOfflineListeners(
      () => {
        setState(prev => ({ ...prev, isOnline: true }));
        updateQueueSize();
      },
      () => {
        setState(prev => ({ ...prev, isOnline: false }));
      }
    );

    return cleanup;
  }, [updateQueueSize]);

  // Check if PWA is installed
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setState(prev => ({
        ...prev,
        isInstalled: isStandalone || isIOSStandalone,
      }));
    };

    checkInstalled();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);
    
    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle app installed
  useEffect(() => {
    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
      setState(prev => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
      }));
      setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available');
                  setUpdateWaiting(newWorker);
                  setState(prev => ({ ...prev, needsUpdate: true }));
                }
              });
            }
          });

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data);
        
        if (event.data.type === 'SYNC_SUCCESS') {
          updateQueueSize();
        }
        
        if (event.data.type === 'QUEUE_PROCESSED') {
          updateQueueSize();
        }
      });
    }

    // Clear expired cache on mount
    clearExpiredCache();

    // Update queue size on mount
    updateQueueSize();
  }, [updateQueueSize]);

  // Sync offline queue
  const syncQueue = useCallback(async (): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> => {
    if (!isOnline()) {
      return { success: 0, failed: 0, errors: ['Device is offline'] };
    }

    setState(prev => ({ ...prev, isSyncing: true }));

    try {
      const results = await processOfflineQueue();
      updateQueueSize();
      return results;
    } catch (error) {
      console.error('Error syncing queue:', error);
      return {
        success: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [updateQueueSize]);

  // Install PWA
  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      console.log('Install prompt not available');
      return false;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted install prompt');
        setInstallPrompt(null);
        setState(prev => ({ ...prev, isInstallable: false }));
        return true;
      } else {
        console.log('User dismissed install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }, [installPrompt]);

  // Update service worker
  const updateServiceWorker = useCallback(() => {
    if (updateWaiting) {
      updateWaiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateWaiting(null);
      setState(prev => ({ ...prev, needsUpdate: false }));
      
      // Reload page to use new service worker
      window.location.reload();
    }
  }, [updateWaiting]);

  // Queue item for offline submission
  const queueForOffline = useCallback((type: 'submission' | 'application' | 'update', data: any): string => {
    const id = addToOfflineQueue(type, data);
    updateQueueSize();
    
    // Register background sync
    registerBackgroundSync(`sync-${type}s`);
    
    return id;
  }, [updateQueueSize]);

  // Request push notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }, []);

  // Show notification
  const showNotification = useCallback(async (title: string, options?: NotificationOptions): Promise<void> => {
    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Show notification via service worker (persists in background)
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options,
        });
      } else {
        // Fallback to regular notification
        new Notification(title, options);
      }
    }
  }, [requestNotificationPermission]);

  return {
    ...state,
    installPWA,
    updateServiceWorker,
    syncQueue,
    queueForOffline,
    requestNotificationPermission,
    showNotification,
  };
};
