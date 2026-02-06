import { ethers } from 'ethers';

export const generateSalt = () => {
    return ethers.hexlify(ethers.randomBytes(32));
};

export const hashCommitment = (ownerAddress, salt, parcelId) => {
    // Ensure consistent formatting
    const formattedAddress = ownerAddress.toLowerCase();
    const formattedSalt = salt.startsWith('0x') ? salt : `0x${salt}`;
    const formattedParcelId = parcelId.toString();
    
    // Create commitment hash using keccak256
    const packed = ethers.solidityPacked(
        ['address', 'bytes32', 'uint256'],
        [formattedAddress, formattedSalt, formattedParcelId]
    );
    
    return ethers.keccak256(packed);
};

export const verifyCommitment = (ownerAddress, salt, parcelId, expectedHash) => {
    const computed = hashCommitment(ownerAddress, salt, parcelId);
    return computed.toLowerCase() === expectedHash.toLowerCase();
};

export default {
    generateSalt,
    hashCommitment,
    verifyCommitment
};