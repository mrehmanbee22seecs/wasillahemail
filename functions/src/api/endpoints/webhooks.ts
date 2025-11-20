import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responses';
import { buildPaginationQuery, sanitizeQueryParams } from '../utils/apiHelpers';
import {
  getWebhookDeliveries,
  testWebhook,
  retryWebhookDelivery,
} from '../services/webhookService';
import * as crypto from 'crypto';

const db = admin.firestore();

/**
 * Webhooks Endpoint Handler
 * Manages webhook subscriptions and deliveries
 */

// List webhooks for current user
export const listWebhooks = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { page = 1, perPage = 20 } = sanitizeQueryParams(req.query);
    
    const query = db
      .collection('webhooks')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc');
    
    const { paginatedQuery, offset } = buildPaginationQuery(query, page as number, perPage as number);
    const snapshot = await paginatedQuery.get();
    
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;
    
    const webhooks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Don't expose secret in list
      secret: undefined,
    }));
    
    return paginatedResponse(res, webhooks, total, page as number, perPage as number);
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Get single webhook
export const getWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== user.uid && !user.admin) {
      return errorResponse(res, 'Unauthorized', 403);
    }
    
    return successResponse(res, {
      id: doc.id,
      ...webhook,
      // Don't expose full secret, just hint
      secret: webhook?.secret ? `${webhook.secret.substring(0, 8)}...` : undefined,
    });
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Create webhook
export const createWebhook = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { url, events, description } = req.body;
    
    // Generate secret for signing
    const secret = crypto.randomBytes(32).toString('hex');
    
    const webhookData = {
      userId: user.uid,
      url,
      events,
      description: description || '',
      secret,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await db.collection('webhooks').add(webhookData);
    const doc = await docRef.get();
    
    return successResponse(res, {
      id: doc.id,
      ...doc.data(),
    }, 201);
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Update webhook
export const updateWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== user.uid && !user.admin) {
      return errorResponse(res, 'Unauthorized', 403);
    }
    
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Don't allow updating certain fields
    delete updateData.userId;
    delete updateData.secret;
    delete updateData.createdAt;
    
    await db.collection('webhooks').doc(id).update(updateData);
    
    const updatedDoc = await db.collection('webhooks').doc(id).get();
    
    return successResponse(res, {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      secret: undefined,
    });
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Delete webhook
export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== user.uid && !user.admin) {
      return errorResponse(res, 'Unauthorized', 403);
    }
    
    await db.collection('webhooks').doc(id).delete();
    
    return successResponse(res, { message: 'Webhook deleted successfully' });
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Get webhook deliveries
export const getDeliveries = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { limit = 50 } = req.query;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== user.uid && !user.admin) {
      return errorResponse(res, 'Unauthorized', 403);
    }
    
    const deliveries = await getWebhookDeliveries(id, Number(limit));
    
    return successResponse(res, deliveries);
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Test webhook
export const testWebhookEndpoint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== user.uid && !user.admin) {
      return errorResponse(res, 'Unauthorized', 403);
    }
    
    const result = await testWebhook(id);
    
    if (result.success) {
      return successResponse(res, { message: 'Test webhook delivered successfully' });
    } else {
      return errorResponse(res, result.error || 'Test webhook delivery failed', 500);
    }
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};

// Retry webhook delivery
export const retryDelivery = async (req: Request, res: Response) => {
  try {
    const { id, deliveryId } = req.params;
    const user = (req as any).user;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== user.uid && !user.admin) {
      return errorResponse(res, 'Unauthorized', 403);
    }
    
    const result = await retryWebhookDelivery(deliveryId);
    
    if (result.success) {
      return successResponse(res, { message: 'Webhook delivery retried successfully' });
    } else {
      return errorResponse(res, result.error || 'Retry failed', 500);
    }
  } catch (error: any) {
    return errorResponse(res, error.message, 500);
  }
};
