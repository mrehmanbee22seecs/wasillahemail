"use strict";
/**
 * Projects API Endpoints
 * Handlers for project CRUD operations
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
exports.rejectProject = exports.approveProject = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjectById = exports.listProjects = void 0;
const admin = __importStar(require("firebase-admin"));
const responses_1 = require("../utils/responses");
const apiHelpers_1 = require("../utils/apiHelpers");
const db = admin.firestore();
const listProjects = async (req, res) => {
    try {
        const { page, perPage } = (0, apiHelpers_1.getPaginationParams)(req.query);
        const { status, search, category } = req.query;
        let query = db.collection('project_submissions').orderBy('submittedAt', 'desc');
        // Apply filters
        if (status) {
            query = query.where('status', '==', status);
        }
        if (category) {
            query = query.where('category', '==', category);
        }
        // Get documents with pagination
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
        console.error('List projects error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch projects', 500);
    }
};
exports.listProjects = listProjects;
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('project_submissions').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Project not found', 404);
        }
        return (0, responses_1.successResponse)(res, { id: doc.id, ...doc.data() });
    }
    catch (error) {
        console.error('Get project error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch project', 500);
    }
};
exports.getProjectById = getProjectById;
const createProject = async (req, res) => {
    try {
        const projectData = {
            ...req.body,
            submittedBy: req.userId,
            status: 'pending',
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            isVisible: false,
        };
        const docRef = await db.collection('project_submissions').add(projectData);
        return (0, responses_1.successResponse)(res, { id: docRef.id, status: 'pending' }, 'Project created successfully. Pending approval.', 201);
    }
    catch (error) {
        console.error('Create project error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to create project', 500);
    }
};
exports.createProject = createProject;
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('project_submissions').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Project not found', 404);
        }
        const projectData = doc.data();
        if (projectData?.submittedBy !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Not authorized to update this project', 403);
        }
        await db.collection('project_submissions').doc(id).update({
            ...req.body,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return (0, responses_1.successResponse)(res, { id }, 'Project updated successfully');
    }
    catch (error) {
        console.error('Update project error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to update project', 500);
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('project_submissions').doc(id).get();
        if (!doc.exists) {
            return (0, responses_1.errorResponse)(res, 'NOT_FOUND', 'Project not found', 404);
        }
        const projectData = doc.data();
        if (projectData?.submittedBy !== req.userId && !req.isAdmin) {
            return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Not authorized to delete this project', 403);
        }
        await db.collection('project_submissions').doc(id).delete();
        return (0, responses_1.successResponse)(res, { id }, 'Project deleted successfully');
    }
    catch (error) {
        console.error('Delete project error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to delete project', 500);
    }
};
exports.deleteProject = deleteProject;
const approveProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        await db.collection('project_submissions').doc(id).update({
            status: 'approved',
            isVisible: true,
            approvedBy: req.userId,
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            ...(reason && { approvalReason: reason }),
        });
        return (0, responses_1.successResponse)(res, { id }, 'Project approved successfully');
    }
    catch (error) {
        console.error('Approve project error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to approve project', 500);
    }
};
exports.approveProject = approveProject;
const rejectProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        await db.collection('project_submissions').doc(id).update({
            status: 'rejected',
            isVisible: false,
            rejectedBy: req.userId,
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectionReason: reason || 'No reason provided',
        });
        return (0, responses_1.successResponse)(res, { id }, 'Project rejected successfully');
    }
    catch (error) {
        console.error('Reject project error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to reject project', 500);
    }
};
exports.rejectProject = rejectProject;
//# sourceMappingURL=projects.js.map