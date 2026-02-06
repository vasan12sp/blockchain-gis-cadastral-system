import express from 'express';
import { verifyToken, isAuthority } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as transferController from '../controllers/transfer.controller.js';

const router = express.Router();

// GET /api/transfers/pending - Get pending transfers (authority only)
router.get('/pending', verifyToken, isAuthority, asyncHandler(transferController.getPendingTransfers));

// POST /api/transfers/request - Request a transfer
router.post('/request', verifyToken, asyncHandler(transferController.requestTransfer));

// POST /api/transfers/approve - Approve a transfer (authority only)
router.post('/approve', verifyToken, isAuthority, asyncHandler(transferController.approveTransfer));

// POST /api/transfers/reject - Reject a transfer (authority only)
router.post('/reject', verifyToken, isAuthority, asyncHandler(transferController.rejectTransfer));

export default router;