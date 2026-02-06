import pool from '../config/database.js';
import { provider, landRegistryContract } from '../config/blockchain.js';
import { zkSystem } from '../services/zk.service.js';
import logger from '../utils/logger.js';
import { HTTP_STATUS } from '../config/constants.js';

export const healthCheck = async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            database: 'unknown',
            blockchain: 'unknown',
            zkSystem: 'unknown'
        }
    };

    try {
        // Check database
        await pool.query('SELECT 1');
        health.services.database = 'healthy';
    } catch (error) {
        health.services.database = 'unhealthy';
        health.status = 'degraded';
        logger.error('Database health check failed:', error);
    }

    try {
        // Check blockchain
        await provider.getBlockNumber();
        health.services.blockchain = 'healthy';
    } catch (error) {
        health.services.blockchain = 'unhealthy';
        health.status = 'degraded';
        logger.error('Blockchain health check failed:', error);
    }

    // Check ZK system
    health.services.zkSystem = zkSystem && zkSystem.isReady() ? 'healthy' : 'unhealthy';
    
    const statusCode = health.status === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
    res.status(statusCode).json(health);
};

export const blockchainHealth = async (req, res) => {
    try {
        const blockNumber = await provider.getBlockNumber();
        const network = await provider.getNetwork();
        const contractCode = await provider.getCode(landRegistryContract.target);
        
        res.json({
            success: true,
            blockchain: {
                connected: true,
                blockNumber,
                chainId: network.chainId.toString(),
                contractDeployed: contractCode !== '0x',
                contractAddress: landRegistryContract.target
            }
        });
    } catch (error) {
        logger.error('Blockchain health check failed:', error);
        res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
            success: false,
            error: 'Blockchain not available',
            details: error.message
        });
    }
};

export default { healthCheck, blockchainHealth };