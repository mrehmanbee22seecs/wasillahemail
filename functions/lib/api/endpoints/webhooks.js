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
const webhookService_1 = require("../services/webhookService");
const crypto = __importStar(require("crypto"));
const db = admin.firestore();
/**
 * Webhooks Endpoint Handler
 * Manages webhook subscriptions and deliveries
 */
// List webhooks for current user
const listWebhooks = async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, perPage = 20 } = (0, apiHelpers_1.sanitizeQueryParams)(req.query);
        const query = db
            .collection('webhooks')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc');
        const { paginatedQuery, offset } = (0, apiHelpers_1.buildPaginationQuery)(query, page, perPage);
        const snapshot = await paginatedQuery.get();
        const totalSnapshot = await query.get();
        const total = totalSnapshot.size;
        const webhooks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Don't expose secret in list
            secret: undefined,
        }));
        return (0, responses_1.paginatedResponse)(res, webhooks, total, page, perPage);
    }
    catch (error) {
        return (0, responses_1.errorResponse)(res, error.message, 500);
    }
};
exports.listWebhooks = listWebhooks;
// Get single webhook
const getWebhook = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== user.uid && !user.admin) {
            return (0, responses_1.errorResponse)(res, 'Unauthorized', 403);
        }
        return (0, responses_1.successResponse)(res, {
            id: doc.id,
            ...webhook,
            // Don't expose full secret, just hint
            secret: webhook?.secret ? `${webhook.secret.substring(0, 8)}...` : undefined,
        });
    }
    catch (error) {
        return (0, responses_1.errorResponse)(res, error.message, 500);
    }
};
exports.getWebhook = getWebhook;
// Create webhook
const createWebhook = async (req, res) => {
    try {
        const user = req.user;
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
        return (0, responses_1.successResponse)(res, {
            id: doc.id,
            ...doc.data(),
        }, 201);
    }
    catch (error) {
        return (0, responses_1.errorResponse)(res, error.message, 500);
    }
};
exports.createWebhook = createWebhook;
// Update webhook
const updateWebhook = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== user.uid && !user.admin) {
            return (0, responses_1.errorResponse)(res, 'Unauthorized', 403);
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
        });
    }
    catch (error) {
        return (0, responses_1.errorResponse)(res, error.message, 500);
    }
};
exports.updateWebhook = updateWebhook;
// Delete webhook
const deleteWebhook = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== user.uid && !user.admin) {
            return (0, responses_1.errorResponse)(res, 'Unauthorized', 403);
        }
        await db.collection('webhooks').doc(id).delete();
        return (0, responses_1.successResponse)(res, { message: 'Webhook deleted successfully' });
    }
    catch (error) {
        return (0, responses_1.errorResponse)(res, error.message, 500);
    }
};
exports.deleteWebhook = deleteWebhook;
// Get webhook deliveries
const getDeliveries = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { limit = 50 } = req.query;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== user.uid && !user.admin) {
            return (0, responses_1.errorResponse)(res, 'Unauthorized', 403);
        }
        const deliveries = await (0, webhookService_1.getWebhookDeliveries)(id, Number(limit));
        return (0, responses_1.successResponse)(res, deliveries);
    }
    catch (error) {
        return (0, responses_1.errorResponse)(res, error.message, 500);
    }
};
exports.getDeliveries = getDeliveries;
// Test webhook
const testWebhookEndpoint = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== user.uid && !user.admin) {
            return (0, responses_1.errorResponse)(res, 'Unauthorized', 403);
        }
        const result = await (0, webhookService_1.testWebhook)(id);
        if (result.success) {
            return (0, responses_1.successResponse)(res, { message: 'Test webhook delivered successfully' });
        }
        else {
            return (0, responses_1.errorResponse)(res, result.error || 'Test webhook delivery failed', 500);
        }
    }
    catch (error) {
        return (0, responses_1.errorResponse)(res, error.message, 500);
    }
};
exports.testWebhookEndpoint = testWebhookEndpoint;
// Retry webhook delivery
const retryDelivery = async (req, res) => {
    try {
        const { id, deliveryId } = req.params;
        const user = req.user;
        const doc = await db.collection('webhooks').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'Webhook not found', 404);
        }
        const webhook = doc.data();
        // Check ownership
        if (webhook?.userId !== user.uid && !user.admin) {
            return (0, responses_1.errorResponse)(res, 'Unauthorized', 403);
        }
        const result = await (0, webhookService_1.retryWebhookDelivery)(deliveryId);
        if (result.success) {
            return (0, responses_1.successResponse)(res, { message: 'Webhook delivery retried successfully' });
        }
        else {
            return (0, responses_1.errorResponse)(res, result.error || 'Retry failed', 500);
        }
    }
    catch (error) {
        return (0, responses_1.errorResponse)(res, error.message, 500);
    }
};
exports.retryDelivery = retryDelivery;
//# sourceMappingURL=webhooks.js.map