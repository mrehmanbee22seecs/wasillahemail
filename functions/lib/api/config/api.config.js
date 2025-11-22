"use strict";
/**
 * API Configuration
 * Central configuration for the REST API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_CONFIG = void 0;
exports.API_CONFIG = {
    version: '1.0.0',
    basePath: '/api',
    cors: {
       // Safely parse env and enforce secure defaults
         origin: (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.trim().length > 0)
           ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
           : false, // disallow all by default when credentials are true
         credentials: true,
    },
    rateLimit: {
        volunteer: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 100, // 100 requests per hour
        },
        ngo: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 500, // 500 requests per hour
        },
        admin: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 1000, // 1000 requests per hour
        },
    },
    pagination: {
        defaultPage: 1,
        defaultPerPage: 10,
        maxPerPage: 100,
    },
};
exports.default = exports.API_CONFIG;
//# sourceMappingURL=api.config.js.map
