import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import logger from '../utils/logger.js';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';

export const verifyToken = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'No authorization token provided',
                code: ERROR_CODES.TOKEN_MISSING
            });
        }

        // Extract token (format: "Bearer <token>")
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : authHeader;

        if (!token) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid token format',
                code: ERROR_CODES.TOKEN_INVALID
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Attach user info to request
        req.user = {
            address: decoded.address,
            isAuthority: decoded.isAuthority
        };

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Token expired',
                code: ERROR_CODES.TOKEN_EXPIRED
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid token',
                code: ERROR_CODES.TOKEN_INVALID
            });
        }

        logger.error('Token verification error:', error);
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Authentication failed',
            code: ERROR_CODES.TOKEN_INVALID
        });
    }
};

export const isAuthority = (req, res, next) => {
    if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Authentication required',
            code: ERROR_CODES.TOKEN_MISSING
        });
    }

    if (!req.user.isAuthority) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'Authority access required',
            code: ERROR_CODES.INSUFFICIENT_PERMISSIONS
        });
    }

    next();
};

export default { verifyToken, isAuthority };