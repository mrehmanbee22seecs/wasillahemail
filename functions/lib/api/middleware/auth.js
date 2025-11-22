"use strict";
/**
 * Authentication Middleware
 * Verifies Firebase Auth tokens and attaches user info to requests
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
exports.requireAuth = exports.requireAdmin = exports.authenticate = void 0;
const admin = __importStar(require("firebase-admin"));
const responses_1 = require("../utils/responses");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return (0, responses_1.errorResponse)(res, 'UNAUTHORIZED', 'Missing or invalid authorization header', 401);
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        req.userId = decodedToken.uid;
        // Get user role from Firestore
        const userDoc = await admin
            .firestore()
            .collection('users')
            .doc(decodedToken.uid)
            .get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            req.userRole = userData?.role || 'volunteer';
            req.isAdmin = userData?.isAdmin || false;
        }
        else {
            req.userRole = 'volunteer';
            req.isAdmin = false;
        }
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return (0, responses_1.errorResponse)(res, 'UNAUTHORIZED', 'Invalid authentication token', 401);
    }
};
exports.authenticate = authenticate;
const requireAdmin = async (req, res, next) => {
    if (!req.userId) {
        return (0, responses_1.errorResponse)(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }
    if (!req.isAdmin) {
        return (0, responses_1.errorResponse)(res, 'FORBIDDEN', 'Admin privileges required', 403);
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireAuth = (req, res, next) => {
    if (!req.userId) {
        return (0, responses_1.errorResponse)(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }
    next();
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=auth.js.map