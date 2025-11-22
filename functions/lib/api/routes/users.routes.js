"use strict";
/**
 * Users Routes
 * Route definitions for user endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validator_1 = require("../middleware/validator");
const users_1 = require("../endpoints/users");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, auth_1.requireAdmin, rateLimiter_1.dynamicRateLimit, validator_1.paginationValidation, users_1.listUsers);
router.get('/me', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, users_1.getCurrentUser);
router.get('/:id', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, users_1.getUserById);
router.patch('/:id', auth_1.authenticate, rateLimiter_1.dynamicRateLimit, users_1.updateUser);
router.delete('/:id', auth_1.authenticate, auth_1.requireAdmin, rateLimiter_1.dynamicRateLimit, users_1.deleteUser);
exports.default = router;
//# sourceMappingURL=users.routes.js.map