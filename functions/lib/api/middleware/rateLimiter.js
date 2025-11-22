"use strict";
/**
 * Rate Limiting Middleware
 * Implements rate limiting based on user roles
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicRateLimit = exports.adminRateLimit = exports.ngoRateLimit = exports.volunteerRateLimit = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const api_config_1 = require("../config/api.config");
const createRateLimiter = (windowMs, max) => {
    return (0, express_rate_limit_1.default)({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
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
exports.createRateLimiter = createRateLimiter;
// Role-based rate limiters
exports.volunteerRateLimit = (0, exports.createRateLimiter)(api_config_1.API_CONFIG.rateLimit.volunteer.windowMs, api_config_1.API_CONFIG.rateLimit.volunteer.max);
exports.ngoRateLimit = (0, exports.createRateLimiter)(api_config_1.API_CONFIG.rateLimit.ngo.windowMs, api_config_1.API_CONFIG.rateLimit.ngo.max);
exports.adminRateLimit = (0, exports.createRateLimiter)(api_config_1.API_CONFIG.rateLimit.admin.windowMs, api_config_1.API_CONFIG.rateLimit.admin.max);
// Dynamic rate limiter based on user role
const dynamicRateLimit = (req, res, next) => {
    const role = req.userRole || 'volunteer';
    if (role === 'admin' || req.isAdmin) {
        return (0, exports.adminRateLimit)(req, res, next);
    }
    else if (role === 'ngo') {
        return (0, exports.ngoRateLimit)(req, res, next);
    }
    else {
        return (0, exports.volunteerRateLimit)(req, res, next);
    }
};
exports.dynamicRateLimit = dynamicRateLimit;
//# sourceMappingURL=rateLimiter.js.map