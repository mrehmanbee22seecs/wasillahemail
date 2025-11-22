/**
 * Projects Routes
 * Route definitions for project endpoints
 */

import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { dynamicRateLimit } from '../middleware/rateLimiter';
import {
  createProjectValidation,
  updateProjectValidation,
  paginationValidation,
} from '../middleware/validator';
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  approveProject,
  rejectProject,
} from '../endpoints/projects';

const router = Router();

// Public routes (with authentication)
router.get('/', authenticate, dynamicRateLimit, paginationValidation, listProjects);
router.get('/:id', authenticate, dynamicRateLimit, getProjectById);

// Protected routes (require authentication)
router.post('/', authenticate, dynamicRateLimit, createProjectValidation, createProject);
router.patch('/:id', authenticate, dynamicRateLimit, updateProjectValidation, updateProject);
router.delete('/:id', authenticate, dynamicRateLimit, deleteProject);

// Admin-only routes
router.post('/:id/approve', authenticate, requireAdmin, dynamicRateLimit, approveProject);
router.post('/:id/reject', authenticate, requireAdmin, dynamicRateLimit, rejectProject);

export default router;
