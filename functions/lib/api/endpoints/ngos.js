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
exports.rejectNGO = exports.verifyNGO = exports.deleteNGO = exports.updateNGO = exports.createNGO = exports.getNGO = exports.listNGOs = void 0;
const admin = __importStar(require("firebase-admin"));
const responses_1 = require("../utils/responses");
const apiHelpers_1 = require("../utils/apiHelpers");
const db = admin.firestore();
/**
 * NGOs Endpoint Handler
 * Handles all NGO-related operations
 */
// List NGOs with pagination and filtering
const listNGOs = async (req, res) => {
    try {
        const { page, perPage } = (0, apiHelpers_1.getPaginationParams)(req.query);
        const { status, verified, location } = req.query;
        let query = db.collection('ngos').orderBy('createdAt', 'desc');
        // Apply filters
        if (status) {
            query = query.where('status', '==', status);
        }
        if (verified !== undefined) {
            query = query.where('verified', '==', verified === 'true');
        }
        if (location) {
            query = query.where('location', '==', location);
        }
        // Apply pagination
        const offset = (page - 1) * perPage;
        const snapshot = await query.limit(perPage + 1).offset(offset).get();
        const items = snapshot.docs.slice(0, perPage).map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        const hasNext = snapshot.docs.length > perPage;
        const pagination = (0, apiHelpers_1.calculatePagination)(page, perPage);
        pagination.hasNext = hasNext;
        return (0, responses_1.paginatedResponse)(res, items, pagination);
    }
    catch (error) {
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', error.message, 500);
    }
};
exports.listNGOs = listNGOs;
// Get single NGO by ID
const getNGO = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('ngos').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'NGO not found', 404);
        }
        return (0, responses_1.successResponse)(res, {
            id: doc.id,
            ...doc.data()
        });
    }
    catch (error) {
        console.error('Get NGO error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch NGO', 500);
    }
};
exports.getNGO = getNGO;
// Create new NGO
const createNGO = async (req, res) => {
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
        return (0, responses_1.successResponse)(res, {
            id: doc.id,
            ...doc.data()
        }, 'NGO created successfully', 201);
    }
    catch (error) {
        console.error('Create NGO error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to create NGO', 500);
    }
};
exports.createNGO = createNGO;
// Update NGO
const updateNGO = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('ngos').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'NGO not found', 404);
        }
        const ngoData = doc.data();
        // Check if user is owner or admin
        if (ngoData?.ownerId !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Unauthorized to update this NGO', 403);
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
        return (0, responses_1.successResponse)(res, {
            id: updatedDoc.id,
            ...updatedDoc.data()
        }, 'NGO updated successfully');
    }
    catch (error) {
        console.error('Update NGO error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to update NGO', 500);
    }
};
exports.updateNGO = updateNGO;
// Delete NGO
const deleteNGO = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('ngos').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'NGO not found', 404);
        }
        const ngoData = doc.data();
        // Check if user is owner or admin
        if (ngoData?.ownerId !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Unauthorized to delete this NGO', 403);
        }
        await db.collection('ngos').doc(id).delete();
        return (0, responses_1.successResponse)(res, { message: 'NGO deleted successfully' });
    }
    catch (error) {
        console.error('Delete NGO error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to delete NGO', 500);
    }
};
exports.deleteNGO = deleteNGO;
// Verify NGO (admin only)
const verifyNGO = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        if (!req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Admin access required', 403);
        }
        const doc = await db.collection('ngos').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'NGO not found', 404);
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
        return (0, responses_1.successResponse)(res, {
            id: updatedDoc.id,
            ...updatedDoc.data()
        }, 'NGO verified successfully');
    }
    catch (error) {
        console.error('Verify NGO error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to verify NGO', 500);
    }
};
exports.verifyNGO = verifyNGO;
// Reject NGO verification (admin only)
const rejectNGO = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Admin access required', 403);
        }
        const doc = await db.collection('ngos').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'NGO not found', 404);
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
        return (0, responses_1.successResponse)(res, {
            id: updatedDoc.id,
            ...updatedDoc.data()
        }, 'NGO rejected successfully');
    }
    catch (error) {
        console.error('Reject NGO error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to reject NGO', 500);
    }
};
exports.rejectNGO = rejectNGO;
//# sourceMappingURL=ngos.js.map