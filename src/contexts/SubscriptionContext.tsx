/**
 * Subscription Context
 * Manages subscription state, usage tracking, and plan limits
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import {
  SubscriptionData,
  SubscriptionPlan,
  PlanConfig,
  UsageStats,
  QuotaAlert,
} from '../types/subscription';
import { isFeatureAvailable, FeatureName } from '../utils/featureFlags';

// Plan configurations
const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  free: {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    price: 0,
    currency: 'PKR',
    interval: 'monthly',
    limits: {
      maxProjects: 1,
      maxEventsPerProject: 2,
      features: ['basic_analytics', 'community_support'],
    },
    features: [
      '1 Active Project',
      '2 Events per Project',
      'Basic Analytics',
      'Community Support',
      'Access to Knowledge Base',
    ],
    color: 'blue',
  },
  premium: {
    id: 'premium',
    name: 'premium',
    displayName: 'Premium',
    price: 0, // Pricing to be determined based on Pakistan market
    currency: 'PKR',
    interval: 'monthly',
    limits: {
      maxProjects: -1, // Unlimited
      maxEventsPerProject: -1, // Unlimited
      features: [
        'multiple_projects',
        'unlimited_events',
        'advanced_analytics',
        'priority_support',
        'custom_branding',
        'export_data',
      ],
    },
    features: [
      'Unlimited Projects',
      'Unlimited Events',
      'Advanced Analytics & Reports',
      'Priority Email Support',
      'Custom Branding',
      'Data Export (CSV, Excel)',
      'Early Access to New Features',
      'Remove Wasilah Watermark',
    ],
    color: 'purple',
    recommended: true,
  },
};

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  loading: boolean;
  planConfig: PlanConfig;
  usage: UsageStats | null;
  canCreateProject: boolean;
  canCreateEvent: (projectId?: string) => Promise<boolean>;
  checkFeature: (feature: FeatureName) => boolean;
  getQuotaAlerts: () => QuotaAlert[];
  refreshUsage: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  downgradToFree: () => Promise<void>;
  getPlanConfig: (plan: SubscriptionPlan) => PlanConfig;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageStats | null>(null);

  // Get current plan configuration
  const planConfig = subscription
    ? PLAN_CONFIGS[subscription.plan]
    : PLAN_CONFIGS.free;

  // Initialize subscription for new users
  const initializeSubscription = async (userId: string) => {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId);
      const subscriptionSnap = await getDoc(subscriptionRef);

      if (!subscriptionSnap.exists()) {
        // Create new subscription with free plan
        const newSubscription: SubscriptionData = {
          userId,
          plan: 'free',
          status: 'active',
          startDate: serverTimestamp(),
          usage: {
            projectsCreated: 0,
            eventsCreated: 0,
            lastUpdated: serverTimestamp(),
          },
          billingHistory: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(subscriptionRef, newSubscription);
        return newSubscription;
      }

      return subscriptionSnap.data() as SubscriptionData;
    } catch (error) {
      console.error('Error initializing subscription:', error);
      throw error;
    }
  };

  // Load subscription data
  useEffect(() => {
    const loadSubscription = async () => {
      if (!currentUser) {
        setSubscription(null);
        setUsage(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const subscriptionData = await initializeSubscription(currentUser.uid);
        setSubscription(subscriptionData);
        setUsage(subscriptionData.usage);
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [currentUser]);

  // Refresh usage statistics
  const refreshUsage = async () => {
    if (!currentUser) return;

    try {
      // Count active projects
      const projectsQuery = query(
        collection(db, 'project_submissions'),
        where('submittedBy', '==', currentUser.uid),
        where('status', '==', 'approved')
      );
      const projectsSnap = await getDocs(projectsQuery);
      const projectsCreated = projectsSnap.size;

      // Count events across all projects
      const eventsQuery = query(
        collection(db, 'event_submissions'),
        where('submittedBy', '==', currentUser.uid),
        where('status', '==', 'approved')
      );
      const eventsSnap = await getDocs(eventsQuery);
      const eventsCreated = eventsSnap.size;

      const newUsage: UsageStats = {
        projectsCreated,
        eventsCreated,
        lastUpdated: serverTimestamp(),
      };

      // Update Firestore
      const subscriptionRef = doc(db, 'subscriptions', currentUser.uid);
      await updateDoc(subscriptionRef, {
        usage: newUsage,
        updatedAt: serverTimestamp(),
      });

      setUsage(newUsage);
      
      // Update subscription state
      if (subscription) {
        setSubscription({
          ...subscription,
          usage: newUsage,
        });
      }
    } catch (error) {
      console.error('Error refreshing usage:', error);
    }
  };

  // Check if user can create a new project
  const canCreateProject = React.useMemo(() => {
    if (!subscription || !usage) return true; // Allow if loading

    const { maxProjects } = planConfig.limits;
    
    // Unlimited projects
    if (maxProjects === -1) return true;
    
    // Check against limit
    return usage.projectsCreated < maxProjects;
  }, [subscription, usage, planConfig]);

  // Check if user can create a new event
  const canCreateEvent = async (projectId?: string): Promise<boolean> => {
    if (!subscription || !usage || !currentUser) return true;

    const { maxEventsPerProject } = planConfig.limits;
    
    // Unlimited events
    if (maxEventsPerProject === -1) return true;

    // Count events for specific project if provided
    if (projectId) {
      try {
        const eventsQuery = query(
          collection(db, 'event_submissions'),
          where('submittedBy', '==', currentUser.uid),
          where('projectId', '==', projectId),
          where('status', '==', 'approved')
        );
        const eventsSnap = await getDocs(eventsQuery);
        return eventsSnap.size < maxEventsPerProject;
      } catch (error) {
        console.error('Error checking event limit:', error);
        return false;
      }
    }

    // General check against total events
    return usage.eventsCreated < (planConfig.limits.maxProjects * maxEventsPerProject);
  };

  // Check feature availability
  const checkFeature = (feature: FeatureName): boolean => {
    if (!subscription) return false;
    return isFeatureAvailable(feature, subscription.plan);
  };

  // Get quota alerts
  const getQuotaAlerts = (): QuotaAlert[] => {
    if (!subscription || !usage) return [];

    const alerts: QuotaAlert[] = [];
    const { maxProjects, maxEventsPerProject } = planConfig.limits;

    // Check projects quota
    if (maxProjects > 0) {
      const projectPercentage = (usage.projectsCreated / maxProjects) * 100;
      
      if (projectPercentage >= 100) {
        alerts.push({
          type: 'limit_reached',
          resource: 'projects',
          current: usage.projectsCreated,
          limit: maxProjects,
          percentage: 100,
        });
      } else if (projectPercentage >= 80) {
        alerts.push({
          type: 'warning',
          resource: 'projects',
          current: usage.projectsCreated,
          limit: maxProjects,
          percentage: projectPercentage,
        });
      }
    }

    // Check events quota
    const totalEventLimit = maxProjects * maxEventsPerProject;
    if (maxEventsPerProject > 0 && totalEventLimit > 0) {
      const eventPercentage = (usage.eventsCreated / totalEventLimit) * 100;
      
      if (eventPercentage >= 100) {
        alerts.push({
          type: 'limit_reached',
          resource: 'events',
          current: usage.eventsCreated,
          limit: totalEventLimit,
          percentage: 100,
        });
      } else if (eventPercentage >= 80) {
        alerts.push({
          type: 'warning',
          resource: 'events',
          current: usage.eventsCreated,
          limit: totalEventLimit,
          percentage: eventPercentage,
        });
      }
    }

    return alerts;
  };

  // Upgrade to premium
  const upgradeToPremium = async () => {
    if (!currentUser || !subscription) return;

    try {
      const subscriptionRef = doc(db, 'subscriptions', currentUser.uid);
      await updateDoc(subscriptionRef, {
        plan: 'premium',
        status: 'active',
        updatedAt: serverTimestamp(),
      });

      setSubscription({
        ...subscription,
        plan: 'premium',
        status: 'active',
      });
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  };

  // Downgrade to free
  const downgradToFree = async () => {
    if (!currentUser || !subscription) return;

    try {
      const subscriptionRef = doc(db, 'subscriptions', currentUser.uid);
      await updateDoc(subscriptionRef, {
        plan: 'free',
        status: 'active',
        updatedAt: serverTimestamp(),
      });

      setSubscription({
        ...subscription,
        plan: 'free',
        status: 'active',
      });
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      throw error;
    }
  };

  // Get plan configuration
  const getPlanConfig = (plan: SubscriptionPlan): PlanConfig => {
    return PLAN_CONFIGS[plan];
  };

  const value: SubscriptionContextType = {
    subscription,
    loading,
    planConfig,
    usage,
    canCreateProject,
    canCreateEvent,
    checkFeature,
    getQuotaAlerts,
    refreshUsage,
    upgradeToPremium,
    downgradToFree,
    getPlanConfig,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
