/**
 * Events Routes
 * Route definitions for event endpoints
 */

import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { dynamicRateLimit } from '../middleware/rateLimiter';
import {
  createEventValidation,
  updateEventValidation,
  paginationValidation,
} from '../middleware/validator';
import {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  approveEvent,
  rejectEvent,
} from '../endpoints/events';

const router = Router();

router.get('/', authenticate, dynamicRateLimit, paginationValidation, listEvents);
router.get('/:id', authenticate, dynamicRateLimit, getEventById);
router.post('/', authenticate, dynamicRateLimit, createEventValidation, createEvent);
router.patch('/:id', authenticate, dynamicRateLimit, updateEventValidation, updateEvent);
router.delete('/:id', authenticate, dynamicRateLimit, deleteEvent);
router.post('/:id/approve', authenticate, requireAdmin, dynamicRateLimit, approveEvent);
router.post('/:id/reject', authenticate, requireAdmin, dynamicRateLimit, rejectEvent);

export default router;
