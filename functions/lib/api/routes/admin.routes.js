"use strict";
/**
 * Admin Routes
 * Route definitions for admin endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const admin_1 = require("../endpoints/admin");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin role
router.use(auth_1.authenticate);
router.use(auth_1.requireAdmin);
router.use(rateLimiter_1.adminRateLimit);
router.get('/stats', admin_1.getPlatformStats);
router.get('/health', admin_1.getSystemHealth);
router.get('/moderation', admin_1.getModerationQueue);
router.post('/bulk', admin_1.bulkOperation);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map