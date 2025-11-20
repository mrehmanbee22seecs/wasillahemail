"use strict";
/**
 * API Response Utilities
 * Standard response formatters for API endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedResponse = exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, data, message, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        ...(message && { message }),
        meta: {
            timestamp: new Date(),
        },
    });
};
exports.successResponse = successResponse;
const errorResponse = (res, code, message, statusCode = 500, details) => {
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
exports.errorResponse = errorResponse;
const paginatedResponse = (res, items, pagination) => {
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
exports.paginatedResponse = paginatedResponse;
//# sourceMappingURL=responses.js.map