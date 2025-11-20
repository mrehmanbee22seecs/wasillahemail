"use strict";
/**
 * API Helper Functions
 * Common utility functions for API operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeQuery = exports.calculatePagination = exports.getPaginationParams = void 0;
const api_config_1 = require("../config/api.config");
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || api_config_1.API_CONFIG.pagination.defaultPage);
    const perPage = Math.min(api_config_1.API_CONFIG.pagination.maxPerPage, Math.max(1, parseInt(query.perPage, 10) || api_config_1.API_CONFIG.pagination.defaultPerPage));
    return { page, perPage };
};
exports.getPaginationParams = getPaginationParams;
const calculatePagination = (page, perPage, total) => {
    const totalPages = total ? Math.ceil(total / perPage) : undefined;
    const hasNext = total ? page < totalPages : false;
    const hasPrev = page > 1;
    return {
        page,
        perPage,
        ...(total !== undefined && { total, totalPages }),
        hasNext,
        hasPrev,
    };
};
exports.calculatePagination = calculatePagination;
const sanitizeQuery = (query) => {
    const sanitized = {};
    Object.keys(query).forEach((key) => {
        const value = query[key];
        if (value !== undefined && value !== null && value !== '') {
            sanitized[key] = value;
        }
    });
    return sanitized;
};
exports.sanitizeQuery = sanitizeQuery;
//# sourceMappingURL=apiHelpers.js.map