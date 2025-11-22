/**
 * Rate Limiting Middleware
 * Implements rate limiting based on user roles
 */

import rateLimit from 'express-rate-limit';
import { API_CONFIG } from '../config/api.config';
import { AuthRequest } from './auth';

export const createRateLimiter = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: AuthRequest) => {
      return req.userId || req.ip || 'anonymous';
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          statusCode: 429,
          retryAfter: Math.ceil(windowMs / 1000),
        },
      });
    },
  });
};

// Role-based rate limiters
export const volunteerRateLimit = createRateLimiter(
  API_CONFIG.rateLimit.volunteer.windowMs,
  API_CONFIG.rateLimit.volunteer.max
);

export const ngoRateLimit = createRateLimiter(
  API_CONFIG.rateLimit.ngo.windowMs,
  API_CONFIG.rateLimit.ngo.max
);

export const adminRateLimit = createRateLimiter(
  API_CONFIG.rateLimit.admin.windowMs,
  API_CONFIG.rateLimit.admin.max
);

// Dynamic rate limiter based on user role
export const dynamicRateLimit = (req: AuthRequest, res: any, next: any) => {
  const role = req.userRole || 'volunteer';

  if (role === 'admin' || req.isAdmin) {
    return adminRateLimit(req, res, next);
  } else if (role === 'ngo') {
    return ngoRateLimit(req, res, next);
  } else {
    return volunteerRateLimit(req, res, next);
  }
};
