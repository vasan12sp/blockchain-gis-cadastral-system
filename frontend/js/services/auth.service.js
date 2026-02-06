import { API_URL, ENDPOINTS } from '../config/constants.js';
import storage from '../utils/storage.js';

class AuthService {
    constructor() {
        this.provider = null;
    }

    async connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed');
        }

        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await this.provider.send("eth_requestAccounts", []);
        
        if (accounts.length === 0) {
            throw new Error('No accounts found');
        }

        return accounts[0].toLowerCase();
    }

    async requestNonce(address) {
        const response = await fetch(`${API_URL}${ENDPOINTS.AUTH.CHALLENGE}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });

        if (!response.ok) {
            throw new Error('Failed to get nonce');
        }

        const data = await response.json();
        return data.nonce;
    }

    async signMessage(message) {
        const signer = this.provider.getSigner();
        return await signer.signMessage(message);
    }

    async verifySignature(address, signature) {
        const response = await fetch(`${API_URL}${ENDPOINTS.AUTH.LOGIN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, signature })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        const data = await response.json();
        storage.setToken(data.token);
        storage.setUserAddress(address);
        
        return data;
    }

    async checkUserExists(address) {
        const response = await fetch(`${API_URL}${ENDPOINTS.USERS.GET(address)}`);
        
        if (response.status === 404) {
            return null;
        }
        
        if (!response.ok) {
            throw new Error('Failed to check user');
        }

        return await response.json();
    }

    async registerUser(userData) {
        const response = await fetch(`${API_URL}${ENDPOINTS.USERS.CREATE}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        return await response.json();
    }

    async verifyToken(token) {
        const response = await fetch(`${API_URL}${ENDPOINTS.AUTH.VERIFY}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    }

    logout() {
        storage.clear();
        this.provider = null;
    }

    getAuthHeaders() {
        const token = storage.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }
}

export const authService = new AuthService();
export default authService;