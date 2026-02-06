import { API_URL } from '../config/constants.js';
import storage from '../utils/storage.js';

class ParcelService {
    async getMyParcels() {
        const response = await fetch(`${API_URL}/api/parcels/my-parcels`, {
            headers: {
                'Authorization': `Bearer ${storage.getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch parcels');
        }

        return await response.json();
    }

    async registerParcel(data) {
        const response = await fetch(`${API_URL}/api/parcels/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storage.getToken()}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Registration failed:', error); // Use console.error instead of logger
            throw new Error(error.message || 'Failed to register parcel');
        }

        return await response.json();
    }

    async getParcelDetails(parcelId) {
        const response = await fetch(`${API_URL}/api/parcels/${parcelId}/details`, {
            headers: {
                'Authorization': `Bearer ${storage.getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch parcel details');
        }

        return await response.json();
    }

    async getParcelGeoJSON(parcelId) {
        const response = await fetch(`${API_URL}/api/parcels/${parcelId}/geojson`, {
            headers: {
                'Authorization': `Bearer ${storage.getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch parcel GeoJSON');
        }

        return await response.json();
    }
}

export default new ParcelService();