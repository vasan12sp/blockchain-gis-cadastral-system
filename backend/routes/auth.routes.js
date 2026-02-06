import express from 'express';
import { authLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

// POST /api/auth/request-nonce - Request a nonce for wallet signature
router.post('/request-nonce', authLimiter, asyncHandler(authController.requestNonce));

// POST /api/auth/verify-signature - Verify wallet signature and get JWT token
router.post('/verify-signature', authLimiter, asyncHandler(authController.verifySignature));

export default router;