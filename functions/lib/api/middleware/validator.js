"use strict";
/**
 * Request Validation Middleware
 * Validates request data using express-validator
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationValidation = exports.createNgoValidation = exports.updateEventValidation = exports.createEventValidation = exports.updateProjectValidation = exports.createProjectValidation = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const responses_1 = require("../utils/responses");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return (0, responses_1.errorResponse)(res, 'VALIDATION_ERROR', 'Invalid request data', 400, errors.array());
    }
    next();
};
exports.validateRequest = validateRequest;
// Project validation rules
exports.createProjectValidation = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 20, max: 5000 })
        .withMessage('Description must be between 20 and 5000 characters'),
    (0, express_validator_1.body)('category').trim().notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('location').trim().notEmpty().withMessage('Location is required'),
    (0, express_validator_1.body)('startDate').isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    exports.validateRequest,
];
exports.updateProjectValidation = [
    (0, express_validator_1.param)('id').trim().notEmpty().withMessage('Project ID is required'),
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 100 }),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ min: 20, max: 5000 }),
    exports.validateRequest,
];
// Event validation rules
exports.createEventValidation = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 20, max: 5000 })
        .withMessage('Description must be between 20 and 5000 characters'),
    (0, express_validator_1.body)('eventType').trim().notEmpty().withMessage('Event type is required'),
    (0, express_validator_1.body)('location').trim().notEmpty().withMessage('Location is required'),
    (0, express_validator_1.body)('startTime').isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
    (0, express_validator_1.body)('endTime').isISO8601().withMessage('End time must be a valid ISO 8601 date'),
    exports.validateRequest,
];
exports.updateEventValidation = [
    (0, express_validator_1.param)('id').trim().notEmpty().withMessage('Event ID is required'),
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 100 }),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ min: 20, max: 5000 }),
    exports.validateRequest,
];
// NGO validation rules
exports.createNgoValidation = [
    (0, express_validator_1.body)('organizationName')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Organization name must be between 3 and 100 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 20, max: 5000 })
        .withMessage('Description must be between 20 and 5000 characters'),
    (0, express_validator_1.body)('registrationNumber')
        .trim()
        .notEmpty()
        .withMessage('Registration number is required'),
    (0, express_validator_1.body)('contactInfo.email')
        .isEmail()
        .withMessage('Valid email is required'),
    exports.validateRequest,
];
// Pagination validation
exports.paginationValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('perPage')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Per page must be between 1 and 100'),
    exports.validateRequest,
];
//# sourceMappingURL=validator.js.map