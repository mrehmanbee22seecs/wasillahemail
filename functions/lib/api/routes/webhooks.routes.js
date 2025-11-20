"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validator_1 = require("../middleware/validator");
const webhooks_1 = require("../endpoints/webhooks");
const router = (0, express_1.Router)();
// Validation for webhook creation
const webhookValidation = [
    (0, express_validator_1.body)('url').isURL().withMessage('Valid URL is required'),
    (0, express_validator_1.body)('events').isArray({ min: 1 }).withMessage('At least one event is required'),
    (0, express_validator_1.body)('description').optional().trim(),
    validator_1.validate,
];
// List webhooks - Authenticated
router.get('/', auth_1.authenticateUser, rateLimiter_1.rateLimiter, webhooks_1.listWebhooks);
// Get single webhook - Authenticated
router.get('/:id', auth_1.authenticateUser, rateLimiter_1.rateLimiter, webhooks_1.getWebhook);
// Create webhook - Authenticated
router.post('/', auth_1.authenticateUser, rateLimiter_1.rateLimiter, webhookValidation, webhooks_1.createWebhook);
// Update webhook - Authenticated
router.patch('/:id', auth_1.authenticateUser, rateLimiter_1.rateLimiter, webhooks_1.updateWebhook);
// Delete webhook - Authenticated
router.delete('/:id', auth_1.authenticateUser, rateLimiter_1.rateLimiter, webhooks_1.deleteWebhook);
// Get webhook deliveries - Authenticated
router.get('/:id/deliveries', auth_1.authenticateUser, rateLimiter_1.rateLimiter, webhooks_1.getDeliveries);
// Test webhook - Authenticated
router.post('/:id/test', auth_1.authenticateUser, rateLimiter_1.rateLimiter, webhooks_1.testWebhookEndpoint);
// Retry webhook delivery - Authenticated
router.post('/:id/deliveries/:deliveryId/retry', auth_1.authenticateUser, rateLimiter_1.rateLimiter, webhooks_1.retryDelivery);
exports.default = router;
//# sourceMappingURL=webhooks.routes.js.map