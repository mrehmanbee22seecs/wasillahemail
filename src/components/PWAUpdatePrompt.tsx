/**
 * PWA Update Prompt Component
 * Shows a prompt when a new version of the app is available
 */

import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const PWAUpdatePrompt: React.FC = () => {
  const { needsUpdate, updateServiceWorker } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  if (!needsUpdate || dismissed) {
    return null;
  }

  const handleUpdate = () => {
    updateServiceWorker();
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-2xl p-4 max-w-md w-full mx-4 animate-slide-down">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold mb-1">
            Update Available
          </h3>
          <p className="text-sm text-blue-100 mb-3">
            A new version of Wasillah is available. Update now to get the latest features and improvements!
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Update Now
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 bg-blue-800 bg-opacity-50 text-white rounded-lg font-medium hover:bg-opacity-70 transition-colors text-sm"
            >
              Later
            </button>
          </div>
        </div>
        
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-blue-200 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
