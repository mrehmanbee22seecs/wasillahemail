/**
 * Users Routes
 * Route definitions for user endpoints
 */

import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { dynamicRateLimit } from '../middleware/rateLimiter';
import { paginationValidation } from '../middleware/validator';
import {
  listUsers,
  getUserById,
  getCurrentUser,
  updateUser,
  deleteUser,
} from '../endpoints/users';

const router = Router();

router.get('/', authenticate, requireAdmin, dynamicRateLimit, paginationValidation, listUsers);
router.get('/me', authenticate, dynamicRateLimit, getCurrentUser);
router.get('/:id', authenticate, dynamicRateLimit, getUserById);
router.patch('/:id', authenticate, dynamicRateLimit, updateUser);
router.delete('/:id', authenticate, requireAdmin, dynamicRateLimit, deleteUser);

export default router;
