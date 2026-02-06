import { API_URL, ENDPOINTS } from '../config/constants.js';
import authService from './auth.service.js';

class ZKService {
    async generateShareableProof(proofData) {
        const response = await fetch(`${API_URL}${ENDPOINTS.ZK.GENERATE_SHAREABLE}`, {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify(proofData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Proof generation failed');
        }

        return await response.json();
    }

    async verifyShareableProof(shareableProof) {
        const response = await fetch(`${API_URL}${ENDPOINTS.ZK.VERIFY_SHAREABLE}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shareableProof })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Proof verification failed');
        }

        return await response.json();
    }

    async getMyProofs() {
        const response = await fetch(`${API_URL}${ENDPOINTS.ZK.MY_PROOFS}`, {
            headers: authService.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch proofs');
        }

        return await response.json();
    }
}

export const zkService = new ZKService();
export default zkService;