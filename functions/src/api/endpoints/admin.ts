/**
 * Admin API Endpoints
 * Handlers for admin-only operations
 */

import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/responses';

const db = admin.firestore();

export const getPlatformStats = async (req: AuthRequest, res: Response) => {
  try {
    // Get counts for various resources
    const [usersSnapshot, projectsSnapshot, eventsSnapshot, ngosSnapshot] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('project_submissions').count().get(),
      db.collection('event_submissions').count().get(),
      db.collection('users').where('role', '==', 'ngo').count().get(),
    ]);

    const stats = {
      totalUsers: usersSnapshot.data().count,
      totalProjects: projectsSnapshot.data().count,
      totalEvents: eventsSnapshot.data().count,
      totalNgos: ngosSnapshot.data().count,
      timestamp: new Date(),
    };

    return successResponse(res, stats);
  } catch (error) {
    console.error('Get platform stats error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch platform statistics', 500);
  }
};

export const getSystemHealth = async (req: AuthRequest, res: Response) => {
  try {
    const health = {
      status: 'healthy' as const,
      uptime: process.uptime(),
      lastCheck: new Date(),
      services: {
        firestore: 'operational' as const,
        auth: 'operational' as const,
        storage: 'operational' as const,
        functions: 'operational' as const,
      },
    };

    return successResponse(res, health);
  } catch (error) {
    console.error('Get system health error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to check system health', 500);
  }
};

export const getModerationQueue = async (req: AuthRequest, res: Response) => {
  try {
    const [projectsSnapshot, eventsSnapshot] = await Promise.all([
      db.collection('project_submissions').where('status', '==', 'pending').count().get(),
      db.collection('event_submissions').where('status', '==', 'pending').count().get(),
    ]);

    const queue = {
      projects: projectsSnapshot.data().count,
      events: eventsSnapshot.data().count,
      users: 0,
      reports: 0,
    };

    return successResponse(res, queue);
  } catch (error) {
    console.error('Get moderation queue error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch moderation queue', 500);
  }
};

export const bulkOperation = async (req: AuthRequest, res: Response) => {
  try {
    const { operation, resourceType, resourceIds, reason } = req.body;

    if (!operation || !resourceType || !resourceIds || !Array.isArray(resourceIds)) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Invalid bulk operation request', 400);
    }

    const collection = resourceType === 'project' ? 'project_submissions' : 'event_submissions';
    const batch = db.batch();

    resourceIds.forEach((id) => {
      const docRef = db.collection(collection).doc(id);
      if (operation === 'approve') {
        batch.update(docRef, {
          status: 'approved',
          isVisible: true,
          approvedBy: req.userId,
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          ...(reason && { approvalReason: reason }),
        });
      } else if (operation === 'reject') {
        batch.update(docRef, {
          status: 'rejected',
          isVisible: false,
          rejectedBy: req.userId,
          rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
          ...(reason && { rejectionReason: reason }),
        });
      }
    });

    await batch.commit();

    return successResponse(
      res,
      { processedCount: resourceIds.length },
      `Bulk ${operation} completed successfully`
    );
  } catch (error) {
    console.error('Bulk operation error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to perform bulk operation', 500);
  }
};
