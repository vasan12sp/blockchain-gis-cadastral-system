import { HTTP_STATUS } from '../config/constants.js';
import { config } from '../config/environment.js';

export const errorHandler = (err, req, res, next) => {
    console.error('❌ Error caught by error handler:');
    console.error('  Message:', err.message);
    console.error('  Stack:', err.stack);
    console.error('  Path:', req.path);
    console.error('  Method:', req.method);
    
    // Default error response
    const errorResponse = {
        success: false,
        message: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        path: req.path,
        timestamp: new Date().toISOString()
    };
    
    // Include stack trace in development
    if (config.nodeEnv === 'development') {
        errorResponse.stack = err.stack;
    }
    
    // Determine status code
    let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        errorResponse.code = 'VALIDATION_ERROR';
    } else if (err.name === 'UnauthorizedError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        errorResponse.code = 'UNAUTHORIZED';
    } else if (err.code === '23505') { // PostgreSQL unique violation
        statusCode = HTTP_STATUS.CONFLICT;
        errorResponse.code = 'DUPLICATE_ENTRY';
        errorResponse.message = 'Resource already exists';
    } else if (err.code === '23503') { // PostgreSQL foreign key violation
        statusCode = HTTP_STATUS.BAD_REQUEST;
        errorResponse.code = 'INVALID_REFERENCE';
        errorResponse.message = 'Referenced resource does not exist';
    }
    
    res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Route not found',
        code: 'ROUTE_NOT_FOUND',
        path: req.path,
        method: req.method
    });
};

export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default {
    errorHandler,
    notFoundHandler,
    asyncHandler
};