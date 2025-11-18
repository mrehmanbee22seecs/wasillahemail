/**
 * Subscription Types and Interfaces
 * Defines subscription plans, usage limits, and quota tracking
 */

export type SubscriptionPlan = 'free' | 'premium';

export interface SubscriptionLimits {
  maxProjects: number;
  maxEventsPerProject: number;
  features: string[];
}

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  limits: SubscriptionLimits;
  features: string[];
  color: string;
  recommended?: boolean;
}

export interface UsageStats {
  projectsCreated: number;
  eventsCreated: number;
  lastUpdated: any;
}

export interface SubscriptionData {
  userId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'inactive' | 'cancelled' | 'trial';
  startDate: any;
  endDate?: any;
  trialEndDate?: any;
  cancelledAt?: any;
  usage: UsageStats;
  billingHistory: BillingRecord[];
  createdAt: any;
  updatedAt: any;
}

export interface BillingRecord {
  id: string;
  amount: number;
  currency: string;
  date: any;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  invoiceUrl?: string;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  requiredPlan?: SubscriptionPlan;
  description?: string;
}

export interface QuotaAlert {
  type: 'warning' | 'limit_reached';
  resource: 'projects' | 'events';
  current: number;
  limit: number;
  percentage: number;
}
