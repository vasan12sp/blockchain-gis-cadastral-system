export const API_URL = 'http://localhost:4000';

export const ENDPOINTS = {
    AUTH: {
        CHALLENGE: '/api/auth/request-nonce',
        LOGIN: '/api/auth/verify-signature',
        VERIFY: '/api/auth/verify-token'
    },
    USERS: {
        GET: (address) => `/api/users/${address}`,
        CREATE: '/api/users',
        PROFILE: '/api/users/profile'
    },
    PARCELS: {
        MY_PARCELS: '/api/parcels/my-parcels',
        REGISTER: '/api/parcels/register',
        DETAILS: (id) => `/api/parcels/${id}/details`,
        GEOJSON: (id) => `/api/parcels/${id}/geojson`,
        BLOCKCHAIN: (id) => `/api/blockchain/parcel/${id}`
    },
    TRANSFERS: {
        PENDING: '/api/transfers/pending',
        REQUEST: '/api/transfers/request',
        APPROVE: '/api/transfers/approve'
    },
    ZK: {
        STATUS: '/api/zk/status',
        GENERATE_PROOF: '/api/zk/generate-proof',
        VERIFY_PROOF: '/api/zk/verify-proof',
        GENERATE_SHAREABLE: '/api/zk/generate-shareable-proof',
        VERIFY_SHAREABLE: '/api/zk/verify-shareable-proof',
        MY_PROOFS: '/api/zk/my-proofs'
    }
};

export const STORAGE_KEYS = {
    SESSION_TOKEN: 'sessionToken',
    USER_ADDRESS: 'userAddress'
};

export const PROOF_EXPIRY_HOURS = 24;

export default {
    API_URL,
    ENDPOINTS,
    STORAGE_KEYS,
    PROOF_EXPIRY_HOURS
};