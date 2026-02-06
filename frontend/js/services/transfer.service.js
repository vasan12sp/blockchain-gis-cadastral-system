import { API_URL, ENDPOINTS } from '../config/constants.js';
import authService from './auth.service.js';

class TransferService {
    async getPendingTransfers() {
        const response = await fetch(`${API_URL}${ENDPOINTS.TRANSFERS.PENDING}`, {
            headers: authService.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch transfers');
        }

        return await response.json();
    }

    async requestTransfer(transferData) {
        const response = await fetch(`${API_URL}${ENDPOINTS.TRANSFERS.REQUEST}`, {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify(transferData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Transfer request failed');
        }

        return await response.json();
    }

    async approveTransfer(requestId) {
        const response = await fetch(`${API_URL}${ENDPOINTS.TRANSFERS.APPROVE}`, {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify({ transferId: requestId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Transfer approval failed');
        }

        return await response.json();
    }
}

export const transferService = new TransferService();
export default transferService;