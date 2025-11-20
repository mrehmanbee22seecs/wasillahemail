/**
 * Projects API Endpoints
 * Handlers for project CRUD operations
 */

import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responses';
import { getPaginationParams, calculatePagination } from '../utils/apiHelpers';

const db = admin.firestore();

export const listProjects = async (req: AuthRequest, res: Response) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const { status, search, category } = req.query;

    let query = db.collection('project_submissions').orderBy('submittedAt', 'desc');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }
    if (category) {
      query = query.where('category', '==', category);
    }

    // Get documents with pagination
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
    console.error('List projects error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch projects', 500);
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('project_submissions').doc(id).get();

    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Project not found', 404);
    }

    return successResponse(res, { id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Get project error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch project', 500);
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const projectData = {
      ...req.body,
      submittedBy: req.userId,
      status: 'pending',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      isVisible: false,
    };

    const docRef = await db.collection('project_submissions').add(projectData);

    return successResponse(
      res,
      { id: docRef.id, status: 'pending' },
      'Project created successfully. Pending approval.',
      201
    );
  } catch (error) {
    console.error('Create project error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to create project', 500);
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('project_submissions').doc(id).get();

    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Project not found', 404);
    }

    const projectData = doc.data();
    if (projectData?.submittedBy !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Not authorized to update this project', 403);
    }

    await db.collection('project_submissions').doc(id).update({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return successResponse(res, { id }, 'Project updated successfully');
  } catch (error) {
    console.error('Update project error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to update project', 500);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('project_submissions').doc(id).get();

    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Project not found', 404);
    }

    const projectData = doc.data();
    if (projectData?.submittedBy !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Not authorized to delete this project', 403);
    }

    await db.collection('project_submissions').doc(id).delete();

    return successResponse(res, { id }, 'Project deleted successfully');
  } catch (error) {
    console.error('Delete project error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to delete project', 500);
  }
};

export const approveProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.collection('project_submissions').doc(id).update({
      status: 'approved',
      isVisible: true,
      approvedBy: req.userId,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(reason && { approvalReason: reason }),
    });

    return successResponse(res, { id }, 'Project approved successfully');
  } catch (error) {
    console.error('Approve project error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to approve project', 500);
  }
};

export const rejectProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.collection('project_submissions').doc(id).update({
      status: 'rejected',
      isVisible: false,
      rejectedBy: req.userId,
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason || 'No reason provided',
    });

    return successResponse(res, { id }, 'Project rejected successfully');
  } catch (error) {
    console.error('Reject project error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to reject project', 500);
  }
};
