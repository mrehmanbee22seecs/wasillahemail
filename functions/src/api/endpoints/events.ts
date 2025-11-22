/**
 * Events API Endpoints
 * Handlers for event CRUD operations
 */

import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responses';
import { getPaginationParams, calculatePagination } from '../utils/apiHelpers';

const db = admin.firestore();

export const listEvents = async (req: AuthRequest, res: Response) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const { status, projectId } = req.query;

    let query = db.collection('event_submissions').orderBy('submittedAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }
    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }

    const offset = (page - 1) * perPage;
    const snapshot = await query.limit(perPage + 1).offset(offset).get();

    const items = snapshot.docs.slice(0, perPage).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const hasNext = snapshot.docs.length > perPage;
    const pagination = calculatePagination(page, perPage);
    pagination.hasNext = hasNext;

    return paginatedResponse(res, items, pagination);
  } catch (error) {
    console.error('List events error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch events', 500);
  }
};

export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('event_submissions').doc(id).get();

    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Event not found', 404);
    }

    return successResponse(res, { id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Get event error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch event', 500);
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventData = {
      ...req.body,
      submittedBy: req.userId,
      status: 'pending',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      isVisible: false,
    };

    const docRef = await db.collection('event_submissions').add(eventData);

    return successResponse(
      res,
      { id: docRef.id, status: 'pending' },
      'Event created successfully. Pending approval.',
      201
    );
  } catch (error) {
    console.error('Create event error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to create event', 500);
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('event_submissions').doc(id).get();

    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Event not found', 404);
    }

    const eventData = doc.data();
    if (eventData?.submittedBy !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Not authorized to update this event', 403);
    }

    await db.collection('event_submissions').doc(id).update({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return successResponse(res, { id }, 'Event updated successfully');
  } catch (error) {
    console.error('Update event error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to update event', 500);
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('event_submissions').doc(id).get();

    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Event not found', 404);
    }

    const eventData = doc.data();
    if (eventData?.submittedBy !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Not authorized to delete this event', 403);
    }

    await db.collection('event_submissions').doc(id).delete();

    return successResponse(res, { id }, 'Event deleted successfully');
  } catch (error) {
    console.error('Delete event error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to delete event', 500);
  }
};

export const approveEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.collection('event_submissions').doc(id).update({
      status: 'approved',
      isVisible: true,
      approvedBy: req.userId,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(reason && { approvalReason: reason }),
    });

    return successResponse(res, { id }, 'Event approved successfully');
  } catch (error) {
    console.error('Approve event error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to approve event', 500);
  }
};

export const rejectEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.collection('event_submissions').doc(id).update({
      status: 'rejected',
      isVisible: false,
      rejectedBy: req.userId,
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason || 'No reason provided',
    });

    return successResponse(res, { id }, 'Event rejected successfully');
  } catch (error) {
    console.error('Reject event error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to reject event', 500);
  }
};
