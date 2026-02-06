import { IPFS_GATEWAYS } from '../config/constants.js';

export const getGatewayUrl = (ipfsCid, gatewayIndex = 0) => {
    const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
    return `${gateway}/${ipfsCid}`;
};

export const getAllGatewayUrls = (ipfsCid) => {
    return IPFS_GATEWAYS.map(gateway => `${gateway}/${ipfsCid}`);
};

export const getNextGateway = (currentIndex) => {
    return (currentIndex + 1) % IPFS_GATEWAYS.length;
};

export default {
    getGatewayUrl,
    getAllGatewayUrls,
    getNextGateway,
    IPFS_GATEWAYS
};