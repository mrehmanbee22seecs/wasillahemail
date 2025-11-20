"use strict";
/**
 * Analytics Routes
 * Route definitions for analytics endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const analytics_1 = require("../endpoints/analytics");
const router = (0, express_1.Router)();
// All analytics routes require authentication and admin role
router.use(auth_1.authenticate);
router.use(auth_1.requireAdmin);
router.use(rateLimiter_1.adminRateLimit);
router.get('/platform', analytics_1.getPlatformAnalytics);
router.get('/projects', analytics_1.getProjectAnalytics);
router.get('/events', analytics_1.getEventAnalytics);
router.get('/users', analytics_1.getUserAnalytics);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map