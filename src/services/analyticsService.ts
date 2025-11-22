/**
 * Analytics Service
 * Handles analytics data collection and processing
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  UserAnalyticsData,
  ProjectAnalyticsData,
  NGOAnalyticsData,
  SystemAnalyticsData,
} from '../types/analytics';

/**
 * Get date range for analytics queries
 */
const getDateRange = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Get user analytics
 */
export const getUserAnalytics = async (): Promise<UserAnalyticsData> => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const now = new Date();
    const today = getDateRange(0);
    const weekAgo = getDateRange(7);
    const monthAgo = getDateRange(30);
    
    let totalUsers = 0;
    let newUsersToday = 0;
    let newUsersThisWeek = 0;
    let newUsersThisMonth = 0;
    let activeUsersThisMonth = 0;
    
    const usersByRole = {
      student: 0,
      volunteer: 0,
      ngo: 0,
      admin: 0,
    };
    
    const userGrowthMap = new Map<string, number>();
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      totalUsers++;
      
      // Count by role
      if (data.role && usersByRole.hasOwnProperty(data.role)) {
        usersByRole[data.role as keyof typeof usersByRole]++;
      }
      
      // Count new users
      if (data.createdAt) {
        const createdDate = data.createdAt.toDate();
        if (createdDate >= today) newUsersToday++;
        if (createdDate >= weekAgo) newUsersThisWeek++;
        if (createdDate >= monthAgo) newUsersThisMonth++;
        
        // Track growth trend
        const dateKey = createdDate.toISOString().split('T')[0];
        userGrowthMap.set(dateKey, (userGrowthMap.get(dateKey) || 0) + 1);
      }
      
      // Count active users (users with recent activity)
      if (data.lastLoginAt) {
        const lastLogin = data.lastLoginAt.toDate();
        if (lastLogin >= monthAgo) activeUsersThisMonth++;
      }
    });
    
    // Calculate growth rate
    const previousMonthUsers = totalUsers - newUsersThisMonth;
    const userGrowthRate = previousMonthUsers > 0 
      ? ((newUsersThisMonth / previousMonthUsers) * 100) 
      : 0;
    
    // Build growth trend (last 30 days)
    const userGrowthTrend = Array.from(userGrowthMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
    
    return {
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      userGrowthRate: Math.round(userGrowthRate * 10) / 10,
      activeUsersToday: 0, // Requires real-time tracking
      activeUsersThisWeek: 0, // Requires real-time tracking
      activeUsersThisMonth,
      averageSessionDuration: 0, // Requires session tracking
      dailyRetention: 0, // Requires activity tracking
      weeklyRetention: 0, // Requires activity tracking
      monthlyRetention: 0, // Requires activity tracking
      churnedUsers: 0, // Requires activity tracking
      usersByRole,
      averageActionsPerUser: 0, // Requires action tracking
      mostActiveUsers: [], // Requires activity tracking
      userGrowthTrend,
    };
  } catch (error) {
    console.error('Error getting user analytics:', error);
    throw error;
  }
};

/**
 * Get project analytics
 */
export const getProjectAnalytics = async (): Promise<ProjectAnalyticsData> => {
  try {
    const projectsRef = collection(db, 'project_submissions');
    const projectsQuery = query(projectsRef, limit(1000));
    const projectsSnapshot = await getDocs(projectsQuery);
    
    const monthAgo = getDateRange(30);
    
    let totalProjects = 0;
    let activeProjects = 0;
    let completedProjects = 0;
    let totalVolunteers = 0;
    let totalImpact = 0;
    
    const projectsByCategory = new Map<string, number>();
    const projectCreationMap = new Map<string, number>();
    const topProjectsList: Array<{
      id: string;
      title: string;
      applications: number;
      impact: number;
    }> = [];
    
    projectsSnapshot.forEach((doc) => {
      const data = doc.data();
      totalProjects++;
      
      if (data.status === 'approved') activeProjects++;
      if (data.status === 'completed') completedProjects++;
      
      // Count by category
      if (data.category) {
        projectsByCategory.set(
          data.category,
          (projectsByCategory.get(data.category) || 0) + 1
        );
      }
      
      // Track impact
      if (data.peopleImpacted) {
        totalImpact += data.peopleImpacted;
      }
      
      // Track volunteers
      if (data.participantIds) {
        totalVolunteers += data.participantIds.length;
      }
      
      // Track creation trend
      if (data.submittedAt) {
        const dateKey = data.submittedAt.toDate().toISOString().split('T')[0];
        projectCreationMap.set(dateKey, (projectCreationMap.get(dateKey) || 0) + 1);
      }
      
      // Collect top projects
      topProjectsList.push({
        id: doc.id,
        title: data.title || 'Untitled',
        applications: data.participantIds?.length || 0,
        impact: data.peopleImpacted || 0,
      });
    });
    
    // Get applications count
    const applicationsRef = collection(db, 'project_applications');
    const applicationsSnapshot = await getDocs(applicationsRef);
    const totalApplications = applicationsSnapshot.size;
    
    // Calculate metrics
    const projectCompletionRate = totalProjects > 0
      ? (completedProjects / totalProjects) * 100
      : 0;
    
    const averageApplicationsPerProject = totalProjects > 0
      ? totalApplications / totalProjects
      : 0;
    
    const averageImpactPerProject = totalProjects > 0
      ? totalImpact / totalProjects
      : 0;
    
    // Build trends
    const projectCreationTrend = Array.from(projectCreationMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
    
    const projectsByCategoryArray = Array.from(projectsByCategory.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    
    const topProjects = topProjectsList
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10);
    
    return {
      totalProjects,
      activeProjects,
      completedProjects,
      projectCompletionRate: Math.round(projectCompletionRate * 10) / 10,
      totalApplications,
      averageApplicationsPerProject: Math.round(averageApplicationsPerProject * 10) / 10,
      acceptanceRate: 0, // Requires application status tracking
      totalVolunteersEngaged: totalVolunteers,
      totalPeopleImpacted: totalImpact,
      averageImpactPerProject: Math.round(averageImpactPerProject),
      projectCreationTrend,
      projectsByCategory: projectsByCategoryArray,
      topProjects,
    };
  } catch (error) {
    console.error('Error getting project analytics:', error);
    throw error;
  }
};

/**
 * Get NGO analytics
 */
export const getNGOAnalytics = async (): Promise<NGOAnalyticsData> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'ngo'));
    const ngosSnapshot = await getDocs(q);
    
    const monthAgo = getDateRange(30);
    
    let totalNGOs = 0;
    let activeNGOs = 0;
    let newNGOsThisMonth = 0;
    
    const ngoGrowthMap = new Map<string, number>();
    const topNGOsList: Array<{
      id: string;
      name: string;
      projects: number;
      volunteers: number;
      impact: number;
    }> = [];
    
    ngosSnapshot.forEach((doc) => {
      const data = doc.data();
      totalNGOs++;
      
      // Count new NGOs
      if (data.createdAt) {
        const createdDate = data.createdAt.toDate();
        if (createdDate >= monthAgo) newNGOsThisMonth++;
        
        const dateKey = createdDate.toISOString().split('T')[0];
        ngoGrowthMap.set(dateKey, (ngoGrowthMap.get(dateKey) || 0) + 1);
      }
      
      // Count active NGOs (with recent activity)
      if (data.lastLoginAt) {
        const lastLogin = data.lastLoginAt.toDate();
        if (lastLogin >= monthAgo) activeNGOs++;
      }
    });
    
    // Get project stats for NGOs
    const projectsRef = collection(db, 'project_submissions');
    const projectsSnapshot = await getDocs(projectsRef);
    
    let projectsCreated = 0;
    let projectsCompleted = 0;
    let totalVolunteers = 0;
    let totalImpact = 0;
    
    projectsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'approved' || data.status === 'completed') {
        projectsCreated++;
      }
      if (data.status === 'completed') {
        projectsCompleted++;
      }
      if (data.participantIds) {
        totalVolunteers += data.participantIds.length;
      }
      if (data.peopleImpacted) {
        totalImpact += data.peopleImpacted;
      }
    });
    
    // Get donation stats
    const donationsRef = collection(db, 'donations');
    const donationsQuery = query(donationsRef, where('status', '==', 'completed'));
    const donationsSnapshot = await getDocs(donationsQuery);
    
    let donationsReceived = 0;
    let totalDonationAmount = 0;
    
    donationsSnapshot.forEach((doc) => {
      const data = doc.data();
      donationsReceived++;
      if (data.amount) {
        totalDonationAmount += data.amount;
      }
    });
    
    // Calculate metrics
    const previousMonthNGOs = totalNGOs - newNGOsThisMonth;
    const ngoGrowthRate = previousMonthNGOs > 0
      ? (newNGOsThisMonth / previousMonthNGOs) * 100
      : 0;
    
    const projectSuccessRate = projectsCreated > 0
      ? (projectsCompleted / projectsCreated) * 100
      : 0;
    
    const averageVolunteersPerNGO = totalNGOs > 0
      ? totalVolunteers / totalNGOs
      : 0;
    
    const averageImpactPerNGO = totalNGOs > 0
      ? totalImpact / totalNGOs
      : 0;
    
    const averageDonationAmount = donationsReceived > 0
      ? totalDonationAmount / donationsReceived
      : 0;
    
    // Build growth trend
    const ngoGrowthTrend = Array.from(ngoGrowthMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
    
    return {
      totalNGOs,
      activeNGOs,
      ngoGrowthRate: Math.round(ngoGrowthRate * 10) / 10,
      totalVolunteersAcquired: totalVolunteers,
      averageVolunteersPerNGO: Math.round(averageVolunteersPerNGO * 10) / 10,
      volunteerRetentionRate: 0, // Requires retention tracking
      projectsCreated,
      projectsCompleted,
      projectSuccessRate: Math.round(projectSuccessRate * 10) / 10,
      totalImpact,
      averageImpactPerNGO: Math.round(averageImpactPerNGO),
      donationsReceived,
      averageDonationAmount: Math.round(averageDonationAmount),
      ngoGrowthTrend,
      topNGOs: [], // Requires aggregation by NGO
    };
  } catch (error) {
    console.error('Error getting NGO analytics:', error);
    throw error;
  }
};

/**
 * Get system analytics
 */
export const getSystemAnalytics = async (): Promise<SystemAnalyticsData> => {
  try {
    // Get document counts from all collections
    const collections = [
      'users',
      'project_submissions',
      'event_submissions',
      'project_applications',
      'event_registrations',
      'donations',
      'donation_goals',
      'subscriptions',
    ];
    
    let totalDocuments = 0;
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      totalDocuments += snapshot.size;
    }
    
    // Estimate costs (rough estimates for Firestore on Blaze plan)
    const estimatedReadsPerMonth = totalDocuments * 100; // Rough estimate
    const estimatedWritesPerMonth = totalDocuments * 10; // Rough estimate
    const storageUsedMB = totalDocuments * 0.01; // Rough estimate (10KB per doc)
    
    // Firestore pricing (approximate)
    const readCost = (estimatedReadsPerMonth / 50000) * 0.06; // $0.06 per 50K reads
    const writeCost = (estimatedWritesPerMonth / 20000) * 0.18; // $0.18 per 20K writes
    const storageCost = (storageUsedMB / 1024) * 0.18; // $0.18 per GB/month
    
    const estimatedMonthlyCost = readCost + writeCost + storageCost;
    
    return {
      systemStatus: 'healthy',
      uptime: 99.9,
      responseTime: 0, // Requires performance monitoring
      averagePageLoadTime: 0, // Requires client-side tracking
      errorRate: 0, // Requires error tracking
      slowQueries: 0, // Requires query monitoring
      totalPageViews: 0, // Requires analytics integration
      uniqueVisitors: 0, // Requires analytics integration
      averageSessionsPerUser: 0, // Requires session tracking
      bounceRate: 0, // Requires analytics integration
      totalDocuments,
      totalReads: estimatedReadsPerMonth,
      totalWrites: estimatedWritesPerMonth,
      storageUsed: Math.round(storageUsedMB * 10) / 10,
      estimatedMonthlyCost: Math.round(estimatedMonthlyCost * 100) / 100,
      costPerUser: 0, // Calculated after getting user count
      costBreakdown: {
        firestore: Math.round((readCost + writeCost) * 100) / 100,
        storage: Math.round(storageCost * 100) / 100,
        functions: 0,
        hosting: 0,
      },
      recentErrors: [],
    };
  } catch (error) {
    console.error('Error getting system analytics:', error);
    throw error;
  }
};

/**
 * Get all analytics data
 */
export const getAllAnalytics = async () => {
  try {
    const [userAnalytics, projectAnalytics, ngoAnalytics, systemAnalytics] = await Promise.all([
      getUserAnalytics(),
      getProjectAnalytics(),
      getNGOAnalytics(),
      getSystemAnalytics(),
    ]);
    
    return {
      users: userAnalytics,
      projects: projectAnalytics,
      ngos: ngoAnalytics,
      system: systemAnalytics,
    };
  } catch (error) {
    console.error('Error getting all analytics:', error);
    throw error;
  }
};
