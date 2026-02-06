import 'dotenv/config';

// Validate required environment variables
const requiredEnvVars = [
    'DB_USER',
    'DB_HOST',
    'DB_DATABASE',
    'DB_PASSWORD',
    'DB_PORT',
    'CONTRACT_ADDRESS',
    'REGISTRATION_AUTHORITY_PRIVATE_KEY',
    'JWT_SECRET',
    'PINATA_JWT'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
}

// Export validated environment configuration
export const config = {
    // Server
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Database
    database: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT)
    },
    
    // Blockchain
    blockchain: {
        contractAddress: process.env.CONTRACT_ADDRESS,
        rpcUrl: process.env.GANACHE_RPC_URL || "http://127.0.0.1:8545",
        authorityPrivateKey: process.env.REGISTRATION_AUTHORITY_PRIVATE_KEY
    },
    
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d',
        issuer: 'cadastre-system',
        audience: 'cadastre-users'
    },
    
    // IPFS
    ipfs: {
        pinataJwt: process.env.PINATA_JWT,
        timeout: 60000
    },
    
    // ZK System
    zk: {
        setup: process.env.ZK_SETUP === 'true',
        circuitPath: process.env.ZK_CIRCUIT_PATH || './circuits',
        buildPath: process.env.ZK_BUILD_PATH || './circuits/build'
    }
};

console.log('✅ Environment configuration validated');

export default config;