import pool from '../config/database.js';
import { validateAddress } from '../utils/validation.js';
import logger from '../utils/logger.js';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';

export const createUser = async (req, res) => {
    try {
        const { 
            wallet_address, 
            name, 
            email, 
            mobile_number, 
            aadhar_number, 
            physical_address 
        } = req.body;

        // Validate required fields
        if (!wallet_address || !name) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Wallet address and name are required'
            });
        }

        const validatedAddress = validateAddress(wallet_address);

        // Check if user already exists
        const existing = await pool.query(
            'SELECT wallet_address FROM users WHERE wallet_address = $1',
            [validatedAddress]
        );

        if (existing.rows.length > 0) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Insert new user with nonce
        const nonce = Math.floor(Math.random() * 1000000).toString();
        
        const result = await pool.query(
            `INSERT INTO users 
             (wallet_address, name, email, mobile_number, aadhar_number, physical_address, nonce)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING wallet_address, name, email, is_authority, created_at`,
            [validatedAddress, name, email, mobile_number, aadhar_number, physical_address, nonce]
        );

        logger.success(`New user registered: ${validatedAddress}`);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            user: result.rows[0],
            message: 'User registered successfully'
        });

    } catch (error) {
        logger.error('User registration failed:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to register user',
            error: error.message
        });
    }
};

export const getUserByAddress = async (req, res) => {
    try {
        const { address } = req.params;
        const validatedAddress = validateAddress(address);

        const result = await pool.query(
            'SELECT wallet_address, name, email, is_authority, created_at FROM users WHERE wallet_address = $1',
            [validatedAddress]
        );

        if (result.rows.length === 0) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            ...result.rows[0]
        });

    } catch (error) {
        logger.error('Failed to get user:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const { address } = req.user; // From JWT token

        const result = await pool.query(
            'SELECT wallet_address, name, email, mobile_number, is_authority, created_at FROM users WHERE wallet_address = $1',
            [address]
        );

        if (result.rows.length === 0) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        logger.error('Failed to get user profile:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get user profile',
            error: error.message
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT wallet_address, name, email, is_authority, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            users: result.rows,
            count: result.rows.length
        });

    } catch (error) {
        logger.error('Failed to get all users:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        });
    }
};

export default { 
    createUser, 
    getUserByAddress, 
    getUserProfile, 
    getAllUsers 
};