import { API_URL, ENDPOINTS } from '../config/constants.js';
import authService from './auth.service.js';

class ParcelService {
    async getMyParcels() {
        const response = await fetch(`${API_URL}${ENDPOINTS.PARCELS.MY_PARCELS}`, {
            headers: authService.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch parcels');
        }

        return await response.json();
    }

    async getParcelDetails(parcelId) {
        const response = await fetch(`${API_URL}${ENDPOINTS.PARCELS.DETAILS(parcelId)}`, {
            headers: authService.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch parcel details');
        }

        return await response.json();
    }

    async getParcelGeoJSON(parcelId) {
        const response = await fetch(`${API_URL}${ENDPOINTS.PARCELS.GEOJSON(parcelId)}`, {
            headers: authService.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch GeoJSON');
        }

        return await response.json();
    }

    async registerParcel(parcelData) {
        const response = await fetch(`${API_URL}${ENDPOINTS.PARCELS.REGISTER}`, {
            method: 'POST',
            headers: authService.getAuthHeaders(),
            body: JSON.stringify(parcelData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        return await response.json();
    }

    async getBlockchainData(parcelId) {
        const response = await fetch(`${API_URL}${ENDPOINTS.PARCELS.BLOCKCHAIN(parcelId)}`, {
            headers: authService.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch blockchain data');
        }

        return await response.json();
    }
}

export const parcelService = new ParcelService();
export default parcelService;