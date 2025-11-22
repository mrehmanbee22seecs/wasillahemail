/**
 * Analytics API Endpoints
 * Handlers for analytics and metrics
 */

import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/responses';

const db = admin.firestore();

export const getPlatformAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.query;

    // Get basic analytics
    const [
      totalUsers,
      totalProjects,
      totalEvents,
      approvedProjects,
      upcomingEvents,
    ] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('project_submissions').count().get(),
      db.collection('event_submissions').count().get(),
      db.collection('project_submissions').where('status', '==', 'approved').count().get(),
      db.collection('event_submissions').where('status', '==', 'approved').count().get(),
    ]);

    const analytics = {
      totalUsers: totalUsers.data().count,
      totalProjects: totalProjects.data().count,
      totalEvents: totalEvents.data().count,
      activeProjects: approvedProjects.data().count,
      upcomingEvents: upcomingEvents.data().count,
      growthMetrics: {
        usersGrowth: 0,
        projectsGrowth: 0,
        eventsGrowth: 0,
      },
    };

    return successResponse(res, analytics);
  } catch (error) {
    console.error('Get platform analytics error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch analytics', 500);
  }
};

export const getProjectAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const statusSnapshot = await db.collection('project_submissions').get();

    const statusCounts: Record<string, number> = {};
    statusSnapshot.docs.forEach((doc) => {
      const status = doc.data().status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return successResponse(res, {
      totalProjects: statusSnapshot.size,
      byStatus: statusCounts,
    });
  } catch (error) {
    console.error('Get project analytics error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch project analytics', 500);
  }
};

export const getEventAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const statusSnapshot = await db.collection('event_submissions').get();

    const statusCounts: Record<string, number> = {};
    statusSnapshot.docs.forEach((doc) => {
      const status = doc.data().status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return successResponse(res, {
      totalEvents: statusSnapshot.size,
      byStatus: statusCounts,
    });
  } catch (error) {
    console.error('Get event analytics error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch event analytics', 500);
  }
};

export const getUserAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const usersSnapshot = await db.collection('users').get();

    const roleCounts: Record<string, number> = {};
    usersSnapshot.docs.forEach((doc) => {
      const role = doc.data().role || 'unknown';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    return successResponse(res, {
      totalUsers: usersSnapshot.size,
      byRole: roleCounts,
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch user analytics', 500);
  }
};
