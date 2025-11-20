import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth';
import { dynamicRateLimit } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validator';
import {
  listNGOs,
  getNGO,
  createNGO,
  updateNGO,
  deleteNGO,
  verifyNGO,
  rejectNGO
} from '../endpoints/ngos';

const router = Router();

// Validation rules for NGO creation/update
const ngoValidation = [
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('NGO name must be 3-100 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('description').trim().isLength({ min: 50, max: 2000 }).withMessage('Description must be 50-2000 characters'),
  body('website').optional().isURL().withMessage('Valid URL required'),
  body('registrationNumber').optional().trim(),
  body('focus_areas').optional().isArray().withMessage('Focus areas must be an array'),
  validateRequest
];

// List NGOs - Public
router.get('/', dynamicRateLimit, listNGOs);

// Get single NGO - Public
router.get('/:id', dynamicRateLimit, getNGO);

// Create NGO - Authenticated
router.post('/', authenticate, dynamicRateLimit, ngoValidation, createNGO);

// Update NGO - Owner or Admin
router.patch('/:id', authenticate, dynamicRateLimit, updateNGO);

// Delete NGO - Owner or Admin
router.delete('/:id', authenticate, dynamicRateLimit, deleteNGO);

// Verify NGO - Admin only
router.post('/:id/verify', authenticate, requireAdmin, dynamicRateLimit, [
  body('notes').optional().trim(),
  validateRequest
], verifyNGO);

// Reject NGO - Admin only
router.post('/:id/reject', authenticate, requireAdmin, dynamicRateLimit, [
  body('reason').trim().notEmpty().withMessage('Rejection reason is required'),
  validateRequest
], rejectNGO);

export default router;
