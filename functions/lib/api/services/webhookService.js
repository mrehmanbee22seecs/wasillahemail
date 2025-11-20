"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testWebhook = exports.getWebhookDeliveries = exports.retryWebhookDelivery = exports.triggerWebhook = exports.deliverWebhook = exports.verifySignature = exports.generateSignature = void 0;
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const db = admin.firestore();
// Generate HMAC signature for webhook payload
const generateSignature = (payload, secret) => {
    return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
};
exports.generateSignature = generateSignature;
// Verify webhook signature
const verifySignature = (payload, signature, secret) => {
    const expectedSignature = (0, exports.generateSignature)(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};
exports.verifySignature = verifySignature;
// Deliver webhook to endpoint
const deliverWebhook = async (webhookId, url, payload, secret) => {
    try {
        const payloadString = JSON.stringify(payload);
        const signature = (0, exports.generateSignature)(payloadString, secret);
        const response = await axios_1.default.post(url, payload, {
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
    }
    catch (error) {
        // Record failed delivery
        await db.collection('webhook_deliveries').add({
            webhookId,
            event: payload.event,
            payload,
            status: 'failed',
            attempts: 1,
            lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
            error: error.message,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: false, error: error.message };
    }
};
exports.deliverWebhook = deliverWebhook;
// Trigger webhook for an event
const triggerWebhook = async (event, data) => {
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
        const payload = {
            event,
            timestamp: new Date().toISOString(),
            data,
        };
        // Deliver to all matching webhooks
        const deliveryPromises = webhooksSnapshot.docs.map(async (doc) => {
            const webhook = doc.data();
            return (0, exports.deliverWebhook)(doc.id, webhook.url, payload, webhook.secret);
        });
        await Promise.allSettled(deliveryPromises);
    }
    catch (error) {
        console.error('Error triggering webhook:', error);
    }
};
exports.triggerWebhook = triggerWebhook;
// Retry failed webhook delivery
const retryWebhookDelivery = async (deliveryId) => {
    try {
        const deliveryDoc = await db.collection('webhook_deliveries').doc(deliveryId).get();
        if (!deliveryDoc.exists) {
            return { success: false, error: 'Delivery not found' };
        }
        const delivery = deliveryDoc.data();
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
        const result = await (0, exports.deliverWebhook)(delivery.webhookId, webhook.url, delivery.payload, webhook.secret);
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
    }
    catch (error) {
        return { success: false, error: error.message };
    }
};
exports.retryWebhookDelivery = retryWebhookDelivery;
// Get webhook deliveries
const getWebhookDeliveries = async (webhookId, limit = 50) => {
    const snapshot = await db
        .collection('webhook_deliveries')
        .where('webhookId', '==', webhookId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
};
exports.getWebhookDeliveries = getWebhookDeliveries;
// Test webhook endpoint
const testWebhook = async (webhookId) => {
    try {
        const webhookDoc = await db.collection('webhooks').doc(webhookId).get();
        if (!webhookDoc.exists) {
            return { success: false, error: 'Webhook not found' };
        }
        const webhook = webhookDoc.data();
        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test webhook delivery',
                webhookId,
            },
        };
        const result = await (0, exports.deliverWebhook)(webhookId, webhook.url, testPayload, webhook.secret);
        return result;
    }
    catch (error) {
        return { success: false, error: error.message };
    }
};
exports.testWebhook = testWebhook;
//# sourceMappingURL=webhookService.js.map