/**
 * Request Validation Middleware
 * Validates request data using express-validator
 */

import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/responses';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      'Invalid request data',
      400,
      errors.array()
    );
  }

  next();
};

// Project validation rules
export const createProjectValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('startDate').isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
  validateRequest,
];

export const updateProjectValidation = [
  param('id').trim().notEmpty().withMessage('Project ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 }),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 5000 }),
  validateRequest,
];

// Event validation rules
export const createEventValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),
  body('eventType').trim().notEmpty().withMessage('Event type is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('startTime').isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
  body('endTime').isISO8601().withMessage('End time must be a valid ISO 8601 date'),
  validateRequest,
];

export const updateEventValidation = [
  param('id').trim().notEmpty().withMessage('Event ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 }),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 5000 }),
  validateRequest,
];

// NGO validation rules
export const createNgoValidation = [
  body('organizationName')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Organization name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),
  body('registrationNumber')
    .trim()
    .notEmpty()
    .withMessage('Registration number is required'),
  body('contactInfo.email')
    .isEmail()
    .withMessage('Valid email is required'),
  validateRequest,
];

// Pagination validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('perPage')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Per page must be between 1 and 100'),
  validateRequest,
];
