/**
 * Feature Gate Component
 * Conditionally renders content based on subscription plan and feature availability
 */

import React, { ReactNode } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { FeatureName } from '../utils/featureFlags';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  feature: FeatureName;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}) => {
  const { checkFeature, planConfig } = useSubscription();

  const isAvailable = checkFeature(feature);

  if (isAvailable) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none blur-sm">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-purple-500">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Premium Feature
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upgrade to {planConfig.displayName} to unlock this feature
            </p>
            <button
              onClick={() => {
                // Navigate to pricing/upgrade page
                window.location.href = '/upgrade';
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FeatureGate;
