/**
 * API Helper Utilities
 * Common utility functions for API operations
 */

import type { ApiError, PaginationParams, FilterParams } from '../types/api';

/**
 * Build query string from parameters
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Build URL with query parameters
 */
export function buildURL(baseURL: string, endpoint: string, params?: Record<string, any>): string {
  const cleanBase = baseURL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = `${cleanBase}/${cleanEndpoint}`;

  if (params && Object.keys(params).length > 0) {
    return url + buildQueryString(params);
  }

  return url;
}

/**
 * Parse API error from response
 */
export function parseApiError(error: any): ApiError {
  // Handle network errors
  if (error.message === 'Network Error') {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet connection.',
      statusCode: 0,
      timestamp: new Date(),
    };
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED') {
    return {
      code: 'TIMEOUT_ERROR',
      message: 'Request timeout. Please try again.',
      statusCode: 0,
      timestamp: new Date(),
    };
  }

  // Handle API error responses
  if (error.response) {
    const { data, status } = error.response;
    return {
      code: data?.code || `HTTP_${status}`,
      message: data?.message || error.message || 'An error occurred',
      details: data?.details,
      statusCode: status,
      timestamp: new Date(data?.timestamp || Date.now()),
    };
  }

  // Handle unknown errors
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    statusCode: 500,
    timestamp: new Date(),
  };
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      const apiError = parseApiError(error);
      if (apiError.statusCode >= 400 && apiError.statusCode < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (i === maxRetries - 1) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Format pagination parameters
 */
export function formatPaginationParams(params: PaginationParams): Record<string, any> {
  const formatted: Record<string, any> = {};

  if (params.page !== undefined) {
    formatted.page = Math.max(1, params.page);
  }

  if (params.perPage !== undefined) {
    formatted.perPage = Math.min(100, Math.max(1, params.perPage));
  }

  if (params.sortBy) {
    formatted.sortBy = params.sortBy;
  }

  if (params.sortOrder) {
    formatted.sortOrder = params.sortOrder;
  }

  return formatted;
}

/**
 * Format filter parameters
 */
export function formatFilterParams(params: FilterParams): Record<string, any> {
  const formatted: Record<string, any> = {};

  if (params.search) {
    formatted.search = params.search.trim();
  }

  if (params.status && params.status.length > 0) {
    formatted.status = params.status;
  }

  if (params.dateFrom) {
    formatted.dateFrom = params.dateFrom;
  }

  if (params.dateTo) {
    formatted.dateTo = params.dateTo;
  }

  if (params.tags && params.tags.length > 0) {
    formatted.tags = params.tags;
  }

  if (params.categories && params.categories.length > 0) {
    formatted.categories = params.categories;
  }

  return formatted;
}

/**
 * Validate required fields
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  requiredFields.forEach((field) => {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missing.push(String(field));
    }
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Sanitize input data
 */
export function sanitizeInput<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };

  Object.keys(sanitized).forEach((key) => {
    const value = sanitized[key];

    // Trim strings
    if (typeof value === 'string') {
      sanitized[key] = value.trim() as any;
    }

    // Remove empty strings, null, undefined
    if (value === '' || value === null || value === undefined) {
      delete sanitized[key];
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeInput(value) as any;
    }
  });

  return sanitized;
}

/**
 * Format date for API
 */
export function formatDateForAPI(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Parse date from API
 */
export function parseDateFromAPI(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Check if response is successful
 */
export function isSuccessResponse(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

/**
 * Get error message from response
 */
export function getErrorMessage(error: any): string {
  const apiError = parseApiError(error);
  return apiError.message;
}

/**
 * Calculate rate limit reset time
 */
export function calculateRateLimitReset(resetTimestamp: number): Date {
  return new Date(resetTimestamp * 1000);
}

/**
 * Check if rate limited
 */
export function isRateLimited(error: any): boolean {
  const apiError = parseApiError(error);
  return apiError.statusCode === 429;
}

/**
 * Get retry after duration from rate limit error
 */
export function getRetryAfter(error: any): number | null {
  if (error.response?.headers?.['retry-after']) {
    return parseInt(error.response.headers['retry-after'], 10);
  }
  return null;
}

/**
 * Create abort controller with timeout
 */
export function createAbortController(timeout: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

/**
 * Merge query parameters
 */
export function mergeParams(...params: Record<string, any>[]): Record<string, any> {
  return params.reduce((acc, curr) => ({ ...acc, ...curr }), {});
}

/**
 * Extract pagination meta from response
 */
export function extractPaginationMeta(data: any) {
  return {
    page: data.page || 1,
    perPage: data.perPage || 10,
    total: data.total || 0,
    totalPages: data.totalPages || 0,
    hasNext: data.hasNext || false,
    hasPrev: data.hasPrev || false,
  };
}

export default {
  buildQueryString,
  buildURL,
  parseApiError,
  retryWithBackoff,
  formatPaginationParams,
  formatFilterParams,
  validateRequiredFields,
  sanitizeInput,
  formatDateForAPI,
  parseDateFromAPI,
  isSuccessResponse,
  getErrorMessage,
  calculateRateLimitReset,
  isRateLimited,
  getRetryAfter,
  createAbortController,
  mergeParams,
  extractPaginationMeta,
};
