import { ethers } from 'ethers';

export const validateAddress = (address) => {
    if (!address || typeof address !== 'string') {
        throw new Error('Address is required and must be a string');
    }
    
    if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address format');
    }
    
    return address.toLowerCase();
};

export const validateParcelId = (parcelId) => {
    const id = parseInt(parcelId);
    
    if (isNaN(id) || id <= 0) {
        throw new Error('Invalid parcel ID: must be a positive integer');
    }
    
    return id;
};

export const validateGeoJSON = (geoJson) => {
    if (!geoJson || typeof geoJson !== 'object') {
        throw new Error('GeoJSON must be a valid object');
    }
    
    if (geoJson.type !== 'FeatureCollection') {
        throw new Error('GeoJSON must be a FeatureCollection');
    }
    
    if (!Array.isArray(geoJson.features) || geoJson.features.length === 0) {
        throw new Error('GeoJSON must contain at least one feature');
    }
    
    return true;
};

export const validateProofData = (proof, publicSignals) => {
    if (!proof || typeof proof !== 'object') {
        throw new Error('Proof must be a valid object');
    }
    
    if (!Array.isArray(publicSignals) || publicSignals.length === 0) {
        throw new Error('Public signals must be a non-empty array');
    }
    
    return true;
};

export default {
    validateAddress,
    validateParcelId,
    validateGeoJSON,
    validateProofData
};