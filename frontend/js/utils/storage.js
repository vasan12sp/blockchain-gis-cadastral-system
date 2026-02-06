import { STORAGE_KEYS } from '../config/constants.js';

export const storage = {
    getToken: () => localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN),
    
    setToken: (token) => localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token),
    
    removeToken: () => localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN),
    
    getUserAddress: () => localStorage.getItem(STORAGE_KEYS.USER_ADDRESS),
    
    setUserAddress: (address) => localStorage.setItem(STORAGE_KEYS.USER_ADDRESS, address),
    
    clear: () => {
        localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_ADDRESS);
    }
};

export default storage;