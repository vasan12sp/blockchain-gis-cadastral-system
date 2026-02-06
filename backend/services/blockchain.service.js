import { landRegistryContract } from '../config/blockchain.js';
import { ethers } from 'ethers';
import logger from '../utils/logger.js';

export const registerParcelOnChain = async (parcelId, commitmentHash, ipfsCidHash, parentId = 0) => {
    try {
        console.log(`🔗 Registering parcel ${parcelId} on blockchain...`);
        
        const tx = await landRegistryContract.registerParcel(
            parcelId,
            commitmentHash,
            ipfsCidHash,
            parentId
        );
        
        console.log(`📝 Transaction hash: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Parcel ${parcelId} registered on blockchain (Block: ${receipt.blockNumber})`);
        
        return {
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber
        };
    } catch (error) {
        console.error('❌ Blockchain registration failed:', error);
        throw new Error(`Blockchain registration failed: ${error.message}`);
    }
};

export const getParcelFromChain = async (parcelId) => {
    try {
        const blockchainData = await landRegistryContract.getParcel(parcelId);
        const [storedParcelId, commitment, ipfsCidHash, parentId, timestamp] = blockchainData;
        
        return {
            exists: storedParcelId !== 0n,
            parcelId: storedParcelId.toString(),
            commitment,
            ipfsCidHash,
            parentId: parentId.toString(),
            timestamp: new Date(Number(timestamp) * 1000).toISOString()
        };
    } catch (error) {
        console.error(`❌ Failed to fetch parcel ${parcelId} from blockchain:`, error);
        throw error;
    }
};

export const transferParcelOnChain = async (parcelId, fromAddress, toAddress) => {
    try {
        console.log(`🔗 Transferring parcel ${parcelId} from ${fromAddress} to ${toAddress}...`);
        
        const tx = await landRegistryContract.transferParcel(parcelId, toAddress);
        const receipt = await tx.wait();
        
        console.log(`✅ Parcel transferred on blockchain (Block: ${receipt.blockNumber})`);
        
        return {
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber
        };
    } catch (error) {
        console.error('❌ Blockchain transfer failed:', error);
        throw new Error(`Blockchain transfer failed: ${error.message}`);
    }
};

export const verifyParcelCommitment = async (parcelId, expectedCommitment) => {
    try {
        const parcelData = await getParcelFromChain(parcelId);
        
        if (!parcelData.exists) {
            return { valid: false, reason: 'Parcel does not exist on blockchain' };
        }
        
        const matches = parcelData.commitment.toLowerCase() === expectedCommitment.toLowerCase();
        
        return {
            valid: matches,
            blockchainCommitment: parcelData.commitment,
            expectedCommitment,
            reason: matches ? 'Commitment verified' : 'Commitment mismatch'
        };
    } catch (error) {
        console.error('❌ Commitment verification failed:', error);
        return { valid: false, reason: error.message };
    }
};

export default {
    registerParcelOnChain,
    getParcelFromChain,
    transferParcelOnChain,
    verifyParcelCommitment
};