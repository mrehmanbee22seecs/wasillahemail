/**
 * Authentication Middleware
 * Verifies Firebase Auth tokens and attaches user info to requests
 */

import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { errorResponse } from '../utils/responses';

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
  userId?: string;
  userRole?: string;
  isAdmin?: boolean;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        res,
        'UNAUTHORIZED',
        'Missing or invalid authorization header',
        401
      );
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
    } else {
      req.userRole = 'volunteer';
      req.isAdmin = false;
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return errorResponse(res, 'UNAUTHORIZED', 'Invalid authentication token', 401);
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return errorResponse(res, 'UNAUTHORIZED', 'Authentication required', 401);
  }

  if (!req.isAdmin) {
    return errorResponse(res, 'FORBIDDEN', 'Admin privileges required', 403);
  }

  next();
};

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return errorResponse(res, 'UNAUTHORIZED', 'Authentication required', 401);
  }
  next();
};
