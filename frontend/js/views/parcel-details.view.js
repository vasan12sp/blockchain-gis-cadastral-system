import { parcelDetailsTemplate } from '../ui/templates.js';
import parcelService from '../services/parcel.service.js';
import { initializeMap } from '../ui/components.js';
import { showTransferModal, showProofGenerationModal, showBlockchainModal } from '../ui/modals.js';

export class ParcelDetailsView {
    constructor(parcelId) {
        this.parcelId = parcelId;
        this.container = document.getElementById('main-content');
    }

    async render() {
        // Show loading state
        this.container.innerHTML = this.getLoadingHTML();

        try {
            // Fetch parcel data
            const { parcel } = await parcelService.getParcelDetails(this.parcelId);
            const { geoJsonData } = await parcelService.getParcelGeoJSON(this.parcelId);

            // Render parcel details
            this.container.innerHTML = parcelDetailsTemplate(parcel);
            
            // Initialize map
            setTimeout(() => {
                initializeMap('map', geoJsonData);
            }, 100);

            // Attach event listeners
            this.attachEventListeners(parcel);

        } catch (error) {
            console.error('Failed to load parcel details:', error);
            this.container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    attachEventListeners(parcel) {
        // Back button
        const backBtn = document.getElementById('back-to-parcels');
        if (backBtn) {
            backBtn.onclick = () => window.app.showDashboard();
        }

        // Action buttons
        const downloadBtn = document.querySelector('[data-action="download"]');
        const transferBtn = document.querySelector('[data-action="transfer"]');
        const blockchainBtn = document.querySelector('[data-action="blockchain"]');
        const proofBtn = document.querySelector('[data-action="generate-proof"]');

        if (downloadBtn) {
            downloadBtn.onclick = () => this.downloadCertificate(parcel);
        }

        if (transferBtn) {
            transferBtn.onclick = () => showTransferModal(this.parcelId);
        }

        if (blockchainBtn) {
            blockchainBtn.onclick = () => showBlockchainModal(this.parcelId, parcel.commitment_hash);
        }

        if (proofBtn) {
            proofBtn.onclick = () => showProofGenerationModal(this.parcelId);
        }
    }

    downloadCertificate(parcel) {
        const certificate = {
            parcelId: parcel.parcelId,
            owner: parcel.owner_address,
            registrationDate: parcel.created_at,
            commitment: parcel.commitment_hash,
            ipfsCid: parcel.ipfs_cid_encrypted,
            verified: parcel.blockchain?.exists || false,
            generatedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `land-certificate-${parcel.parcelId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    getLoadingHTML() {
        return `
            <div class="dashboard-container">
                <button class="back-button" onclick="window.app.showDashboard()">
                    ← Back to My Parcels
                </button>
                <div class="card" style="text-align: center; padding: 3rem;">
                    <h2>Loading Parcel Details...</h2>
                    <p>Please wait...</p>
                </div>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="dashboard-container">
                <button class="back-button" onclick="window.app.showDashboard()">
                    ← Back to My Parcels
                </button>
                <div class="card">
                    <h2>Error Loading Parcel</h2>
                    <p class="error-message">${message}</p>
                </div>
            </div>
        `;
    }
}

export default ParcelDetailsView;