export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

export const ERROR_CODES = {
    // Auth errors
    TOKEN_MISSING: 'TOKEN_MISSING',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    INSUFFICIENT_PRIVILEGES: 'INSUFFICIENT_PRIVILEGES',
    
    // Parcel errors
    PARCEL_NOT_FOUND: 'PARCEL_NOT_FOUND',
    PARCEL_ALREADY_EXISTS: 'PARCEL_ALREADY_EXISTS',
    INVALID_GEOJSON: 'INVALID_GEOJSON',
    
    // Blockchain errors
    BLOCKCHAIN_ERROR: 'BLOCKCHAIN_ERROR',
    COMMITMENT_MISMATCH: 'COMMITMENT_MISMATCH',
    
    // IPFS errors
    IPFS_UPLOAD_FAILED: 'IPFS_UPLOAD_FAILED',
    IPFS_FETCH_FAILED: 'IPFS_FETCH_FAILED',
    RATE_LIMITED: 'RATE_LIMITED',
    
    // ZK errors
    ZK_SYSTEM_NOT_READY: 'ZK_SYSTEM_NOT_READY',
    ZK_PROOF_INVALID: 'ZK_PROOF_INVALID',
    ZK_VERIFICATION_FAILED: 'ZK_VERIFICATION_FAILED'
};

export const RATE_LIMITS = {
    GENERAL: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100
    },
    IPFS: {
        windowMs: 60 * 1000, // 1 minute
        max: 10
    },
    AUTH: {
        windowMs: 15 * 60 * 1000,
        max: 5
    }
};

export const IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs',
    'https://ipfs.io/ipfs',
    'https://cloudflare-ipfs.com/ipfs',
    'https://gateway.ipfs.io/ipfs',
    'https://dweb.link/ipfs'
];

export const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const PROOF_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export default {
    HTTP_STATUS,
    ERROR_CODES,
    RATE_LIMITS,
    IPFS_GATEWAYS,
    TOKEN_MAX_AGE,
    PROOF_EXPIRY_TIME
};