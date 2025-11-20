"use strict";
/**
 * Admin API Endpoints
 * Handlers for admin-only operations
 */
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
exports.bulkOperation = exports.getModerationQueue = exports.getSystemHealth = exports.getPlatformStats = void 0;
const admin = __importStar(require("firebase-admin"));
const responses_1 = require("../utils/responses");
const db = admin.firestore();
const getPlatformStats = async (req, res) => {
    try {
        // Get counts for various resources
        const [usersSnapshot, projectsSnapshot, eventsSnapshot, ngosSnapshot] = await Promise.all([
            db.collection('users').count().get(),
            db.collection('project_submissions').count().get(),
            db.collection('event_submissions').count().get(),
            db.collection('users').where('role', '==', 'ngo').count().get(),
        ]);
        const stats = {
            totalUsers: usersSnapshot.data().count,
            totalProjects: projectsSnapshot.data().count,
            totalEvents: eventsSnapshot.data().count,
            totalNgos: ngosSnapshot.data().count,
            timestamp: new Date(),
        };
        return (0, responses_1.successResponse)(res, stats);
    }
    catch (error) {
        console.error('Get platform stats error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch platform statistics', 500);
    }
};
exports.getPlatformStats = getPlatformStats;
const getSystemHealth = async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            uptime: process.uptime(),
            lastCheck: new Date(),
            services: {
                firestore: 'operational',
                auth: 'operational',
                storage: 'operational',
                functions: 'operational',
            },
        };
        return (0, responses_1.successResponse)(res, health);
    }
    catch (error) {
        console.error('Get system health error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to check system health', 500);
    }
};
exports.getSystemHealth = getSystemHealth;
const getModerationQueue = async (req, res) => {
    try {
        const [projectsSnapshot, eventsSnapshot] = await Promise.all([
            db.collection('project_submissions').where('status', '==', 'pending').count().get(),
            db.collection('event_submissions').where('status', '==', 'pending').count().get(),
        ]);
        const queue = {
            projects: projectsSnapshot.data().count,
            events: eventsSnapshot.data().count,
            users: 0,
            reports: 0,
        };
        return (0, responses_1.successResponse)(res, queue);
    }
    catch (error) {
        console.error('Get moderation queue error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch moderation queue', 500);
    }
};
exports.getModerationQueue = getModerationQueue;
const bulkOperation = async (req, res) => {
    try {
        const { operation, resourceType, resourceIds, reason } = req.body;
        if (!operation || !resourceType || !resourceIds || !Array.isArray(resourceIds)) {
            return (0, responses_1.errorResponse)(res, 'VALIDATION_ERROR', 'Invalid bulk operation request', 400);
        }
        const collection = resourceType === 'project' ? 'project_submissions' : 'event_submissions';
        const batch = db.batch();
        resourceIds.forEach((id) => {
            const docRef = db.collection(collection).doc(id);
            if (operation === 'approve') {
                batch.update(docRef, {
                    status: 'approved',
                    isVisible: true,
                    approvedBy: req.userId,
                    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
                    ...(reason && { approvalReason: reason }),
                });
            }
            else if (operation === 'reject') {
                batch.update(docRef, {
                    status: 'rejected',
                    isVisible: false,
                    rejectedBy: req.userId,
                    rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
                    ...(reason && { rejectionReason: reason }),
                });
            }
        });
        await batch.commit();
        return (0, responses_1.successResponse)(res, { processedCount: resourceIds.length }, `Bulk ${operation} completed successfully`);
    }
    catch (error) {
        console.error('Bulk operation error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to perform bulk operation', 500);
    }
};
exports.bulkOperation = bulkOperation;
//# sourceMappingURL=admin.js.map