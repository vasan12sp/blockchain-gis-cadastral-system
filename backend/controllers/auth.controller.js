import pool from '../config/database.js';
import { landRegistryContract } from '../config/blockchain.js';
import { ethers } from 'ethers';
import * as ipfsService from '../services/ipfs.service.js';
import * as blockchainService from '../services/blockchain.service.js';
import { zkSystem } from '../services/zk.service.js';
import { validateAddress, validateParcelId, validateGeoJSON } from '../utils/validation.js';
import logger from '../utils/logger.js';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';


import jwt from 'jsonwebtoken';

import { config } from '../config/environment.js';



export const requestNonce = async (req, res) => {
    try {
        const { address } = req.body;
        
        if (!address) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                message: 'Wallet address is required' 
            });
        }

        const validatedAddress = validateAddress(address);
        const nonce = Math.floor(Math.random() * 1000000).toString();

        // Upsert user with new nonce
        await pool.query(
            `INSERT INTO users (wallet_address, nonce)

VALUES ($1, $2)

ON CONFLICT (wallet_address)

DO UPDATE SET nonce = $2`,
            [validatedAddress, nonce]
        );

        logger.info(`Nonce generated for address: ${validatedAddress}`);

        res.json({ 
            success: true,
            nonce,
            message: `Please sign this nonce: ${nonce}` 
        });

    } catch (error) {
        logger.error('Failed to generate nonce:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
            message: 'Failed to generate nonce',
            error: error.message 
        });
    }
};

export const verifySignature = async (req, res) => {
    try {
        const { address, signature } = req.body;

        if (!address || !signature) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                success: false,
                message: 'Address and signature are required' 
            });
        }

        const validatedAddress = validateAddress(address);

        // Get user's nonce from database
        const result = await pool.query(
            'SELECT nonce, name, email, is_authority FROM users WHERE wallet_address = $1',
            [validatedAddress]
        );

        if (result.rows.length === 0) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({ 
                success: false,
                message: 'Address not found. Please request a nonce first.',
                code: ERROR_CODES.USER_NOT_FOUND
            });
        }

        const { nonce, name, email, is_authority } = result.rows[0];
        const message = `Please sign this nonce: ${nonce}`;

        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== validatedAddress) {
            logger.warn(`Signature verification failed for ${validatedAddress}`);
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                success: false,
                message: 'Invalid signature',
                code: ERROR_CODES.TOKEN_INVALID
            });
        }

        // Generate new nonce for next login
        const newNonce = Math.floor(Math.random() * 1000000).toString();
        await pool.query(
            'UPDATE users SET nonce = $1 WHERE wallet_address = $2',
            [newNonce, validatedAddress]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                address: validatedAddress,
                isAuthority: is_authority,
                issued: Date.now()
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        logger.success(`User authenticated: ${validatedAddress}`);

        res.json({
            success: true,
            token,
            user: {
                address: validatedAddress,
                name: name,
                email: email,
                is_authority: is_authority
            },
            message: 'Authentication successful'
        });

    } catch (error) {
        logger.error('Signature verification failed:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
            success: false,
            message: 'Authentication failed',
            error: error.message 
        });
    }
};

export default { requestNonce, verifySignature };