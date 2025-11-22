import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responses';
import { getPaginationParams, calculatePagination, sanitizeQuery } from '../utils/apiHelpers';

const db = admin.firestore();

/**
 * NGOs Endpoint Handler
 * Handles all NGO-related operations
 */

// List NGOs with pagination and filtering
export const listNGOs = async (req: AuthRequest, res: Response) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const { status, verified, location } = req.query;
    
    let query = db.collection('ngos').orderBy('createdAt', 'desc');
    
    // Apply filters
    if (status) {
      query = query.where('status', '==', status) as any;
    }
    if (verified !== undefined) {
      const v = String(verified).toLowerCase();
   if (v !== 'true' && v !== 'false') {
     return errorResponse(res, 'VALIDATION_ERROR', 'Invalid verified parameter. Use true or false.', 400);
   }
   query = query.where('verified', '==', v === 'true') as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
 }
    if (location) {
      query = query.where('location', '==', location) as any;
    }
    
    // Apply pagination
    const offset = (page - 1) * perPage;
    const snapshot = await query.limit(perPage + 1).offset(offset).get();
    
    const items = snapshot.docs.slice(0, perPage).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const hasNext = snapshot.docs.length > perPage;
    const pagination = calculatePagination(page, perPage);
    pagination.hasNext = hasNext;
    
    return paginatedResponse(res, items, pagination);
  } catch (error: any) {
    return errorResponse(res, 'INTERNAL_ERROR', error.message, 500);
  }
};

// Get single NGO by ID
export const getNGO = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('ngos').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'NGO not found', 404);
    }
    
    return successResponse(res, {
      id: doc.id,
      ...doc.data()
    });
  } catch (error: any) {
    console.error('Get NGO error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch NGO', 500);
  }
};

// Create new NGO
export const createNGO = async (req: AuthRequest, res: Response) => {
  try {
    const ngoData = {
      ...req.body,
      ownerId: req.userId,
      verified: false,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('ngos').add(ngoData);
    const doc = await docRef.get();
    
    return successResponse(res, {
      id: doc.id,
      ...doc.data()
    }, 'NGO created successfully', 201);
  } catch (error: any) {
    console.error('Create NGO error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to create NGO', 500);
  }
};

// Update NGO
export const updateNGO = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('ngos').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'NGO not found', 404);
    }
    
    const ngoData = doc.data();
    
    // Check if user is owner or admin
    if (ngoData?.ownerId !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Unauthorized to update this NGO', 403);
    }
    
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Don't allow updating certain fields
    delete updateData.ownerId;
    delete updateData.createdAt;
    if (!req.isAdmin) {
      delete updateData.verified;
      delete updateData.status;
    }
    
    await db.collection('ngos').doc(id).update(updateData);
    
    const updatedDoc = await db.collection('ngos').doc(id).get();
    
    return successResponse(res, {
      id: updatedDoc.id,
      ...updatedDoc.data()
    }, 'NGO updated successfully');
  } catch (error: any) {
    console.error('Update NGO error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to update NGO', 500);
  }
};

// Delete NGO
export const deleteNGO = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('ngos').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'NGO not found', 404);
    }
    
    const ngoData = doc.data();
    
    // Check if user is owner or admin
    if (ngoData?.ownerId !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Unauthorized to delete this NGO', 403);
    }
    
    await db.collection('ngos').doc(id).delete();
    
    return successResponse(res, { message: 'NGO deleted successfully' });
  } catch (error: any) {
    console.error('Delete NGO error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to delete NGO', 500);
  }
};

// Verify NGO (admin only)
export const verifyNGO = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    if (!req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Admin access required', 403);
    }
    
    const doc = await db.collection('ngos').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'NGO not found', 404);
    }
    
    await db.collection('ngos').doc(id).update({
      verified: true,
      status: 'active',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verifiedBy: req.userId,
      verificationNotes: notes || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const updatedDoc = await db.collection('ngos').doc(id).get();
    
    return successResponse(res, {
      id: updatedDoc.id,
      ...updatedDoc.data()
    }, 'NGO verified successfully');
  } catch (error: any) {
    console.error('Verify NGO error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to verify NGO', 500);
  }
};

// Reject NGO verification (admin only)
export const rejectNGO = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Admin access required', 403);
    }
    
    const doc = await db.collection('ngos').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'NGO not found', 404);
    }
    
    await db.collection('ngos').doc(id).update({
      verified: false,
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectedBy: req.userId,
      rejectionReason: reason || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const updatedDoc = await db.collection('ngos').doc(id).get();
    
    return successResponse(res, {
      id: updatedDoc.id,
      ...updatedDoc.data()
    }, 'NGO rejected successfully');
  } catch (error: any) {
    console.error('Reject NGO error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to reject NGO', 500);
  }
};
