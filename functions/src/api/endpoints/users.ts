/**
 * Users API Endpoints
 * Handlers for user profile operations
 */

import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responses';
import { getPaginationParams, calculatePagination } from '../utils/apiHelpers';

const db = admin.firestore();

export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const { role, isActive } = req.query;

    let query = db.collection('users').orderBy('createdAt', 'desc');

    if (role) {
      query = query.where('role', '==', role);
    }
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive === 'true');
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
    console.error('List users error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch users', 500);
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless they're admin
    if (id !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Not authorized to view this profile', 403);
    }

    const doc = await db.collection('users').doc(id).get();

    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'User not found', 404);
    }

    return successResponse(res, { id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch user', 500);
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await db.collection('users').doc(req.userId!).get();

    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'User profile not found', 404);
    }

    return successResponse(res, { id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch user profile', 500);
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Users can only update their own profile unless they're admin
    if (id !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Not authorized to update this profile', 403);
    }

    await db.collection('users').doc(id).update({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return successResponse(res, { id }, 'User profile updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to update user profile', 500);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Delete from Firestore
    await db.collection('users').doc(id).delete();

    // Delete from Firebase Auth
    await admin.auth().deleteUser(id);

    return successResponse(res, { id }, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to delete user', 500);
  }
};
