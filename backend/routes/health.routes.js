import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as healthController from '../controllers/health.controller.js';

const router = express.Router();

router.get('/', healthController.healthCheck);
router.get('/blockchain', asyncHandler(healthController.blockchainHealth));

export default router;