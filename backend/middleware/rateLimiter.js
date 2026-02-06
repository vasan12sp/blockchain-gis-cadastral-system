import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../config/constants.js';

export const generalLimiter = rateLimit({
    windowMs: RATE_LIMITS.GENERAL.windowMs,
    max: RATE_LIMITS.GENERAL.max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const ipfsLimiter = rateLimit({
    windowMs: RATE_LIMITS.IPFS.windowMs,
    max: RATE_LIMITS.IPFS.max,
    message: 'Too many IPFS requests, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: RATE_LIMITS.AUTH.windowMs,
    max: RATE_LIMITS.AUTH.max,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

export default {
    generalLimiter,
    ipfsLimiter,
    authLimiter
};