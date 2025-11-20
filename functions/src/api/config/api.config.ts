/**
 * API Configuration
 * Central configuration for the REST API
 */

export const API_CONFIG = {
  version: '1.0.0',
  basePath: '/api',
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
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

export default API_CONFIG;
