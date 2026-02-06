import express from 'express';
import { verifyToken, isAuthority } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

// POST /api/users - Create new user (NO AUTH REQUIRED for registration)
router.post('/', asyncHandler(userController.createUser));

// GET /api/users/:address - Get user by address (NO AUTH REQUIRED to check if user exists)
router.get('/:address', asyncHandler(userController.getUserByAddress));

// GET /api/users/profile - Get current user profile (AUTH REQUIRED)
router.get('/profile', verifyToken, asyncHandler(userController.getUserProfile));

// GET /api/users - Get all users (AUTH + AUTHORITY REQUIRED)
// Note: This conflicts with GET /:address, so we need to be careful with ordering
// router.get('/', verifyToken, isAuthority, asyncHandler(userController.getAllUsers));

export default router;