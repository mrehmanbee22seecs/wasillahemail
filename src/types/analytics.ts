/**
 * Analytics Types and Interfaces
 * Comprehensive analytics data structures
 */

export interface UserAnalyticsData {
  // Growth Metrics
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  userGrowthRate: number; // percentage
  
  // Engagement Metrics
  activeUsersToday: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
  averageSessionDuration: number; // minutes
  
  // Retention Metrics
  dailyRetention: number; // percentage
  weeklyRetention: number; // percentage
  monthlyRetention: number; // percentage
  churned Users: number;
  
  // User Segmentation
  usersByRole: {
    student: number;
    volunteer: number;
    ngo: number;
    admin: number;
  };
  
  // Behavior Metrics
  averageActionsPerUser: number;
  mostActiveUsers: Array<{
    userId: string;
    name: string;
    actions: number;
  }>;
  
  // Trends
  userGrowthTrend: Array<{
    date: string;
    count: number;
  }>;
}

export interface ProjectAnalyticsData {
  // Performance Metrics
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  projectCompletionRate: number; // percentage
  
  // Engagement Metrics
  totalApplications: number;
  averageApplicationsPerProject: number;
  acceptanceRate: number; // percentage
  
  // Impact Metrics
  totalVolunteersEngaged: number;
  totalPeopleImpacted: number;
  averageImpactPerProject: number;
  
  // Trends
  projectCreationTrend: Array<{
    date: string;
    count: number;
  }>;
  projectsByCategory: Array<{
    category: string;
    count: number;
  }>;
  
  // Top Performers
  topProjects: Array<{
    id: string;
    title: string;
    applications: number;
    impact: number;
  }>;
}

export interface NGOAnalyticsData {
  // Performance Metrics
  totalNGOs: number;
  activeNGOs: number;
  ngoGrowthRate: number; // percentage
  
  // Volunteer Acquisition
  totalVolunteersAcquired: number;
  averageVolunteersPerNGO: number;
  volunteerRetentionRate: number; // percentage
  
  // Project Success
  projectsCreated: number;
  projectsCompleted: number;
  projectSuccessRate: number; // percentage
  
  // Impact Metrics
  totalImpact: number;
  averageImpactPerNGO: number;
  donationsReceived: number;
  averageDonationAmount: number;
  
  // Growth Trends
  ngoGrowthTrend: Array<{
    date: string;
    count: number;
  }>;
  
  // Top Performers
  topNGOs: Array<{
    id: string;
    name: string;
    projects: number;
    volunteers: number;
    impact: number;
  }>;
}

export interface SystemAnalyticsData {
  // System Health
  systemStatus: 'healthy' | 'degraded' | 'down';
  uptime: number; // percentage
  responseTime: number; // milliseconds
  
  // Performance Metrics
  averagePageLoadTime: number; // milliseconds
  errorRate: number; // percentage
  slowQueries: number;
  
  // Usage Statistics
  totalPageViews: number;
  uniqueVisitors: number;
  averageSessionsPerUser: number;
  bounceRate: number; // percentage
  
  // Database Stats
  totalDocuments: number;
  totalReads: number;
  totalWrites: number;
  storageUsed: number; // MB
  
  // Cost Analysis
  estimatedMonthlyCost: number; // USD
  costPerUser: number; // USD
  costBreakdown: {
    firestore: number;
    storage: number;
    functions: number;
    hosting: number;
  };
  
  // Error Tracking
  recentErrors: Array<{
    timestamp: any;
    type: string;
    message: string;
    count: number;
  }>;
}

export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  label: string;
}

export interface AnalyticsFilter {
  timeRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  customRange?: AnalyticsTimeRange;
  role?: string;
  category?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TrendData {
  current: number;
  previous: number;
  change: number; // percentage
  direction: 'up' | 'down' | 'stable';
}
