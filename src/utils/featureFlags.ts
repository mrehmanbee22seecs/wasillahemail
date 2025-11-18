/**
 * Feature Flags Utility
 * Manages feature availability based on subscription plans
 */

import { SubscriptionPlan, FeatureFlag } from '../types/subscription';

// Define all available features
export const FEATURES = {
  MULTIPLE_PROJECTS: 'multiple_projects',
  UNLIMITED_EVENTS: 'unlimited_events',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  PRIORITY_SUPPORT: 'priority_support',
  CUSTOM_BRANDING: 'custom_branding',
  EXPORT_DATA: 'export_data',
  API_ACCESS: 'api_access',
  REMOVE_WATERMARK: 'remove_watermark',
} as const;

export type FeatureName = typeof FEATURES[keyof typeof FEATURES];

// Feature configuration
const featureConfig: Record<FeatureName, FeatureFlag> = {
  [FEATURES.MULTIPLE_PROJECTS]: {
    name: 'Multiple Projects',
    enabled: true,
    requiredPlan: 'premium',
    description: 'Create and manage multiple projects simultaneously',
  },
  [FEATURES.UNLIMITED_EVENTS]: {
    name: 'Unlimited Events',
    enabled: true,
    requiredPlan: 'premium',
    description: 'Create unlimited events for your projects',
  },
  [FEATURES.ADVANCED_ANALYTICS]: {
    name: 'Advanced Analytics',
    enabled: true,
    requiredPlan: 'premium',
    description: 'Access detailed analytics and insights',
  },
  [FEATURES.PRIORITY_SUPPORT]: {
    name: 'Priority Support',
    enabled: true,
    requiredPlan: 'premium',
    description: 'Get priority email and chat support',
  },
  [FEATURES.CUSTOM_BRANDING]: {
    name: 'Custom Branding',
    enabled: true,
    requiredPlan: 'premium',
    description: 'Add your organization\'s branding',
  },
  [FEATURES.EXPORT_DATA]: {
    name: 'Data Export',
    enabled: true,
    requiredPlan: 'premium',
    description: 'Export your data in various formats',
  },
  [FEATURES.API_ACCESS]: {
    name: 'API Access',
    enabled: false, // Coming soon
    requiredPlan: 'premium',
    description: 'Access our API for integrations',
  },
  [FEATURES.REMOVE_WATERMARK]: {
    name: 'Remove Watermark',
    enabled: true,
    requiredPlan: 'premium',
    description: 'Remove Wasilah branding from public pages',
  },
};

/**
 * Check if a feature is available for a given subscription plan
 */
export const isFeatureAvailable = (
  feature: FeatureName,
  currentPlan: SubscriptionPlan
): boolean => {
  const config = featureConfig[feature];
  
  if (!config || !config.enabled) {
    return false;
  }
  
  // If no plan requirement, feature is available to all
  if (!config.requiredPlan) {
    return true;
  }
  
  // Premium users have access to all features
  if (currentPlan === 'premium') {
    return true;
  }
  
  // Free users only have access to features without plan requirements
  return config.requiredPlan === 'free';
};

/**
 * Get all features available for a plan
 */
export const getAvailableFeatures = (plan: SubscriptionPlan): FeatureFlag[] => {
  return Object.values(featureConfig).filter(
    (feature) => isFeatureAvailable(feature.name as FeatureName, plan)
  );
};

/**
 * Get feature configuration
 */
export const getFeatureConfig = (feature: FeatureName): FeatureFlag | undefined => {
  return featureConfig[feature];
};

/**
 * Get all feature configurations
 */
export const getAllFeatures = (): Record<FeatureName, FeatureFlag> => {
  return featureConfig;
};
