"use strict";
/**
 * Error Handler Middleware
 * Central error handling for API endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const responses_1 = require("../utils/responses");
const errorHandler = (error, req, res, next) => {
    console.error('API Error:', {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
    });
    const statusCode = error.statusCode || 500;
    const code = error.code || 'INTERNAL_ERROR';
    const message = error.message || 'An unexpected error occurred';
    return (0, responses_1.errorResponse)(res, code, message, statusCode, {
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    return (0, responses_1.errorResponse)(res, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`, 404);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map