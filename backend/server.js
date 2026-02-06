import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Configuration
import { config } from './config/environment.js';

// Middleware
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import parcelRoutes from './routes/parcel.routes.js';
import transferRoutes from './routes/transfer.routes.js';
import zkRoutes from './routes/zk.routes.js';
import healthRoutes from './routes/health.routes.js';

// Services (initialize ZK system)
import './services/zk.service.js';

// Logger
import logger from './utils/logger.js';

// Initialize Express app
const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Request logging middleware (development only)
if (config.nodeEnv === 'development') {
    app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path}`, {
            body: req.body,
            query: req.query
        });
        next();
    });
}

// ==================== ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/zk', zkRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Blockchain-Based Cadastral System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            parcels: '/api/parcels',
            transfers: '/api/transfers',
            zk: '/api/zk',
            health: '/api/health'
        },
        documentation: '/api/docs'
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        success: true,
        apiDocumentation: {
            authentication: {
                requestNonce: 'POST /api/auth/request-nonce',
                verifySignature: 'POST /api/auth/verify-signature'
            },
            users: {
                getProfile: 'GET /api/users/profile (requires auth)',
                getAllUsers: 'GET /api/users (requires authority)'
            },
            parcels: {
                getMyParcels: 'GET /api/parcels/my-parcels (requires auth)',
                registerParcel: 'POST /api/parcels/register (requires authority)',
                getParcelDetails: 'GET /api/parcels/:parcelId/details (requires auth)',
                getParcelGeoJSON: 'GET /api/parcels/:parcelId/geojson (requires auth)'
            },
            transfers: {
                getPending: 'GET /api/transfers/pending (requires authority)',
                requestTransfer: 'POST /api/transfers/request (requires auth)',
                approveTransfer: 'POST /api/transfers/approve (requires authority)'
            },
            zk: {
                getStatus: 'GET /api/zk/status',
                getDiagnostics: 'GET /api/zk/diagnostics',
                generateCommitment: 'POST /api/zk/generate-commitment',
                generateProof: 'POST /api/zk/generate-proof (requires auth)',
                verifyProof: 'POST /api/zk/verify-proof',
                verifyOwnership: 'POST /api/zk/verify-ownership (requires auth)',
                generateShareableProof: 'POST /api/zk/generate-shareable-proof (requires auth)',
                verifyShareableProof: 'POST /api/zk/verify-shareable-proof',
                getMyProofs: 'GET /api/zk/my-proofs (requires auth)'
            },
            health: {
                healthCheck: 'GET /api/health',
                blockchainHealth: 'GET /api/health/blockchain'
            }
        }
    });
});

// ==================== ERROR HANDLING ====================
// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// ==================== SERVER STARTUP ====================
const server = app.listen(config.port, () => {
    console.log('\n' + '='.repeat(60));
    logger.success(`🚀 Server started successfully`);
    console.log('='.repeat(60));
    logger.info(`📡 Server running on port: ${config.port}`);
    logger.info(`🌍 Environment: ${config.nodeEnv}`);
    logger.info(`🔗 API Base URL: http://localhost:${config.port}/api`);
    logger.info(`📚 API Documentation: http://localhost:${config.port}/api/docs`);
    console.log('='.repeat(60) + '\n');
});

// ==================== GRACEFUL SHUTDOWN ====================
const gracefulShutdown = async (signal) => {
    logger.warn(`\n${signal} received. Starting graceful shutdown...`);
    
    server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
            // Close database pool
            const pool = (await import('./config/database.js')).default;
            await pool.end();
            logger.info('Database connections closed');
            
            logger.success('Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise);
    logger.error('Reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Export for testing
export default app;