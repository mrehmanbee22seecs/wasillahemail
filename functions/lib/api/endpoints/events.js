"use strict";
/**
 * Events API Endpoints
 * Handlers for event CRUD operations
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
exports.rejectEvent = exports.approveEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventById = exports.listEvents = void 0;
const admin = __importStar(require("firebase-admin"));
const responses_1 = require("../utils/responses");
const apiHelpers_1 = require("../utils/apiHelpers");
const db = admin.firestore();
const listEvents = async (req, res) => {
    try {
        const { page, perPage } = (0, apiHelpers_1.getPaginationParams)(req.query);
        const { status, projectId } = req.query;
        let query = db.collection('event_submissions').orderBy('submittedAt', 'desc');
        if (status) {
            query = query.where('status', '==', status);
        }
        if (projectId) {
            query = query.where('projectId', '==', projectId);
        }
        const offset = (page - 1) * perPage;
        const snapshot = await query.limit(perPage + 1).offset(offset).get();
        const items = snapshot.docs.slice(0, perPage).map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        const hasNext = snapshot.docs.length > perPage;
        const pagination = (0, apiHelpers_1.calculatePagination)(page, perPage);
        pagination.hasNext = hasNext;
        return (0, responses_1.paginatedResponse)(res, items, pagination);
    }
    catch (error) {
        console.error('List events error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch events', 500);
    }
};
exports.listEvents = listEvents;
const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('event_submissions').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Event not found', 404);
        }
        return (0, responses_1.successResponse)(res, { id: doc.id, ...doc.data() });
    }
    catch (error) {
        console.error('Get event error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch event', 500);
    }
};
exports.getEventById = getEventById;
const createEvent = async (req, res) => {
    try {
        const eventData = {
            ...req.body,
            submittedBy: req.userId,
            status: 'pending',
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            isVisible: false,
        };
        const docRef = await db.collection('event_submissions').add(eventData);
        return (0, responses_1.successResponse)(res, { id: docRef.id, status: 'pending' }, 'Event created successfully. Pending approval.', 201);
    }
    catch (error) {
        console.error('Create event error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to create event', 500);
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('event_submissions').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Event not found', 404);
        }
        const eventData = doc.data();
        if (eventData?.submittedBy !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Not authorized to update this event', 403);
        }
        await db.collection('event_submissions').doc(id).update({
            ...req.body,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return (0, responses_1.successResponse)(res, { id }, 'Event updated successfully');
    }
    catch (error) {
        console.error('Update event error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to update event', 500);
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('event_submissions').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Event not found', 404);
        }
        const eventData = doc.data();
        if (eventData?.submittedBy !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Not authorized to delete this event', 403);
        }
        await db.collection('event_submissions').doc(id).delete();
        return (0, responses_1.successResponse)(res, { id }, 'Event deleted successfully');
    }
    catch (error) {
        console.error('Delete event error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to delete event', 500);
    }
};
exports.deleteEvent = deleteEvent;
const approveEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        await db.collection('event_submissions').doc(id).update({
            status: 'approved',
            isVisible: true,
            approvedBy: req.userId,
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            ...(reason && { approvalReason: reason }),
        });
        return (0, responses_1.successResponse)(res, { id }, 'Event approved successfully');
    }
    catch (error) {
        console.error('Approve event error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to approve event', 500);
    }
};
exports.approveEvent = approveEvent;
const rejectEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        await db.collection('event_submissions').doc(id).update({
            status: 'rejected',
            isVisible: false,
            rejectedBy: req.userId,
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectionReason: reason || 'No reason provided',
        });
        return (0, responses_1.successResponse)(res, { id }, 'Event rejected successfully');
    }
    catch (error) {
        console.error('Reject event error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to reject event', 500);
    }
};
exports.rejectEvent = rejectEvent;
//# sourceMappingURL=events.js.map