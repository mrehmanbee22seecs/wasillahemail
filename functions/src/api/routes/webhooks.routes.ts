import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateUser } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validator';
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
  validate,
];

// List webhooks - Authenticated
router.get('/', authenticateUser, rateLimiter, listWebhooks);

// Get single webhook - Authenticated
router.get('/:id', authenticateUser, rateLimiter, getWebhook);

// Create webhook - Authenticated
router.post('/', authenticateUser, rateLimiter, webhookValidation, createWebhook);

// Update webhook - Authenticated
router.patch('/:id', authenticateUser, rateLimiter, updateWebhook);

// Delete webhook - Authenticated
router.delete('/:id', authenticateUser, rateLimiter, deleteWebhook);

// Get webhook deliveries - Authenticated
router.get('/:id/deliveries', authenticateUser, rateLimiter, getDeliveries);

// Test webhook - Authenticated
router.post('/:id/test', authenticateUser, rateLimiter, testWebhookEndpoint);

// Retry webhook delivery - Authenticated
router.post('/:id/deliveries/:deliveryId/retry', authenticateUser, rateLimiter, retryDelivery);

export default router;
