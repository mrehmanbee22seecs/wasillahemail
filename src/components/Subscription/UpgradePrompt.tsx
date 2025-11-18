/**
 * Upgrade Prompt Component
 * Shows prompts when users reach usage limits or try to access premium features
 */

import React from 'react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { X, Sparkles, ArrowRight, Check } from 'lucide-react';
import { QuotaAlert } from '../../types/subscription';

interface UpgradePromptProps {
  trigger?: 'quota' | 'feature' | 'general';
  resource?: 'projects' | 'events';
  featureName?: string;
  onClose?: () => void;
  inline?: boolean;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  trigger = 'general',
  resource,
  featureName,
  onClose,
  inline = false,
}) => {
  const { planConfig, usage, getPlanConfig } = useSubscription();
  const premiumPlan = getPlanConfig('premium');

  // Don't show for premium users
  if (planConfig.id === 'premium') {
    return null;
  }

  const getTitle = () => {
    switch (trigger) {
      case 'quota':
        return resource === 'projects'
          ? 'Project Limit Reached'
          : 'Event Limit Reached';
      case 'feature':
        return 'Premium Feature';
      default:
        return 'Upgrade to Premium';
    }
  };

  const getMessage = () => {
    switch (trigger) {
      case 'quota':
        if (resource === 'projects') {
          return `You've reached your limit of ${planConfig.limits.maxProjects} project${
            planConfig.limits.maxProjects > 1 ? 's' : ''
          }. Upgrade to Premium for unlimited projects.`;
        }
        return `You've reached your limit of ${planConfig.limits.maxEventsPerProject} event${
          planConfig.limits.maxEventsPerProject > 1 ? 's' : ''
        } per project. Upgrade to Premium for unlimited events.`;
      case 'feature':
        return `"${featureName}" is a Premium feature. Upgrade to unlock advanced capabilities.`;
      default:
        return 'Unlock unlimited projects, events, and premium features with our Premium plan.';
    }
  };

  const content = (
    <div className={`${inline ? '' : 'bg-white dark:bg-gray-800 rounded-lg shadow-xl'} ${onClose ? 'relative' : ''}`}>
      {onClose && !inline && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className={inline ? 'p-4' : 'p-6 sm:p-8'}>
        {/* Icon and Title */}
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
          {getTitle()}
        </h3>

        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          {getMessage()}
        </p>

        {/* Current vs Premium Comparison */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current Plan:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {planConfig.displayName}
            </span>
          </div>

          {trigger === 'quota' && usage && (
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {resource === 'projects' ? 'Projects' : 'Events'} Used:
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {resource === 'projects'
                  ? `${usage.projectsCreated} / ${planConfig.limits.maxProjects}`
                  : `${usage.eventsCreated} / ${planConfig.limits.maxEventsPerProject * planConfig.limits.maxProjects}`}
              </span>
            </div>
          )}
        </div>

        {/* Premium Benefits */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-6 border border-purple-200 dark:border-purple-800">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            With Premium, you get:
          </h4>
          <ul className="space-y-2">
            {premiumPlan.features.slice(0, 5).map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="text-center mb-6">
          <div className="inline-block">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Starting at</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {premiumPlan.price === 0 ? (
                <>
                  Coming Soon
                  <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                    Try it free now!
                  </span>
                </>
              ) : (
                <>
                  PKR {premiumPlan.price.toLocaleString()}
                  <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                    /month
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/upgrade"
            className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
          >
            Upgrade Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          )}
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          No credit card required. Cancel anytime.
        </p>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  // Modal version
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {content}
      </div>
    </div>
  );
};

// Compact version for inline use
export const CompactUpgradePrompt: React.FC<{
  message?: string;
  className?: string;
}> = ({ message, className = '' }) => {
  const { planConfig } = useSubscription();

  if (planConfig.id === 'premium') {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white ${className}`}
    >
      <div className="flex items-center">
        <Sparkles className="w-5 h-5 mr-3" />
        <span className="font-medium">
          {message || 'Upgrade to Premium for unlimited access'}
        </span>
      </div>
      <a
        href="/upgrade"
        className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
      >
        Upgrade
      </a>
    </div>
  );
};

export default UpgradePrompt;
