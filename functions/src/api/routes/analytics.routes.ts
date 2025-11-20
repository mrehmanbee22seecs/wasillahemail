/**
 * Analytics Routes
 * Route definitions for analytics endpoints
 */

import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { adminRateLimit } from '../middleware/rateLimiter';
import {
  getPlatformAnalytics,
  getProjectAnalytics,
  getEventAnalytics,
  getUserAnalytics,
} from '../endpoints/analytics';

const router = Router();

// All analytics routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);
router.use(adminRateLimit);

router.get('/platform', getPlatformAnalytics);
router.get('/projects', getProjectAnalytics);
router.get('/events', getEventAnalytics);
router.get('/users', getUserAnalytics);

export default router;
