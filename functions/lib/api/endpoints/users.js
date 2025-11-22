"use strict";
/**
 * Users API Endpoints
 * Handlers for user profile operations
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
exports.deleteUser = exports.updateUser = exports.getCurrentUser = exports.getUserById = exports.listUsers = void 0;
const admin = __importStar(require("firebase-admin"));
const responses_1 = require("../utils/responses");
const apiHelpers_1 = require("../utils/apiHelpers");
const db = admin.firestore();
const listUsers = async (req, res) => {
    try {
        const { page, perPage } = (0, apiHelpers_1.getPaginationParams)(req.query);
        const { role, isActive } = req.query;
        let query = db.collection('users').orderBy('createdAt', 'desc');
        if (role) {
            query = query.where('role', '==', role);
        }
        if (isActive !== undefined) {
            query = query.where('isActive', '==', isActive === 'true');
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
        console.error('List users error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch users', 500);
    }
};
exports.listUsers = listUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        // Users can only view their own profile unless they're admin
        if (id !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Not authorized to view this profile', 403);
        }
        const doc = await db.collection('users').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'User not found', 404);
        }
        return (0, responses_1.successResponse)(res, { id: doc.id, ...doc.data() });
    }
    catch (error) {
        console.error('Get user error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch user', 500);
    }
};
exports.getUserById = getUserById;
const getCurrentUser = async (req, res) => {
    try {
        const doc = await db.collection('users').doc(req.userId).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'User profile not found', 404);
        }
        return (0, responses_1.successResponse)(res, { id: doc.id, ...doc.data() });
    }
    catch (error) {
        console.error('Get current user error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch user profile', 500);
    }
};
exports.getCurrentUser = getCurrentUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Users can only update their own profile unless they're admin
        if (id !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Not authorized to update this profile', 403);
        }
        await db.collection('users').doc(id).update({
            ...req.body,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return (0, responses_1.successResponse)(res, { id }, 'User profile updated successfully');
    }
    catch (error) {
        console.error('Update user error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to update user profile', 500);
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Delete from Firebase Auth first to avoid orphaned auth users
         await admin.auth().deleteUser(id);
         // Then delete from Firestore
        await db.collection('users').doc(id).delete();
        
        return (0, responses_1.successResponse)(res, { id }, 'User deleted successfully');
    } catch (error) {
        console.error('Delete user error:', error);
         // If Firestore deletion failed after Auth deletion, surface partial state
         if (error && error.code === 5 /* Firestore NOT_FOUND or similar */) {
             return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'User deleted from auth but not from database', 500);
         }
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to delete user', 500);
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=users.js.map
