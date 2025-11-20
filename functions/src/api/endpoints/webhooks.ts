import { Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responses';
import { getPaginationParams, calculatePagination } from '../utils/apiHelpers';
import * as crypto from 'crypto';

const db = admin.firestore();

/**
 * Webhooks Endpoint Handler
 * Manages webhook subscriptions and deliveries
 */

// List webhooks for current user
export const listWebhooks = async (req: AuthRequest, res: Response) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    
    let query = db
      .collection('webhooks')
      .where('userId', '==', req.userId)
      .orderBy('createdAt', 'desc');
    
    const offset = (page - 1) * perPage;
    const snapshot = await query.limit(perPage + 1).offset(offset).get();
    
    const items = snapshot.docs.slice(0, perPage).map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Don't expose secret in list
      secret: undefined,
    }));
    
    const hasNext = snapshot.docs.length > perPage;
    const pagination = calculatePagination(page, perPage);
    pagination.hasNext = hasNext;
    
    return paginatedResponse(res, items, pagination);
  } catch (error: any) {
    console.error('List webhooks error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch webhooks', 500);
  }
};

// Get single webhook
export const getWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Unauthorized to access this webhook', 403);
    }
    
    return successResponse(res, {
      id: doc.id,
      ...webhook,
      // Don't expose full secret, just hint
      secret: webhook?.secret ? `${webhook.secret.substring(0, 8)}...` : undefined,
    });
  } catch (error: any) {
    console.error('Get webhook error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch webhook', 500);
  }
};

// Create webhook
export const createWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { url, events, description } = req.body;
    
    // Generate secret for signing
    const secret = crypto.randomBytes(32).toString('hex');
    
    const webhookData = {
      userId: req.userId,
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
    }, 'Webhook created successfully', 201);
  } catch (error: any) {
    console.error('Create webhook error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to create webhook', 500);
  }
};

// Update webhook
export const updateWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Unauthorized to update this webhook', 403);
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
    }, 'Webhook updated successfully');
  } catch (error: any) {
    console.error('Update webhook error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to update webhook', 500);
  }
};

// Delete webhook
export const deleteWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Unauthorized to delete this webhook', 403);
    }
    
    await db.collection('webhooks').doc(id).delete();
    
    return successResponse(res, { message: 'Webhook deleted successfully' });
  } catch (error: any) {
    console.error('Delete webhook error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to delete webhook', 500);
  }
};

// Get webhook deliveries
export const getDeliveries = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Unauthorized to access webhook deliveries', 403);
    }
    
    // Get deliveries from webhook_deliveries collection
    const deliveriesSnapshot = await db
      .collection('webhook_deliveries')
      .where('webhookId', '==', id)
      .orderBy('deliveredAt', 'desc')
      .limit(Number(limit))
      .get();
    
    const deliveries = deliveriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return successResponse(res, deliveries);
  } catch (error: any) {
    console.error('Get deliveries error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to fetch webhook deliveries', 500);
  }
};

// Test webhook
export const testWebhookEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Unauthorized to test this webhook', 403);
    }
    
    // Create a test payload
    const testPayload = {
      event: 'webhook.test',
      data: {
        message: 'This is a test webhook delivery',
        timestamp: new Date().toISOString(),
        webhookId: id
      }
    };
    
    // Attempt to deliver the test webhook
    try {
      const axios = require('axios');
      const signature = crypto
        .createHmac('sha256', webhook?.secret || '')
        .update(JSON.stringify(testPayload))
        .digest('hex');
      
      await axios.post(webhook?.url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        },
        timeout: 10000
      });
      
      return successResponse(res, { message: 'Test webhook delivered successfully' });
    } catch (deliveryError: any) {
      return errorResponse(
        res,
        'DELIVERY_FAILED',
        `Test webhook delivery failed: ${deliveryError.message}`,
        500
      );
    }
  } catch (error: any) {
    console.error('Test webhook error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to test webhook', 500);
  }
};

// Retry webhook delivery
export const retryDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { id, deliveryId } = req.params;
    
    const doc = await db.collection('webhooks').doc(id).get();
    
    if (!doc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Webhook not found', 404);
    }
    
    const webhook = doc.data();
    
    // Check ownership
    if (webhook?.userId !== req.userId && !req.isAdmin) {
      return errorResponse(res, 'FORBIDDEN', 'Unauthorized to retry webhook delivery', 403);
    }
    
    // Get the delivery record
    const deliveryDoc = await db.collection('webhook_deliveries').doc(deliveryId).get();
    
    if (!deliveryDoc.exists) {
      return errorResponse(res, 'NOT_FOUND', 'Delivery record not found', 404);
    }
    
    const delivery = deliveryDoc.data();
    
    // Retry the delivery
    try {
      const axios = require('axios');
      const signature = crypto
        .createHmac('sha256', webhook?.secret || '')
        .update(JSON.stringify(delivery?.payload))
        .digest('hex');
      
      const response = await axios.post(webhook?.url, delivery?.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        },
        timeout: 10000
      });
      
      // Update delivery record
      await db.collection('webhook_deliveries').doc(deliveryId).update({
        status: 'success',
        retryCount: (delivery?.retryCount || 0) + 1,
        lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
        responseStatus: response.status
      });
      
      return successResponse(res, { message: 'Webhook delivery retried successfully' });
    } catch (deliveryError: any) {
      // Update failure record
      await db.collection('webhook_deliveries').doc(deliveryId).update({
        status: 'failed',
        retryCount: (delivery?.retryCount || 0) + 1,
        lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
        error: deliveryError.message
      });
      
      return errorResponse(
        res,
        'DELIVERY_FAILED',
        `Webhook delivery retry failed: ${deliveryError.message}`,
        500
      );
    }
  } catch (error: any) {
    console.error('Retry delivery error:', error);
    return errorResponse(res, 'INTERNAL_ERROR', 'Failed to retry webhook delivery', 500);
  }
};
