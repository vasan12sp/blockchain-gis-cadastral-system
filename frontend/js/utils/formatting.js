export const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
};

export const formatFileSize = (bytes) => {
    return `${(bytes / 1024).toFixed(1)} KB`;
};

export default {
    formatAddress,
    formatDate,
    formatDateTime,
    formatFileSize
};