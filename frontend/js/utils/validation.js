export const isValidAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidParcelId = (id) => {
    const numId = parseInt(id);
    return !isNaN(numId) && numId > 0;
};

export const isValidGeoJSON = (data) => {
    try {
        if (!data.type || !data.features) return false;
        if (data.type !== 'FeatureCollection') return false;
        if (!Array.isArray(data.features)) return false;
        return true;
    } catch {
        return false;
    }
};

export default {
    isValidAddress,
    isValidParcelId,
    isValidGeoJSON
};