/**
 * Admin Routes
 * Route definitions for admin endpoints
 */

import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { adminRateLimit } from '../middleware/rateLimiter';
import {
  getPlatformStats,
  getSystemHealth,
  getModerationQueue,
  bulkOperation,
} from '../endpoints/admin';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);
router.use(adminRateLimit);

router.get('/stats', getPlatformStats);
router.get('/health', getSystemHealth);
router.get('/moderation', getModerationQueue);
router.post('/bulk', bulkOperation);

export default router;
