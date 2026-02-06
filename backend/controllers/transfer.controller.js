import pool from '../config/database.js';
import { landRegistryContract } from '../config/blockchain.js';
import { ethers } from 'ethers';
import logger from '../utils/logger.js';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';
import { validateAddress, validateParcelId } from '../utils/validation.js';

export const getPendingTransfers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                tr.request_id,
                tr.parcel_id,
                tr.from_address,
                tr.to_address,
                tr.reason,
                tr.status,
                tr.created_at,
                tr.approved_at,
                tr.rejected_at,
                tr.authority_address,
                tr.notes,
                p.ipfs_cid_encrypted,
                p.commitment_hash
             FROM transfer_requests tr
             LEFT JOIN parcels p ON tr.parcel_id = p.parcel_id
             WHERE tr.status = 'pending'
             ORDER BY tr.created_at DESC`
        );

        res.json({
            success: true,
            transfers: result.rows.map(row => ({
                transfer_id: row.request_id,
                parcel_id: row.parcel_id,
                from_address: row.from_address,
                to_address: row.to_address,
                reason: row.reason,
                status: row.status,
                requested_at: row.created_at,
                approved_at: row.approved_at,
                rejected_at: row.rejected_at,
                authority_address: row.authority_address,
                notes: row.notes
            })),
            count: result.rows.length
        });

    } catch (error) {
        logger.error('Failed to get pending transfers:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to fetch pending transfers',
            error: error.message
        });
    }
};

export const requestTransfer = async (req, res) => {
    try {
        const { parcelId, toAddress, reason } = req.body;
        const fromAddress = req.user.address;

        // Validate inputs
        if (!validateParcelId(parcelId)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid parcel ID'
            });
        }

        const validatedToAddress = validateAddress(toAddress);

        // Check if parcel exists and belongs to user
        const parcelResult = await pool.query(
            'SELECT owner_address FROM parcels WHERE parcel_id = $1',
            [parcelId]
        );

        if (parcelResult.rows.length === 0) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Parcel not found'
            });
        }

        if (parcelResult.rows[0].owner_address.toLowerCase() !== fromAddress.toLowerCase()) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You do not own this parcel'
            });
        }

        // Check if there's already a pending transfer for this parcel
        const existingTransfer = await pool.query(
            'SELECT request_id FROM transfer_requests WHERE parcel_id = $1 AND status = $2',
            [parcelId, 'pending']
        );

        if (existingTransfer.rows.length > 0) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: 'There is already a pending transfer for this parcel'
            });
        }

        // Create transfer request
        const result = await pool.query(
            `INSERT INTO transfer_requests (parcel_id, from_address, to_address, reason, status)
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING request_id, parcel_id, from_address, to_address, reason, status, created_at`,
            [parcelId, fromAddress, validatedToAddress, reason || 'Transfer request']
        );

        logger.info(`Transfer requested: Parcel ${parcelId} from ${fromAddress} to ${validatedToAddress}`);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            transfer: {
                transfer_id: result.rows[0].request_id,
                parcel_id: result.rows[0].parcel_id,
                from_address: result.rows[0].from_address,
                to_address: result.rows[0].to_address,
                reason: result.rows[0].reason,
                status: result.rows[0].status,
                requested_at: result.rows[0].created_at
            },
            message: 'Transfer request submitted successfully'
        });

    } catch (error) {
        logger.error('Failed to request transfer:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to request transfer',
            error: error.message
        });
    }
};

export const approveTransfer = async (req, res) => {
    try {
        const { transferId, notes } = req.body;
        const authorityAddress = req.user.address;

        if (!transferId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Transfer ID is required'
            });
        }

        // Get transfer details
        const transferResult = await pool.query(
            'SELECT * FROM transfer_requests WHERE request_id = $1',
            [transferId]
        );

        if (transferResult.rows.length === 0) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Transfer request not found'
            });
        }

        const transfer = transferResult.rows[0];

        if (transfer.status !== 'pending') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: `Transfer is already ${transfer.status}`
            });
        }

        // Execute blockchain transfer
        logger.info(`Executing blockchain transfer for parcel ${transfer.parcel_id}...`);
        
        try {
            const tx = await landRegistryContract.transferOwnership(
                transfer.parcel_id,
                transfer.to_address
            );

            await tx.wait();
            logger.success(`Blockchain transfer completed: ${tx.hash}`);

            // Update transfer_requests table
            await pool.query(
                `UPDATE transfer_requests 
                 SET status = 'approved', 
                     approved_at = NOW(), 
                     authority_address = $1,
                     notes = $2
                 WHERE request_id = $3`,
                [authorityAddress, notes || 'Transfer approved', transferId]
            );

            // Update parcels table
            await pool.query(
                'UPDATE parcels SET owner_address = $1 WHERE parcel_id = $2',
                [transfer.to_address, transfer.parcel_id]
            );

            logger.success(`Transfer approved: ${transferId}`);

            res.json({
                success: true,
                transfer: {
                    transfer_id: transferId,
                    parcel_id: transfer.parcel_id,
                    from_address: transfer.from_address,
                    to_address: transfer.to_address,
                    status: 'approved',
                    txHash: tx.hash,
                    authority_address: authorityAddress,
                    approved_at: new Date().toISOString()
                },
                message: 'Transfer approved successfully'
            });

        } catch (blockchainError) {
            logger.error('Blockchain transfer failed:', blockchainError);

            // Update status to rejected/failed
            await pool.query(
                `UPDATE transfer_requests 
                 SET status = 'rejected', 
                     rejected_at = NOW(), 
                     authority_address = $1,
                     notes = $2
                 WHERE request_id = $3`,
                [authorityAddress, `Blockchain error: ${blockchainError.message}`, transferId]
            );

            throw blockchainError;
        }

    } catch (error) {
        logger.error('Failed to approve transfer:', error);

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to approve transfer',
            error: error.message
        });
    }
};

export const rejectTransfer = async (req, res) => {
    try {
        const { transferId, notes } = req.body;
        const authorityAddress = req.user.address;

        if (!transferId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Transfer ID is required'
            });
        }

        // Get transfer details
        const transferResult = await pool.query(
            'SELECT * FROM transfer_requests WHERE request_id = $1',
            [transferId]
        );

        if (transferResult.rows.length === 0) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Transfer request not found'
            });
        }

        const transfer = transferResult.rows[0];

        if (transfer.status !== 'pending') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: `Transfer is already ${transfer.status}`
            });
        }

        // Update transfer_requests table
        await pool.query(
            `UPDATE transfer_requests 
             SET status = 'rejected', 
                 rejected_at = NOW(), 
                 authority_address = $1,
                 notes = $2
             WHERE request_id = $3`,
            [authorityAddress, notes || 'Transfer rejected', transferId]
        );

        logger.info(`Transfer rejected: ${transferId}`);

        res.json({
            success: true,
            transfer: {
                transfer_id: transferId,
                parcel_id: transfer.parcel_id,
                status: 'rejected',
                authority_address: authorityAddress,
                rejected_at: new Date().toISOString()
            },
            message: 'Transfer rejected'
        });

    } catch (error) {
        logger.error('Failed to reject transfer:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to reject transfer',
            error: error.message
        });
    }
};

export default {
    getPendingTransfers,
    requestTransfer,
    approveTransfer,
    rejectTransfer
};