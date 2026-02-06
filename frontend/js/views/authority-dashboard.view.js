import transferService from '../services/transfer.service.js';
import parcelService from '../services/parcel.service.js';
import { formatDate } from '../utils/formatting.js';

export class AuthorityDashboardView {
    constructor() {
        this.container = document.getElementById('main-content');
    }

    async render() {
        const pendingTransfers = await this.loadPendingTransfers();
        
        this.container.innerHTML = `
            <div class="authority-dashboard">
                <div class="dashboard-header">
                    <h2>🏛️ Registration Authority Dashboard</h2>
                    <p>Manage land registrations and transfer requests</p>
                </div>

                <div class="dashboard-section">
                    <div class="card">
                        <h3>📝 Register New Land Parcel</h3>
                        ${this.getRegistrationFormHTML()}
                        <div id="registration-status" class="status-message"></div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <div class="card">
                        <h3>🔄 Pending Transfer Requests</h3>
                        <div class="transfer-requests-container">
                            ${pendingTransfers.length === 0 ? 
                                '<p class="no-requests">No pending transfer requests at this time.</p>' :
                                this.generateTransferRequestsHTML(pendingTransfers)
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners(pendingTransfers);
    }

    async loadPendingTransfers() {
        try {
            const { transfers } = await transferService.getPendingTransfers();
            return transfers || [];
        } catch (error) {
            console.error('Failed to load pending transfers:', error);
            return [];
        }
    }

    getRegistrationFormHTML() {
        return `
            <form id="register-parcel-form" class="dashboard-form">
                <div class="form-group">
                    <label for="parcel-id">Parcel ID</label>
                    <input type="number" id="parcel-id" required min="1" placeholder="Enter unique parcel ID">
                </div>
                
                <div class="form-group">
                    <label for="owner-address">Owner Ethereum Address</label>
                    <input type="text" id="owner-address" required placeholder="0x..." pattern="0x[a-fA-F0-9]{40}">
                </div>
                
                <div class="form-group">
                    <label for="geojson-file">GeoJSON File</label>
                    <div class="file-input-wrapper">
                        <span id="file-name-label" class="file-input-label">Select GeoJSON file...</span>
                        <input type="file" id="geojson-file" accept=".json,.geojson" required>
                    </div>
                    <small style="color: #6b7280; font-size: 0.8rem; margin-top: 0.5rem;">
                        💡 Upload a GeoJSON file containing the land boundary data
                    </small>
                </div>
                
                <button type="submit" class="button button-primary">🔒 Register Land Parcel</button>
            </form>
        `;
    }

    generateTransferRequestsHTML(requests) {
        return `
            <div class="transfer-requests-list">
                ${requests.map(request => `
                    <div class="transfer-request-card" id="request-${request.transfer_id}">
                        <div class="request-header">
                            <h4>Transfer Request #${request.transfer_id}</h4>
                            <span class="request-status status-${request.status}">${request.status.toUpperCase()}</span>
                        </div>
                        
                        <div class="request-details">
                            <div class="detail-row">
                                <strong>Parcel ID:</strong> <span class="parcel-id">${request.parcel_id}</span>
                            </div>
                            <div class="detail-row">
                                <strong>From:</strong> <span class="address">${request.from_address}</span>
                            </div>
                            <div class="detail-row">
                                <strong>To:</strong> <span class="address">${request.to_address}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Requested:</strong> <span>${formatDate(request.requested_at)}</span>
                            </div>
                        </div>
                        
                        <div class="request-actions">
                            <button id="approve-${request.transfer_id}" class="button button-success">
                                ✅ Approve Transfer
                            </button>
                            <button id="reject-${request.transfer_id}" class="button button-danger">
                                ❌ Reject Request
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    attachEventListeners(pendingTransfers) {
        // Registration form
        const form = document.getElementById('register-parcel-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleRegistration(e));
        }
    
        // File input
        const fileInput = document.getElementById('geojson-file');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const fileName = e.target.files[0]?.name || 'Select GeoJSON file...';
                document.getElementById('file-name-label').textContent = fileName;
            });
        }
    
        // Transfer approval/rejection buttons
        pendingTransfers.forEach(request => {
            const approveBtn = document.getElementById(`approve-${request.transfer_id}`);
            const rejectBtn = document.getElementById(`reject-${request.transfer_id}`);
            
            if (approveBtn) {
                approveBtn.onclick = () => this.handleTransferAction(request, 'approve');
            }
            if (rejectBtn) {
                rejectBtn.onclick = () => this.handleTransferAction(request, 'reject');
            }
        });
    }
    
    async handleTransferAction(request, action) {
        const isApproval = action === 'approve';
        const actionText = isApproval ? 'approve' : 'reject';
        
        if (!confirm(`Are you sure you want to ${actionText} this transfer?`)) {
            return;
        }
    
        const notes = prompt(`Enter notes for this ${actionText}ion (optional):`);
    
        try {
            if (isApproval) {
                const result = await transferService.approveTransfer(request.transfer_id, notes);
                alert(`✅ Transfer approved! TX: ${result.transfer.txHash}`);
            } else {
                await transferService.rejectTransfer(request.transfer_id, notes);
                alert('❌ Transfer rejected');
            }
    
            // Refresh dashboard
            await this.render();
    
        } catch (error) {
            alert(`❌ Failed to ${actionText}: ${error.message}`);
        }
    }

    async handleRegistration(event) {
        event.preventDefault();
        
        const statusDiv = document.getElementById('registration-status');
        statusDiv.textContent = 'Processing...';
        statusDiv.className = 'status-message status-pending';

        const parcelId = document.getElementById('parcel-id').value;
        const ownerAddress = document.getElementById('owner-address').value;
        const geoJsonFile = document.getElementById('geojson-file').files[0];

        try {
            // Read file
            const fileContent = await this.readFileAsText(geoJsonFile);
            const geoJsonData = JSON.parse(fileContent);

            // Register parcel
            const result = await parcelService.registerParcel({
                parcelId: parseInt(parcelId),
                ownerAddress: ownerAddress.toLowerCase(),
                geoJsonData
            });

            statusDiv.textContent = `✅ Success! Parcel registered. IPFS CID: ${result.parcel.ipfsCid}`;
            statusDiv.className = 'status-message status-success';
            
            // Reset form
            document.getElementById('register-parcel-form').reset();
            document.getElementById('file-name-label').textContent = 'Select GeoJSON file...';

        } catch (error) {
            console.error('Registration error:', error);
            statusDiv.textContent = `❌ Error: ${error.message}`;
            statusDiv.className = 'status-message status-error';
        }
    }

    async handleTransferAction(request, action) {
        const isApproval = action === 'approve';
        const actionText = isApproval ? 'approve' : 'reject';
        
        if (!confirm(`Are you sure you want to ${actionText} this transfer?`)) {
            return;
        }

        try {
            if (isApproval) {
                const result = await transferService.approveTransfer(request.transfer_id);
                alert(`✅ Transfer approved! TX: ${result.transfer.txHash}`);
            } else {
                alert('⚠️ Rejection not implemented yet');
                return;
            }

            // Refresh dashboard
            await this.render();

        } catch (error) {
            alert(`❌ Failed to ${actionText}: ${error.message}`);
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
}

export default AuthorityDashboardView;