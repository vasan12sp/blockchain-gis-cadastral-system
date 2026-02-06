import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load contract ABI
const contractJson = JSON.parse(
    readFileSync(join(__dirname, '../../blockchain/build/contracts/CommitmentLandRegistry.json'), 'utf8')
);
export const contractAbi = contractJson.abi;

// Environment validation
const requiredEnvVars = ['CONTRACT_ADDRESS', 'REGISTRATION_AUTHORITY_PRIVATE_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`FATAL: ${envVar} must be set in .env file`);
        process.exit(1);
    }
}

// Initialize provider and signer
export const provider = new ethers.JsonRpcProvider(
    process.env.GANACHE_RPC_URL || "http://127.0.0.1:8545"
);

export const signer = new ethers.Wallet(
    process.env.REGISTRATION_AUTHORITY_PRIVATE_KEY,
    provider
);

// Initialize contract
export const landRegistryContract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    contractAbi,
    signer
);

console.log(`✅ Connected to LandRegistry at: ${process.env.CONTRACT_ADDRESS}`);

export default {
    provider,
    signer,
    landRegistryContract,
    contractAbi
};