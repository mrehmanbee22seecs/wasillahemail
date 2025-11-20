/**
 * PWA Install Prompt Component
 * Shows a prompt to install the app as a PWA
 */

import React from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, installPWA } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  // Don't show if already installed or dismissed
  if (!isInstallable || isInstalled || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installPWA();
    if (!success) {
      setDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-blue-900 text-white rounded-lg shadow-2xl p-4 animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            Install Wasillah
          </h3>
          <p className="text-sm text-blue-100 mb-3">
            Install our app for quick access, offline support, and push notifications!
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-white text-blue-900 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm"
            >
              Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 bg-blue-800 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Not Now
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
