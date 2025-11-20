"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validator_1 = require("../middleware/validator");
const ngos_1 = require("../endpoints/ngos");
const router = (0, express_1.Router)();
// Validation rules for NGO creation/update
const ngoValidation = [
    (0, express_validator_1.body)('name').trim().isLength({ min: 3, max: 100 }).withMessage('NGO name must be 3-100 characters'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
    (0, express_validator_1.body)('location').trim().notEmpty().withMessage('Location is required'),
    (0, express_validator_1.body)('description').trim().isLength({ min: 50, max: 2000 }).withMessage('Description must be 50-2000 characters'),
    (0, express_validator_1.body)('website').optional().isURL().withMessage('Valid URL required'),
    (0, express_validator_1.body)('registrationNumber').optional().trim(),
    (0, express_validator_1.body)('focus_areas').optional().isArray().withMessage('Focus areas must be an array'),
    validator_1.validate
];
// List NGOs - Public
router.get('/', rateLimiter_1.rateLimiter, ngos_1.listNGOs);
// Get single NGO - Public
router.get('/:id', rateLimiter_1.rateLimiter, ngos_1.getNGO);
// Create NGO - Authenticated
router.post('/', auth_1.authenticateUser, rateLimiter_1.rateLimiter, ngoValidation, ngos_1.createNGO);
// Update NGO - Owner or Admin
router.patch('/:id', auth_1.authenticateUser, rateLimiter_1.rateLimiter, ngos_1.updateNGO);
// Delete NGO - Owner or Admin
router.delete('/:id', auth_1.authenticateUser, rateLimiter_1.rateLimiter, ngos_1.deleteNGO);
// Verify NGO - Admin only
router.post('/:id/verify', auth_1.authenticateUser, auth_1.requireAdmin, rateLimiter_1.rateLimiter, [
    (0, express_validator_1.body)('notes').optional().trim(),
    validator_1.validate
], ngos_1.verifyNGO);
// Reject NGO - Admin only
router.post('/:id/reject', auth_1.authenticateUser, auth_1.requireAdmin, rateLimiter_1.rateLimiter, [
    (0, express_validator_1.body)('reason').trim().notEmpty().withMessage('Rejection reason is required'),
    validator_1.validate
], ngos_1.rejectNGO);
exports.default = router;
//# sourceMappingURL=ngos.routes.js.map