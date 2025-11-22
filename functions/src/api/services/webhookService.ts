import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import axios from 'axios';

const db = admin.firestore();

/**
 * Webhook Service
 * Handles webhook registration, delivery, and tracking
 */

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: WebhookPayload;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  response?: {
    status: number;
    body: string;
  };
  error?: string;
}

// Generate HMAC signature for webhook payload
export const generateSignature = (payload: string, secret: string): string => {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
};

// Verify webhook signature
export const verifySignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  if (!signature || typeof signature !== 'string') return false;
  const expectedSignature = generateSignature(payload, secret);
   // Avoid throwing on length mismatch
   const sigBuf = Buffer.from(signature, 'hex');
   const expBuf = Buffer.from(expectedSignature, 'hex');
   if (sigBuf.length !== expBuf.length) {
     return false;
   }
   try {
     return crypto.timingSafeEqual(sigBuf, expBuf);
   } catch {
     return false;
   }
};

// Deliver webhook to endpoint
export const deliverWebhook = async (
  webhookId: string,
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<{ success: boolean; response?: any; error?: string }> => {
  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, secret);
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'User-Agent': 'Wasilah-Webhooks/1.0',
      },
      timeout: 10000, // 10 seconds
    });
    
    // Record successful delivery
    await db.collection('webhook_deliveries').add({
      webhookId,
      event: payload.event,
      payload,
      status: 'delivered',
      attempts: 1,
      lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
      response: {
        status: response.status,
        body: JSON.stringify(response.data).substring(0, 1000), // Limit size
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return { success: true, response: response.data };
  } catch (error: any) {
     const safeError =
     error?.response?.status
       ? `HTTP ${error.response.status}${error.response.statusText ? ` ${error.response.statusText}` : ''}`
       : (error?.code ? `ERR ${String(error.code)}` : 'Network or timeout error');
   const truncated = safeError.substring(0, 200);
    await db.collection('webhook_deliveries').add({
      webhookId,
      event: payload.event,
      payload,
      status: 'failed',
      attempts: 1,
      lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
      error: truncated,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return { success: false, error: truncated };
  }
};

// Trigger webhook for an event
export const triggerWebhook = async (
  event: string,
  data: any
): Promise<void> => {
  try {
    // Find all active webhooks for this event
    const webhooksSnapshot = await db
      .collection('webhooks')
      .where('events', 'array-contains', event)
      .where('active', '==', true)
      .get();
    
    if (webhooksSnapshot.empty) {
      return;
    }
    
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    
    // Deliver to all matching webhooks
    const deliveryPromises = webhooksSnapshot.docs.map(async (doc) => {
      const webhook = doc.data();
      return deliverWebhook(doc.id, webhook.url, payload, webhook.secret);
    });
    
    await Promise.allSettled(deliveryPromises);
  } catch (error) {
    console.error('Error triggering webhook:', error);
  }
};

// Retry failed webhook delivery
export const retryWebhookDelivery = async (
  deliveryId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const deliveryDoc = await db.collection('webhook_deliveries').doc(deliveryId).get();
    
    if (!deliveryDoc.exists) {
      return { success: false, error: 'Delivery not found' };
    }
    
    const delivery = deliveryDoc.data() as WebhookDelivery;
    
    if (delivery.status === 'delivered') {
      return { success: false, error: 'Delivery already successful' };
    }
    
    if (delivery.attempts >= 3) {
      return { success: false, error: 'Max retry attempts reached' };
    }
    
    // Get webhook details
    const webhookDoc = await db.collection('webhooks').doc(delivery.webhookId).get();
    
    if (!webhookDoc.exists) {
      return { success: false, error: 'Webhook not found' };
    }
    
    const webhook = webhookDoc.data();
    
    // Attempt delivery
    const result = await deliverWebhook(
      delivery.webhookId,
      webhook!.url,
      delivery.payload,
      webhook!.secret
    );
    
    // Update delivery record
    await db.collection('webhook_deliveries').doc(deliveryId).update({
      status: result.success ? 'delivered' : 'failed',
      attempts: admin.firestore.FieldValue.increment(1),
      lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
      ...(result.error && { error: result.error }),
      ...(result.response && {
        response: {
          status: 200,
          body: JSON.stringify(result.response).substring(0, 1000),
        },
      }),
    });
    
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get webhook deliveries
export const getWebhookDeliveries = async (
  webhookId: string,
  limit: number = 50
): Promise<WebhookDelivery[]> => {
  const snapshot = await db
    .collection('webhook_deliveries')
    .where('webhookId', '==', webhookId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as WebhookDelivery));
};

// Test webhook endpoint
export const testWebhook = async (
  webhookId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const webhookDoc = await db.collection('webhooks').doc(webhookId).get();
    
    if (!webhookDoc.exists) {
      return { success: false, error: 'Webhook not found' };
    }
    
    const webhook = webhookDoc.data();
    
    const testPayload: WebhookPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId,
      },
    };
    
    const result = await deliverWebhook(
      webhookId,
      webhook!.url,
      testPayload,
      webhook!.secret
    );
    
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
