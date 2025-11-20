/**
 * API Helper Functions
 * Common utility functions for API operations
 */

import { API_CONFIG } from '../config/api.config';

export const getPaginationParams = (query: any) => {
  const page = Math.max(1, parseInt(query.page, 10) || API_CONFIG.pagination.defaultPage);
  const perPage = Math.min(
    API_CONFIG.pagination.maxPerPage,
    Math.max(1, parseInt(query.perPage, 10) || API_CONFIG.pagination.defaultPerPage)
  );

  return { page, perPage };
};

export const calculatePagination = (
  page: number,
  perPage: number,
  total?: number
) => {
  const totalPages = total ? Math.ceil(total / perPage) : undefined;
  const hasNext = total ? page < totalPages! : false;
  const hasPrev = page > 1;

  return {
    page,
    perPage,
    ...(total !== undefined && { total, totalPages }),
    hasNext,
    hasPrev,
  };
};

export const sanitizeQuery = (query: any): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  Object.keys(query).forEach((key) => {
    const value = query[key];
    if (value !== undefined && value !== null && value !== '') {
      sanitized[key] = value;
    }
  });

  return sanitized;
};
