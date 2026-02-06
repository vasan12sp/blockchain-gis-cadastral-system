import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as zkController from '../controllers/zk.controller.js';

const router = express.Router();

router.get('/status', zkController.getZKStatus);
router.get('/diagnostics', asyncHandler(zkController.getDiagnostics));

router.post('/generate-commitment', asyncHandler(zkController.generateCommitment));
router.post('/generate-proof', verifyToken, asyncHandler(zkController.generateProof));
router.post('/verify-proof', asyncHandler(zkController.verifyProof));
router.post('/verify-ownership', verifyToken, asyncHandler(zkController.verifyOwnership));

router.post('/generate-shareable-proof', verifyToken, asyncHandler(zkController.generateShareableProof));
router.post('/verify-shareable-proof', asyncHandler(zkController.verifyShareableProof));

router.get('/my-proofs', verifyToken, asyncHandler(zkController.getMyProofs));

export default router;