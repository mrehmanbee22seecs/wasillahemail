import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { dynamicRateLimit } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validator';
import {
  listWebhooks,
  getWebhook,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getDeliveries,
  testWebhookEndpoint,
  retryDelivery,
} from '../endpoints/webhooks';

const router = Router();

// Validation for webhook creation
const webhookValidation = [
  body('url').isURL().withMessage('Valid URL is required'),
  body('events').isArray({ min: 1 }).withMessage('At least one event is required'),
  body('description').optional().trim(),
  validateRequest,
];

// List webhooks - Authenticated
router.get('/', authenticate, dynamicRateLimit, listWebhooks);

// Get single webhook - Authenticated
router.get('/:id', authenticate, dynamicRateLimit, getWebhook);

// Create webhook - Authenticated
router.post('/', authenticate, dynamicRateLimit, webhookValidation, createWebhook);

// Update webhook - Authenticated
// Validation for webhook update
const webhookUpdateValidation = [
  body('url').optional().isURL().withMessage('Valid URL is required'),
  body('events').optional().isArray({ min: 1 }).withMessage('At least one event is required'),
  body('description').optional().trim(),
  validateRequest,
];

// ...

router.patch('/:id', authenticate, dynamicRateLimit, webhookUpdateValidation, updateWebhook);

// Delete webhook - Authenticated
router.delete('/:id', authenticate, dynamicRateLimit, deleteWebhook);

// Get webhook deliveries - Authenticated
router.get('/:id/deliveries', authenticate, dynamicRateLimit, getDeliveries);

// Test webhook - Authenticated
router.post('/:id/test', authenticate, dynamicRateLimit, testWebhookEndpoint);

// Retry webhook delivery - Authenticated
router.post('/:id/deliveries/:deliveryId/retry', authenticate, dynamicRateLimit, retryDelivery);

export default router;
