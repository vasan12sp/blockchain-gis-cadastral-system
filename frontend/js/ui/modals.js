import authService from '../services/auth.service.js';
import transferService from '../services/transfer.service.js';
import zkService from '../services/zk.service.js';
import { copyToClipboard, showToast } from './components.js';
import { API_URL } from '../config/constants.js';

export const closeModal = () => {
    document.querySelectorAll('.modal-overlay').forEach(modal => modal.remove());
};

export const showSignupModal = (walletAddress) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close-button" onclick="closeModal()">&times;</button>
            <h3 class="modal-title">Create Your Account</h3>
            <p class="modal-body">Welcome! Please fill out your details to register.</p>
            <form id="signup-form" class="dashboard-form">
                <div class="form-group">
                    <label>Wallet Address</label>
                    <input type="text" value="${walletAddress}" class="text-input" disabled>
                </div>
                <div class="form-group">
                    <label for="name">Full Name</label>
                    <input type="text" id="name" required class="text-input">
                </div>
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" required class="text-input">
                </div>
                <div class="form-group">
                    <label for="mobile">Mobile Number</label>
                    <input type="text" id="mobile" required class="text-input">
                </div>
                <div class="form-group">
                    <label for="aadhar">Aadhar Number</label>
                    <input type="text" id="aadhar" required class="text-input">
                </div>
                <div class="form-group">
                    <label for="address">Physical Address</label>
                    <textarea id="address" required class="text-input"></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="button button-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="button button-primary">Register</button>
                </div>
            </form>
        </div>
    `;
    
    modal.querySelector('#signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const userData = {
                wallet_address: walletAddress,
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                mobile_number: document.getElementById('mobile').value,
                aadhar_number: document.getElementById('aadhar').value,
                physical_address: document.getElementById('address').value
            };

            await authService.registerUser(userData);
            closeModal();
            showToast('Registration successful!', 'success');
            
            // Trigger login
            window.app.handleLogin();
            
        } catch (error) {
            showToast('Registration failed: ' + error.message, 'error');
        }
    });
    
    document.body.appendChild(modal);
};

export const showTransferModal = (parcelId) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Request Land Transfer</h3>
                <button onclick="closeModal()" class="modal-close-button">×</button>
            </div>
            <form id="transfer-form">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Parcel ID</label>
                        <input type="text" value="${parcelId}" disabled class="text-input">
                    </div>
                    <div class="form-group">
                        <label for="to-address">Transfer To (Wallet Address)</label>
                        <input type="text" id="to-address" placeholder="0x..." required class="text-input">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="button button-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="button button-primary">Submit Request</button>
                </div>
            </form>
        </div>
    `;
    
    modal.querySelector('#transfer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const toAddress = document.getElementById('to-address').value;
            await transferService.requestTransfer({ parcelId, toAddress });
            
            closeModal();
            showToast('Transfer request submitted!', 'success');
            
        } catch (error) {
            showToast('Transfer request failed: ' + error.message, 'error');
        }
    });
    
    document.body.appendChild(modal);
};

export const showProofGenerationModal = (parcelId) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>🔐 Generate Shareable Proof</h3>
                <button onclick="closeModal()" class="modal-close-button">×</button>
            </div>
            <form id="proof-form">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Parcel ID</label>
                        <input type="text" value="${parcelId}" disabled class="text-input">
                    </div>
                    <div class="form-group">
                        <label for="proof-message">Message/Purpose (Optional)</label>
                        <textarea id="proof-message" class="text-input" rows="3" placeholder="e.g., 'Ownership verification for loan'"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="button button-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="button button-purple">Generate Proof</button>
                </div>
            </form>
            <div id="proof-result" style="display: none;"></div>
        </div>
    `;
    
    modal.querySelector('#proof-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = document.getElementById('proof-message').value;
        const resultDiv = document.getElementById('proof-result');
        const form = document.getElementById('proof-form');
        
        try {
            form.style.display = 'none';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<p style="text-align: center;">Generating proof...</p>';
            
            const { shareableProof } = await zkService.generateShareableProof({ parcelId, message });
            
            const proofJson = JSON.stringify(shareableProof, null, 2);
            resultDiv.innerHTML = `
                <h4 style="color: #059669;">✅ Proof Generated!</h4>
                <textarea readonly style="width: 100%; height: 200px; font-family: monospace; font-size: 0.75rem;" onclick="this.select()">${proofJson}</textarea>
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button onclick='copyToClipboard(\`${proofJson.replace(/`/g, '\\`')}\`)' class="button button-primary">
                        Copy
                    </button>
                    <button onclick="downloadProof(${parcelId}, \`${btoa(proofJson)}\`)" class="button button-secondary">
                        Download
                    </button>
                </div>
            `;
            
        } catch (error) {
            resultDiv.innerHTML = `<p style="color: red;">Failed to generate proof: ${error.message}</p>`;
        }
    });
    
    document.body.appendChild(modal);
};

export const showVerificationModal = () => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3>🔍 Verify Ownership Proof</h3>
                <button onclick="closeModal()" class="modal-close-button">×</button>
            </div>
            <div class="modal-body">
                <textarea id="proof-input" class="text-input" rows="10" placeholder="Paste the shareable proof JSON here..."></textarea>
                <button onclick="verifyProof()" class="button button-green" style="margin-top: 1rem;">Verify Proof</button>
                <div id="verification-result" style="margin-top: 1rem;"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

export const showBlockchainModal = async (parcelId, commitment) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>🔗 Blockchain Data</h3>
                <button onclick="closeModal()" class="modal-close-button">×</button>
            </div>
            <div class="modal-body" id="blockchain-content">
                <p style="text-align: center;">Loading blockchain data...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    try {
        const response = await fetch(`${API_URL}/api/blockchain/parcel/${parcelId}`, {
            headers: authService.getAuthHeaders()
        });
        
        const data = await response.json();
        
        document.getElementById('blockchain-content').innerHTML = `
            <div class="blockchain-data-grid">
                <div><strong>Parcel ID:</strong> ${data.parcelId}</div>
                <div><strong>Commitment:</strong> ${data.commitment}</div>
                <div><strong>Registration:</strong> ${new Date(data.registeredAt).toLocaleString()}</div>
            </div>
        `;
        
    } catch (error) {
        document.getElementById('blockchain-content').innerHTML = `
            <p style="color: red;">Failed to load blockchain data</p>
        `;
    }
};

// Make functions globally available
window.closeModal = closeModal;
window.copyToClipboard = copyToClipboard;
window.downloadProof = (parcelId, encodedProof) => {
    const proofData = atob(encodedProof);
    const blob = new Blob([proofData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ownership-proof-${parcelId}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

window.verifyProof = async () => {
    const proofInput = document.getElementById('proof-input').value.trim();
    const resultDiv = document.getElementById('verification-result');
    
    if (!proofInput) {
        resultDiv.innerHTML = '<p style="color: red;">Please paste proof data</p>';
        return;
    }
    
    try {
        const shareableProof = JSON.parse(proofInput);
        const result = await zkService.verifyShareableProof(shareableProof);
        
        resultDiv.innerHTML = `
            <div style="background: ${result.proofValid ? '#dcfce7' : '#fef2f2'}; padding: 1rem; border-radius: 0.5rem;">
                <h4>${result.proofValid ? '✅ Valid Proof' : '❌ Invalid Proof'}</h4>
                <p><strong>Parcel ID:</strong> ${result.parcelId}</p>
                <p><strong>Owner:</strong> ${result.prover}</p>
                <p><strong>Status:</strong> ${result.status}</p>
            </div>
        `;
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Verification failed: ${error.message}</p>`;
    }
};

export default {
    closeModal,
    showSignupModal,
    showTransferModal,
    showProofGenerationModal,
    showVerificationModal,
    showBlockchainModal
};