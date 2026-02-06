import pool from '../config/database.js';
import { zkSystem } from '../services/zk.service.js';
import * as blockchainService from '../services/blockchain.service.js';
import { validateParcelId, validateAddress, validateProofData } from '../utils/validation.js';
import logger from '../utils/logger.js';
import { HTTP_STATUS, ERROR_CODES, PROOF_EXPIRY_TIME } from '../config/constants.js';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { config } from '../config/environment.js';

export const getZKStatus = (req, res) => {
    const isReady = zkSystem ? zkSystem.isReady() : false;
    
    res.json({
        success: true,
        isReady,
        message: isReady ? 'ZK system is ready' : 'ZK system is not ready'
    });
};

export const getDiagnostics = async (req, res) => {
    try {
        const diagnostics = {
            environment: {
                ZK_SETUP: config.zk.setup,
                ZK_CIRCUIT_PATH: config.zk.circuitPath,
                ZK_BUILD_PATH: config.zk.buildPath,
                NODE_ENV: config.nodeEnv
            },
            zkSystem: {
                exists: !!zkSystem,
                isReady: zkSystem ? zkSystem.isReady() : false
            },
            files: {},
            dependencies: {}
        };
        
        // Check if circuit files exist
        try {
            diagnostics.files.circuitDir = existsSync(config.zk.circuitPath);
            diagnostics.files.buildDir = existsSync(config.zk.buildPath);
            
            if (existsSync(config.zk.circuitPath)) {
                diagnostics.files.circuitFiles = await readdir(config.zk.circuitPath);
            }
            
            if (existsSync(config.zk.buildPath)) {
                diagnostics.files.buildFiles = await readdir(config.zk.buildPath);
            }
        } catch (fileError) {
            diagnostics.files.error = fileError.message;
        }
        
        // Check dependencies
        try {
            diagnostics.dependencies.snarkjs = !!require.resolve('snarkjs');
        } catch { diagnostics.dependencies.snarkjs = false; }
        
        try {
            diagnostics.dependencies.circomlib = !!require.resolve('circomlib');
        } catch { diagnostics.dependencies.circomlib = false; }
        
        res.json(diagnostics);
        
    } catch (error) {
        logger.error('Diagnostics failed:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: 'Diagnostics failed',
            message: error.message
        });
    }
};

export const generateCommitment = async (req, res) => {
    try {
        const { ownerAddress, salt, parcelId } = req.body;
        
        if (!ownerAddress || !salt || !parcelId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Missing required fields: ownerAddress, salt, parcelId'
            });
        }
        
        logger.info('Generating commitment...');
        
        const commitment = await zkSystem.generateCommitment(
            validateAddress(ownerAddress),
            salt,
            validateParcelId(parcelId)
        );
        
        res.json({
            success: true,
            commitment,
            message: 'Commitment generated successfully'
        });
        
    } catch (error) {
        logger.error('Commitment generation failed:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: 'Failed to generate commitment',
            details: error.message
        });
    }
};

export const generateProof = async (req, res) => {
    try {
        const { parcelId, challengeNonce } = req.body;
        const userAddress = req.user.address;
        
        if (!parcelId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Parcel ID is required'
            });
        }
        
        if (!zkSystem || !zkSystem.isReady()) {
            return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
                error: 'ZK proof system not available',
                code: ERROR_CODES.ZK_SYSTEM_NOT_READY
            });
        }
        
        const validatedParcelId = validateParcelId(parcelId);
        
        // Get user's secret data
        const dbResult = await pool.query(
            'SELECT salt_encrypted, commitment_hash FROM user_secrets WHERE parcel_id = $1 AND owner_address = $2',
            [validatedParcelId, userAddress]
        );
        
        if (dbResult.rows.length === 0) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Parcel not found or you do not own this parcel',
                code: ERROR_CODES.PARCEL_NOT_FOUND
            });
        }
        
        const { salt_encrypted, commitment_hash } = dbResult.rows[0];
        const nonce = challengeNonce || Date.now().toString();
        
        logger.info(`Generating ZK proof for parcel ${validatedParcelId}...`);
        
        const proofResult = await zkSystem.generateOwnershipProof(
            userAddress,
            salt_encrypted,
            validatedParcelId,
            commitment_hash,
            nonce
        );
        
        res.json({
            success: true,
            proof: proofResult.proof,
            publicSignals: proofResult.publicSignals,
            message: 'ZK proof generated successfully'
        });
        
    } catch (error) {
        logger.error('ZK proof generation failed:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: 'Failed to generate ZK proof',
            details: error.message
        });
    }
};

export const verifyProof = async (req, res) => {
    try {
        const { proof, publicSignals } = req.body;
        
        if (!proof || !publicSignals) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Proof and public signals are required'
            });
        }
        
        validateProofData(proof, publicSignals);
        
        if (!zkSystem || !zkSystem.isReady()) {
            return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
                error: 'ZK verification system not available',
                code: ERROR_CODES.ZK_SYSTEM_NOT_READY
            });
        }
        
        logger.info('Verifying ZK proof...');
        
        const isValid = await zkSystem.verifyOwnershipProof(proof, publicSignals);
        
        res.json({
            success: true,
            isValid,
            message: isValid ? 'Proof is valid' : 'Proof is invalid'
        });
        
    } catch (error) {
        logger.error('ZK proof verification failed:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: 'Failed to verify ZK proof',
            details: error.message
        });
    }
};

export const verifyOwnership = async (req, res) => {
    try {
        const { parcelId, proof, publicSignals } = req.body;
        const userAddress = req.user.address;
        
        if (!parcelId || !proof || !publicSignals) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Parcel ID, proof, and public signals are required'
            });
        }
        
        const validatedParcelId = validateParcelId(parcelId);
        validateProofData(proof, publicSignals);
        
        // Verify ZK proof
        const zkValid = await zkSystem.verifyOwnershipProof(proof, publicSignals);
        
        if (!zkValid) {
            return res.json({
                success: true,
                verified: false,
                message: 'ZK proof verification failed',
                code: ERROR_CODES.ZK_PROOF_INVALID
            });
        }
        
        // Verify blockchain commitment
        const dbResult = await pool.query(
            'SELECT commitment_hash FROM user_secrets WHERE parcel_id = $1 AND owner_address = $2',
            [validatedParcelId, userAddress]
        );
        
        if (dbResult.rows.length === 0) {
            return res.json({
                success: true,
                verified: false,
                message: 'No ownership record found'
            });
        }
        
        const blockchainVerification = await blockchainService.verifyParcelCommitment(
            validatedParcelId,
            dbResult.rows[0].commitment_hash
        );
        
        const verified = zkValid && blockchainVerification.valid;
        
        logger.success(`Ownership verification for parcel ${validatedParcelId}: ${verified ? 'VERIFIED' : 'FAILED'}`);
        
        res.json({
            success: true,
            verified,
            zkProofValid: zkValid,
            blockchainVerified: blockchainVerification.valid,
            message: verified ? 'Ownership verified' : 'Ownership verification failed'
        });
        
    } catch (error) {
        logger.error('Ownership verification failed:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: 'Failed to verify ownership',
            details: error.message
        });
    }
};

export const generateShareableProof = async (req, res) => {
    try {
        const { parcelId, message, verifierAddress } = req.body;
        const userAddress = req.user.address;
        
        if (!parcelId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Parcel ID is required'
            });
        }
        
        if (!zkSystem || !zkSystem.isReady()) {
            return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
                error: 'ZK proof system not available',
                code: ERROR_CODES.ZK_SYSTEM_NOT_READY
            });
        }
        
        const validatedParcelId = validateParcelId(parcelId);
        
        if (verifierAddress) {
            validateAddress(verifierAddress);
        }
        
        // Get user's parcel data
        const dbResult = await pool.query(
            'SELECT salt_encrypted, commitment_hash FROM user_secrets WHERE parcel_id = $1 AND owner_address = $2',
            [validatedParcelId, userAddress]
        );
        
        if (dbResult.rows.length === 0) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Parcel not found or access denied',
                code: ERROR_CODES.PARCEL_NOT_FOUND
            });
        }
        
        const { salt_encrypted, commitment_hash } = dbResult.rows[0];
        const challengeNonce = Date.now().toString();
        
        logger.info(`Generating shareable ZK proof for parcel ${validatedParcelId}...`);
        
        const proofResult = await zkSystem.generateOwnershipProof(
            userAddress,
            salt_encrypted,
            validatedParcelId,
            commitment_hash,
            challengeNonce,
            verifierAddress || null
        );
        
        const shareableProof = {
            version: "1.0",
            type: "LAND_OWNERSHIP_PROOF",
            parcelId: validatedParcelId,
            prover: userAddress,
            verifier: verifierAddress || "PUBLIC",
            message: message || `Ownership proof for Parcel ${validatedParcelId}`,
            generatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + PROOF_EXPIRY_TIME).toISOString(),
            challengeNonce,
            commitment: commitment_hash,
            zkProof: {
                proof: proofResult.proof,
                publicSignals: proofResult.publicSignals
            },
            verificationInstructions: {
                endpoint: `${req.protocol}://${req.get('host')}/api/zk/verify-shareable-proof`,
                method: "POST",
                description: "Send this entire proof object to verify land ownership"
            }
        };
        
        logger.success(`Shareable proof generated for parcel ${validatedParcelId}`);
        
        res.json({
            success: true,
            shareableProof,
            message: 'Shareable ownership proof generated successfully'
        });
        
    } catch (error) {
        logger.error('Shareable proof generation failed:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
            error: 'Failed to generate shareable proof',
            details: error.message 
        });
    }
};

export const verifyShareableProof = async (req, res) => {
    try {
        const { shareableProof } = req.body;
        
        if (!shareableProof) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Missing shareable proof data'
            });
        }
        
        // Validate proof structure
        if (!shareableProof.zkProof || !shareableProof.parcelId || !shareableProof.commitment) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Invalid proof format'
            });
        }
        
        // Check if proof has expired
        if (new Date() > new Date(shareableProof.expiresAt)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Proof has expired',
                expiredAt: shareableProof.expiresAt
            });
        }
        
        if (!zkSystem || !zkSystem.isReady()) {
            return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
                error: 'ZK verification system not available',
                code: ERROR_CODES.ZK_SYSTEM_NOT_READY
            });
        }
        
        logger.info(`Verifying shareable ZK proof for parcel: ${shareableProof.parcelId}`);
        
        // Verify the ZK proof
        const zkVerificationResult = await zkSystem.verifyOwnershipProof(
            shareableProof.zkProof.proof,
            shareableProof.zkProof.publicSignals,
            shareableProof.verifier !== "PUBLIC" ? shareableProof.verifier : null
        );
        
        const zkProofValid = zkVerificationResult.valid === true;
        
        // Verify with blockchain
        const blockchainVerification = await blockchainService.verifyParcelCommitment(
            shareableProof.parcelId,
            shareableProof.commitment
        );
        
        const overallValid = zkProofValid && blockchainVerification.valid;
        
        const verificationResult = {
            success: true,
            proofValid: overallValid,
            zkProofValid,
            blockchainVerified: blockchainVerification.valid,
            parcelId: shareableProof.parcelId,
            prover: shareableProof.prover,
            message: shareableProof.message,
            generatedAt: shareableProof.generatedAt,
            verifiedAt: new Date().toISOString(),
            blockchainData: {
                commitment: blockchainVerification.blockchainCommitment,
                expectedCommitment: blockchainVerification.expectedCommitment
            },
            status: overallValid ? 'OWNERSHIP_VERIFIED' : 'VERIFICATION_FAILED',
            failureReasons: []
        };
        
        if (!zkProofValid) {
            verificationResult.failureReasons.push(
                zkVerificationResult.error || 'Invalid ZK proof'
            );
        }
        
        if (!blockchainVerification.valid) {
            verificationResult.failureReasons.push(blockchainVerification.reason);
        }
        
        // Log verification
        try {
            await pool.query(
                `INSERT INTO proof_verifications 
                 (parcel_id, prover_address, verifier_ip, verification_result, verified_at) 
                 VALUES ($1, $2, $3, $4, NOW())
                 ON CONFLICT DO NOTHING`,
                [
                    shareableProof.parcelId, 
                    shareableProof.prover, 
                    req.ip, 
                    JSON.stringify(verificationResult)
                ]
            );
        } catch (logError) {
            logger.warn('Failed to log verification:', logError);
        }
        
        logger.info(`Shareable proof verification result: ${overallValid ? 'VALID' : 'INVALID'}`);
        
        res.json(verificationResult);
        
    } catch (error) {
        logger.error('Shareable proof verification failed:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
            error: 'Failed to verify shareable proof',
            details: error.message,
            stack: config.nodeEnv === 'development' ? error.stack : undefined
        });
    }
};

export const getMyProofs = async (req, res) => {
    try {
        const userAddress = req.user.address;
        
        const result = await pool.query(
            `SELECT parcel_id, challenge_nonce, expires_at, created_at,
                    (SELECT COUNT(*) FROM proof_verifications pv 
                     WHERE pv.parcel_id = sp.parcel_id 
                     AND pv.prover_address = sp.prover_address) as verification_count
             FROM shareable_proofs sp 
             WHERE prover_address = $1 
             ORDER BY created_at DESC`,
            [userAddress]
        );
        
        res.json({
            success: true,
            count: result.rows.length,
            proofs: result.rows
        });
        
    } catch (error) {
        logger.error('Error fetching proof history:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
            error: 'Failed to fetch proof history' 
        });
    }
};

export default {
    getZKStatus,
    getDiagnostics,
    generateCommitment,
    generateProof,
    verifyProof,
    verifyOwnership,
    generateShareableProof,
    verifyShareableProof,
    getMyProofs
};