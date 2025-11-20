/**
 * Error Handler Middleware
 * Central error handling for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/responses';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'An unexpected error occurred';

  return errorResponse(res, code, message, statusCode, {
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  return errorResponse(
    res,
    'NOT_FOUND',
    `Route ${req.method} ${req.path} not found`,
    404
  );
};
