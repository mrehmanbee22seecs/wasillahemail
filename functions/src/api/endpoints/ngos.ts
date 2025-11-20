import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responses';
import { getPaginationParams, calculatePagination, sanitizeQuery } from '../utils/apiHelpers';

const db = admin.firestore();

/**
 * NGOs Endpoint Handler
 * Handles all NGO-related operations
 */

// List NGOs with pagination and filtering
export const listNGOs = async (req: Request, res: Response) => {
  try {
    const sanitizedQuery = sanitizeQuery(req.query);
    const { page, perPage } = getPaginationParams(sanitizedQuery);
    const { status, verified, location } = sanitizedQuery;
    
    let query = db.collection('ngos').orderBy('createdAt', 'desc');
    
    // Apply filters
    if (status) {
      query = query.where('status', '==', status) as any;
    }
    if (verified !== undefined) {
      query = query.where('verified', '==', verified === 'true') as any;
    }
    if (location) {
      query = query.where('location', '==', location) as any;
    }
    
    // Get total count
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;
    
    // Apply pagination
    const offset = (page - 1) * perPage;
    const paginatedQuery = query.limit(perPage).offset(offset);
    const snapshot = await paginatedQuery.get();
    
    const ngos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return paginatedResponse(res, ngos, page, perPage, total);
  } catch (error: any) {
    return errorResponse(res, 'INTERNAL_ERROR', error.message, 500);
  }
};

// Get single NGO by ID
export const getNGO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('ngos').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NGO not found', 404);
    }
    
    return successResponse(res, {
      id: doc.id,
      ...doc.data()
    });
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Create new NGO
export const createNGO = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const ngoData = {
      ...req.body,
      ownerId: user.uid,
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
    }, 201);
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Update NGO
export const updateNGO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    const doc = await db.collection('ngos').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NGO not found', 404);
    }
    
    const ngoData = doc.data();
    
    // Check if user is owner or admin
    if (ngoData?.ownerId !== user.uid && !user.admin) {
      return errorResponse(res, 'Unauthorized', 403);
    }
    
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Don't allow updating certain fields
    delete updateData.ownerId;
    delete updateData.createdAt;
    if (!user.admin) {
      delete updateData.verified;
      delete updateData.status;
    }
    
    await db.collection('ngos').doc(id).update(updateData);
    
    const updatedDoc = await db.collection('ngos').doc(id).get();
    
    return successResponse(res, {
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Delete NGO
export const deleteNGO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    const doc = await db.collection('ngos').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NGO not found', 404);
    }
    
    const ngoData = doc.data();
    
    // Check if user is owner or admin
    if (ngoData?.ownerId !== user.uid && !user.admin) {
      return errorResponse(res, 'Unauthorized', 403);
    }
    
    await db.collection('ngos').doc(id).delete();
    
    return successResponse(res, { message: 'NGO deleted successfully' });
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Verify NGO (admin only)
export const verifyNGO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = (req as any).user;
    
    if (!user.admin) {
      return errorResponse(res, 'Admin access required', 403);
    }
    
    const doc = await db.collection('ngos').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NGO not found', 404);
    }
    
    await db.collection('ngos').doc(id).update({
      verified: true,
      status: 'active',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verifiedBy: user.uid,
      verificationNotes: notes || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const updatedDoc = await db.collection('ngos').doc(id).get();
    
    return successResponse(res, {
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Reject NGO verification (admin only)
export const rejectNGO = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = (req as any).user;
    
    if (!user.admin) {
      return errorResponse(res, 'Admin access required', 403);
    }
    
    const doc = await db.collection('ngos').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NGO not found', 404);
    }
    
    await db.collection('ngos').doc(id).update({
      verified: false,
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectedBy: user.uid,
      rejectionReason: reason || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const updatedDoc = await db.collection('ngos').doc(id).get();
    
    return successResponse(res, {
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};
