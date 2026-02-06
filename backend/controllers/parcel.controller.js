import pool from '../config/database.js';
import { landRegistryContract } from '../config/blockchain.js';
import { ethers } from 'ethers';
import * as ipfsService from '../services/ipfs.service.js';
import * as blockchainService from '../services/blockchain.service.js';
import { validateAddress, validateParcelId, validateGeoJSON } from '../utils/validation.js';
import logger from '../utils/logger.js';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';

export const getMyParcels = async (req, res) => {
    try {
        const ownerAddress = req.user.address;

        const result = await pool.query(
            `SELECT 
                parcel_id,
                owner_address,
                ipfs_cid_encrypted,
                commitment_hash,
                salt_encrypted,
                created_at
             FROM user_secrets
             WHERE owner_address = $1
             ORDER BY created_at DESC`,
            [ownerAddress]
        );

        res.json({
            success: true,
            parcels: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        logger.error('Failed to get user parcels:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch parcels',
            error: error.message
        });
    }
};

export const registerParcel = async (req, res) => {
    try {
        const { parcelId, ownerAddress, geojsonData, commitmentHash, encryptedCID, encryptedSalt } = req.body;

        // Validate inputs
        if (!parcelId || !ownerAddress || !geojsonData || !commitmentHash || !encryptedCID) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const validatedOwner = validateAddress(ownerAddress);

        // Check if parcel already exists
        const existing = await pool.query(
            'SELECT parcel_id FROM user_secrets WHERE parcel_id = $1',
            [parcelId]
        );

        if (existing.rows.length > 0) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: 'Parcel ID already exists'
            });
        }

        // Upload to IPFS
        logger.info('Uploading GeoJSON to IPFS...');
        const ipfsCID = await ipfsService.uploadJSON(geojsonData);
        logger.success(`GeoJSON uploaded to IPFS: ${ipfsCID}`);

        // Register on blockchain
        logger.info('Registering parcel on blockchain...');
        const tx = await landRegistryContract.registerParcel(
            parcelId,
            validatedOwner,
            ipfsCID,
            commitmentHash
        );
        await tx.wait();
        logger.success(`Blockchain registration completed: ${tx.hash}`);

        // Store in database
        await pool.query(
            `INSERT INTO user_secrets 
             (parcel_id, owner_address, ipfs_cid_encrypted, commitment_hash, salt_encrypted)
             VALUES ($1, $2, $3, $4, $5)`,
            [parcelId, validatedOwner, encryptedCID, commitmentHash, encryptedSalt]
        );

        logger.success(`Parcel ${parcelId} registered successfully`);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            parcel: {
                parcel_id: parcelId,
                owner_address: validatedOwner,
                ipfs_cid: ipfsCID,
                ipfs_cid_encrypted: encryptedCID,
                commitment_hash: commitmentHash,
                tx_hash: tx.hash
            },
            message: 'Parcel registered successfully'
        });

    } catch (error) {
        logger.error('Failed to register parcel:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to register parcel',
            error: error.message
        });
    }
};

export const getParcelDetails = async (req, res) => {
    try {
        const { parcelId } = req.params;

        const result = await pool.query(
            `SELECT 
                parcel_id,
                owner_address,
                ipfs_cid_encrypted,
                commitment_hash,
                created_at
             FROM user_secrets
             WHERE parcel_id = $1`,
            [parcelId]
        );

        if (result.rows.length === 0) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Parcel not found'
            });
        }

        res.json({
            success: true,
            parcel: result.rows[0]
        });

    } catch (error) {
        logger.error('Failed to get parcel details:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch parcel details',
            error: error.message
        });
    }
};

export const getParcelGeoJSON = async (req, res) => {
    try {
        const { parcelId } = req.params;
        const userAddress = req.user.address;

        // Get parcel from database
        const result = await pool.query(
            'SELECT owner_address, ipfs_cid_encrypted FROM user_secrets WHERE parcel_id = $1',
            [parcelId]
        );

        if (result.rows.length === 0) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Parcel not found'
            });
        }

        // Check ownership
        if (result.rows[0].owner_address.toLowerCase() !== userAddress.toLowerCase()) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You do not have permission to access this parcel data'
            });
        }

        res.json({
            success: true,
            ipfs_cid_encrypted: result.rows[0].ipfs_cid_encrypted,
            message: 'Use the encrypted CID to decrypt and fetch from IPFS'
        });

    } catch (error) {
        logger.error('Failed to get parcel GeoJSON:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch parcel GeoJSON',
            error: error.message
        });
    }
};

export default {
    getMyParcels,
    registerParcel,
    getParcelDetails,
    getParcelGeoJSON
};