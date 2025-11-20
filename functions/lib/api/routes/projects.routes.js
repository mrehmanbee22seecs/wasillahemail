"use strict";
/**
 * Projects Routes
 * Route definitions for project endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validator_1 = require("../middleware/validator");
const projects_1 = require("../endpoints/projects");
const router = (0, express_1.Router)();
// Public routes (with authentication)
router.get('/', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, validator_1.paginationValidation, projects_1.listProjects);
router.get('/:id', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, projects_1.getProjectById);
// Protected routes (require authentication)
router.post('/', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, validator_1.createProjectValidation, projects_1.createProject);
router.patch('/:id', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, validator_1.updateProjectValidation, projects_1.updateProject);
router.delete('/:id', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, projects_1.deleteProject);
// Admin-only routes
router.post('/:id/approve', auth_1.authenticate, auth_1.requireAdmin, rateLimiter_1.dynamicRateLimit, projects_1.approveProject);
router.post('/:id/reject', auth_1.authenticate, auth_1.requireAdmin, rateLimiter_1.dynamicRateLimit, projects_1.rejectProject);
exports.default = router;
//# sourceMappingURL=projects.routes.js.map