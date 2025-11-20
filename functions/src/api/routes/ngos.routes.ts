import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateUser, requireAdmin } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validator';
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
  validate
];

// List NGOs - Public
router.get('/', rateLimiter, listNGOs);

// Get single NGO - Public
router.get('/:id', rateLimiter, getNGO);

// Create NGO - Authenticated
router.post('/', authenticateUser, rateLimiter, ngoValidation, createNGO);

// Update NGO - Owner or Admin
router.patch('/:id', authenticateUser, rateLimiter, updateNGO);

// Delete NGO - Owner or Admin
router.delete('/:id', authenticateUser, rateLimiter, deleteNGO);

// Verify NGO - Admin only
router.post('/:id/verify', authenticateUser, requireAdmin, rateLimiter, [
  body('notes').optional().trim(),
  validate
], verifyNGO);

// Reject NGO - Admin only
router.post('/:id/reject', authenticateUser, requireAdmin, rateLimiter, [
  body('reason').trim().notEmpty().withMessage('Rejection reason is required'),
  validate
], rejectNGO);

export default router;
