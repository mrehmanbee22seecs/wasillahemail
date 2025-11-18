/**
 * Offline Indicator Component
 * Shows online/offline status and sync information
 */

import React from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, offlineQueueSize, isSyncing, syncQueue } = usePWA();
  const [showDetails, setShowDetails] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<{ success: number; failed: number } | null>(null);

  const handleSync = async () => {
    const result = await syncQueue();
    setSyncResult({ success: result.success, failed: result.failed });
    
    // Clear result after 3 seconds
    setTimeout(() => {
      setSyncResult(null);
    }, 3000);
  };

  // Only show when offline or when there's a queue
  if (isOnline && offlineQueueSize === 0 && !syncResult) {
    return null;
  }

  return (
    <>
      {/* Main indicator */}
      <div 
        className={`fixed top-4 right-4 z-50 ${
          isOnline ? 'bg-green-600' : 'bg-orange-600'
        } text-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 cursor-pointer transition-all hover:shadow-xl`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4 animate-pulse" />
        )}
        
        <span className="text-sm font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        
        {offlineQueueSize > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs font-semibold">
            {offlineQueueSize}
          </span>
        )}
      </div>

      {/* Details panel */}
      {showDetails && (
        <div className="fixed top-16 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 w-80 animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Connection Status
            </h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Status */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    You're connected to the internet
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-orange-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    You're currently offline
                  </span>
                </>
              )}
            </div>
            
            {/* Queue info */}
            {offlineQueueSize > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Pending Items
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                  You have {offlineQueueSize} {offlineQueueSize === 1 ? 'item' : 'items'} waiting to be synced.
                  {isOnline ? ' Click sync to upload now.' : ' They will sync automatically when you\'re back online.'}
                </p>
                
                {isOnline && (
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Sync Now
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            
            {/* Sync result */}
            {syncResult && (
              <div className={`rounded-lg p-3 ${
                syncResult.failed === 0 ? 'bg-green-50 dark:bg-green-900 dark:bg-opacity-20' : 'bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20'
              }`}>
                <p className={`text-sm font-medium ${
                  syncResult.failed === 0 ? 'text-green-900 dark:text-green-300' : 'text-orange-900 dark:text-orange-300'
                }`}>
                  {syncResult.success > 0 && `✓ Synced ${syncResult.success} ${syncResult.success === 1 ? 'item' : 'items'}`}
                  {syncResult.failed > 0 && ` • ${syncResult.failed} failed`}
                </p>
              </div>
            )}
            
            {/* Offline mode info */}
            {!isOnline && (
              <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p>
                  You can continue browsing cached content. Your changes will be saved locally and synced when you're back online.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
