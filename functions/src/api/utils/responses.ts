/**
 * API Response Utilities
 * Standard response formatters for API endpoints
 */

import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
    statusCode: number;
  };
  meta?: {
    timestamp: Date;
    [key: string]: any;
  };
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
    meta: {
      timestamp: new Date(),
    },
  });
};

export const errorResponse = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): Response => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      statusCode,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date(),
    },
  });
};

export const paginatedResponse = <T>(
  res: Response,
  items: T[],
  pagination: {
    page: number;
    perPage: number;
    total?: number;
    totalPages?: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
): Response => {
  return res.status(200).json({
    success: true,
    data: {
      items,
      pagination,
    },
    meta: {
      timestamp: new Date(),
    },
  });
};
