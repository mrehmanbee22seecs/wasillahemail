"use strict";
/**
 * Analytics API Endpoints
 * Handlers for analytics and metrics
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
exports.getUserAnalytics = exports.getEventAnalytics = exports.getProjectAnalytics = exports.getPlatformAnalytics = void 0;
const admin = __importStar(require("firebase-admin"));
const responses_1 = require("../utils/responses");
const db = admin.firestore();
const getPlatformAnalytics = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        // Get basic analytics
        const [totalUsers, totalProjects, totalEvents, approvedProjects, upcomingEvents,] = await Promise.all([
            db.collection('users').count().get(),
            db.collection('project_submissions').count().get(),
            db.collection('event_submissions').count().get(),
            db.collection('project_submissions').where('status', '==', 'approved').count().get(),
            db.collection('event_submissions').where('status', '==', 'approved').count().get(),
        ]);
        const analytics = {
            totalUsers: totalUsers.data().count,
            totalProjects: totalProjects.data().count,
            totalEvents: totalEvents.data().count,
            activeProjects: approvedProjects.data().count,
            upcomingEvents: upcomingEvents.data().count,
            growthMetrics: {
                usersGrowth: 0,
                projectsGrowth: 0,
                eventsGrowth: 0,
            },
        };
        return (0, responses_1.successResponse)(res, analytics);
    }
    catch (error) {
        console.error('Get platform analytics error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch analytics', 500);
    }
};
exports.getPlatformAnalytics = getPlatformAnalytics;
const getProjectAnalytics = async (req, res) => {
    try {
        const statusSnapshot = await db.collection('project_submissions').get();
        const statusCounts = {};
        statusSnapshot.docs.forEach((doc) => {
            const status = doc.data().status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        return (0, responses_1.successResponse)(res, {
            totalProjects: statusSnapshot.size,
            byStatus: statusCounts,
        });
    }
    catch (error) {
        console.error('Get project analytics error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch project analytics', 500);
    }
};
exports.getProjectAnalytics = getProjectAnalytics;
const getEventAnalytics = async (req, res) => {
    try {
        const statusSnapshot = await db.collection('event_submissions').get();
        const statusCounts = {};
        statusSnapshot.docs.forEach((doc) => {
            const status = doc.data().status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        return (0, responses_1.successResponse)(res, {
            totalEvents: statusSnapshot.size,
            byStatus: statusCounts,
        });
    }
    catch (error) {
        console.error('Get event analytics error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch event analytics', 500);
    }
};
exports.getEventAnalytics = getEventAnalytics;
const getUserAnalytics = async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const roleCounts = {};
        usersSnapshot.docs.forEach((doc) => {
            const role = doc.data().role || 'unknown';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
        return (0, responses_1.successResponse)(res, {
            totalUsers: usersSnapshot.size,
            byRole: roleCounts,
        });
    }
    catch (error) {
        console.error('Get user analytics error:', error);
        return (0, responses_1.errorResponse)(res, 'INTERNAL_ERROR', 'Failed to fetch user analytics', 500);
    }
};
exports.getUserAnalytics = getUserAnalytics;
//# sourceMappingURL=analytics.js.map