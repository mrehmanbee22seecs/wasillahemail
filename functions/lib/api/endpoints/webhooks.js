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
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryDelivery = exports.testWebhookEndpoint = exports.getDeliveries = exports.deleteWebhook = exports.updateWebhook = exports.createWebhook = exports.getWebhook = exports.listWebhooks = void 0;
const admin = __importStar(require("firebase-admin"));
const responses_1 = require("../utils/responses");
const apiHelpers_1 = require("../utils/apiHelpers");
const crypto = __importStar(require("crypto"));
const db = admin.firestore();
/**
 * Webhooks Endpoint Handler
 * Manages webhook subscriptions and deliveries
 */
// List webhooks for current user
const listWebhooks = async (req, res) => {
    try {
        const { page, perPage } = (0, apiHelpers_1.getPaginationParams)(req.query);
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
        const pagination = (0, apiHelpers_1.calculatePagination)(page, perPage);
        pagination.hasNext = hasNext;
        return (0, responses_1.paginatedResponse)(res, items, pagination);
    }
    catch (error) {
        console.error('List webhooks error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch webhooks', 500);
    }
};
exports.listWebhooks = listWebhooks;
// Get single webhook
const getWebhook = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Unauthorized to access this webhook', 403);
        }
        return (0, responses_1.successResponse)(res, {
            id: doc.id,
            ...webhook,
            // Don't expose full secret, just hint
            secret: webhook?.secret ? `${webhook.secret.substring(0, 8)}...` : undefined,
        });
    }
    catch (error) {
        console.error('Get webhook error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch webhook', 500);
    }
};
exports.getWebhook = getWebhook;
// Create webhook
const createWebhook = async (req, res) => {
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
        return (0, responses_1.successResponse)(res, {
            id: doc.id,
            ...doc.data(),
        }, 'Webhook created successfully', 201);
    }
    catch (error) {
        console.error('Create webhook error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to create webhook', 500);
    }
};
exports.createWebhook = createWebhook;
// Update webhook
const updateWebhook = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Unauthorized to update this webhook', 403);
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
        return (0, responses_1.successResponse)(res, {
            id: updatedDoc.id,
            ...updatedDoc.data(),
            secret: undefined,
        }, 'Webhook updated successfully');
    }
    catch (error) {
        console.error('Update webhook error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to update webhook', 500);
    }
};
exports.updateWebhook = updateWebhook;
// Delete webhook
const deleteWebhook = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Unauthorized to delete this webhook', 403);
        }
        await db.collection('webhooks').doc(id).delete();
        return (0, responses_1.successResponse)(res, { message: 'Webhook deleted successfully' });
    }
    catch (error) {
        console.error('Delete webhook error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to delete webhook', 500);
    }
};
exports.deleteWebhook = deleteWebhook;
// Get webhook deliveries
const getDeliveries = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50 } = req.query;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Unauthorized to access webhook deliveries', 403);
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
        return (0, responses_1.successResponse)(res, deliveries);
    }
    catch (error) {
        console.error('Get deliveries error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch webhook deliveries', 500);
    }
};
exports.getDeliveries = getDeliveries;
// Test webhook
const testWebhookEndpoint = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Unauthorized to test this webhook', 403);
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
            return (0, responses_1.successResponse)(res, { message: 'Test webhook delivered successfully' });
        }
        catch (deliveryError) {
            return (0, responses_1.errorResponse)(res, 'DELIVERY_FAILED', `Test webhook delivery failed: ${deliveryError.message}`, 500);
        }
    }
    catch (error) {
        console.error('Test webhook error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to test webhook', 500);
    }
};
exports.testWebhookEndpoint = testWebhookEndpoint;
// Retry webhook delivery
const retryDelivery = async (req, res) => {
    try {
        const { id, deliveryId } = req.params;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Unauthorized to retry webhook delivery', 403);
        }
        // Get the delivery record
        const deliveryDoc = await db.collection('webhook_deliveries').doc(deliveryId).get();
        if (!deliveryDoc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Delivery record not found', 404);
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
            return (0, responses_1.successResponse)(res, { message: 'Webhook delivery retried successfully' });
        }
        catch (deliveryError) {
            // Update failure record
            await db.collection('webhook_deliveries').doc(deliveryId).update({
                status: 'failed',
                retryCount: (delivery?.retryCount || 0) + 1,
                lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
                error: deliveryError.message
            });
            return (0, responses_1.errorResponse)(res, 'DELIVERY_FAILED', `Webhook delivery retry failed: ${deliveryError.message}`, 500);
        }
    }
    catch (error) {
        console.error('Retry delivery error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to retry webhook delivery', 500);
    }
};
exports.retryDelivery = retryDelivery;
//# sourceMappingURL=webhooks.js.map