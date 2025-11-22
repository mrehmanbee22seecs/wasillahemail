"use strict";
/**
 * Events Routes
 * Route definitions for event endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validator_1 = require("../middleware/validator");
const events_1 = require("../endpoints/events");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, validator_1.paginationValidation, events_1.listEvents);
router.get('/:id', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, events_1.getEventById);
router.post('/', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, validator_1.createEventValidation, events_1.createEvent);
router.patch('/:id', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, validator_1.updateEventValidation, events_1.updateEvent);
router.delete('/:id', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, events_1.deleteEvent);
router.post('/:id/approve', auth_1.authenticate, auth_1.requireAdmin, rateLimiter_1.dynamicRateLimit, events_1.approveEvent);
router.post('/:id/reject', auth_1.authenticate, auth_1.requireAdmin, rateLimiter_1.dynamicRateLimit, events_1.rejectEvent);
exports.default = router;
//# sourceMappingURL=events.routes.js.map