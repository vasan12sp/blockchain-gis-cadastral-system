import express from 'express';
import { verifyToken, isAuthority } from '../middleware/auth.js';
import { ipfsLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as parcelController from '../controllers/parcel.controller.js';

const router = express.Router();

router.get('/my-parcels', verifyToken, asyncHandler(parcelController.getMyParcels));
router.post('/register', verifyToken, isAuthority, asyncHandler(parcelController.registerParcel));
router.get('/:parcelId/details', verifyToken, asyncHandler(parcelController.getParcelDetails));
router.get('/:parcelId/geojson', verifyToken, ipfsLimiter, asyncHandler(parcelController.getParcelGeoJSON));

// Debug endpoints
router.get('/blockchain/:parcelId', asyncHandler(parcelController.getBlockchainParcel));
router.get('/debug/:parcelId', asyncHandler(parcelController.debugParcel));
router.get('/debug/verification/:parcelId', verifyToken, asyncHandler(parcelController.debugVerification));

export default router;