import { formatAddress, formatDate } from '../utils/formatting.js';

export const loginTemplate = () => `
    <div class="login-view">
        <h2>Secure & Transparent Land Management</h2>
        <p>Connect your MetaMask wallet to manage your land parcels or review pending transactions.</p>
        <button id="connect-wallet-main" class="button button-primary">Connect Wallet</button>
        
        <div style="margin: 2rem 0; text-align: center;">
            <div style="display: inline-block; width: 100%; max-width: 400px; border-top: 1px solid #e5e7eb; padding-top: 2rem;">
                <h3 style="margin-bottom: 1rem; color: #6b7280; font-size: 1rem;">Already have a proof?</h3>
                <button id="verify-proof-btn" class="button button-green" style="width: 100%;">
                    🔍 Verify Land Ownership Proof
                </button>
                <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #9ca3af;">
                    Verify a shareable proof without connecting wallet
                </p>
            </div>
        </div>
        
        <p id="error-message" class="error-message"></p>
    </div>
`;

export const userDashboardTemplate = (userName) => `
    <div class="dashboard-container">
        <div class="welcome-message">
            <h2>Welcome, ${userName}!</h2>
            <p>Below are your currently held land parcels.</p>
        </div>
        <div id="land-card-grid" class="card-grid"></div>
    </div>
`;

export const parcelCardTemplate = (parcel) => `
    <div class="land-card ${parcel.blockchain_verified ? 'verified' : 'unverified'}" data-parcel-id="${parcel.parcel_id}">
        <div class="land-card-content">
            <h3>Parcel ID: ${parcel.parcel_id}</h3>
            <p class="mono-font" style="font-size: 0.8rem;">
                Commitment: ${parcel.commitment_hash.substring(0,12)}...
            </p>
            ${parcel.blockchain_verified ? 
                '<p style="color: #16a34a; font-size: 0.9rem; margin-top: 0.5rem;">✓ Blockchain Verified</p>' :
                '<p style="color: #dc2626; font-size: 0.9rem; margin-top: 0.5rem;">❌ Verification Failed</p>'
            }
        </div>
        <div class="land-card-footer">
            ${parcel.blockchain_verified ? 'View Details & Map' : 'Verification Required'}
        </div>
    </div>
`;

export const parcelDetailsTemplate = (parcel) => `
    <div class="dashboard-container">
        <button class="back-button" id="back-to-parcels">
            <svg style="height: 1.25rem; width: 1.25rem;" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Back to My Parcels
        </button>
        
        <div class="land-detail-container">
            <div id="map"></div>
            <div class="land-detail-content">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                    <div>
                        <h2>Parcel ID: ${parcel.parcelId}</h2>
                        <p style="color: #6b7280;">Registered Land Parcel</p>
                    </div>
                    <div style="text-align: right;">
                        ${parcel.blockchain.exists ? 
                            '<span style="background: #dcfce7; color: #166534; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600;">✓ Blockchain Verified</span>' :
                            '<span style="background: #fef3c7; color: #92400e; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600;">⚠ Verification Pending</span>'
                        }
                    </div>
                </div>
                
                <div class="parcel-info-grid">
                    <div class="parcel-info-item">
                        <h4>Owner Information</h4>
                        <p class="address">${formatAddress(parcel.owner_address)}</p>
                    </div>
                    
                    <div class="parcel-info-item">
                        <h4>Registration Date</h4>
                        <p class="date">${formatDate(parcel.created_at)}</p>
                    </div>
                    
                    <div class="parcel-info-item">
                        <h4>IPFS Storage</h4>
                        <p class="ipfs">${parcel.ipfs_cid_encrypted}</p>
                    </div>
                </div>
                
                <div class="land-detail-actions">
                    <button class="button button-secondary" data-action="download">
                        📄 Download Land Certificate
                    </button>
                    <button class="button button-primary" data-action="transfer">
                        🔄 Request Transfer
                    </button>
                    <button class="button button-green" data-action="blockchain">
                        🔗 View on Blockchain
                    </button>
                    <button class="button button-purple" data-action="generate-proof">
                        🔐 Generate Shareable Proof
                    </button>
                </div>
            </div>
        </div>
    </div>
`;

export default {
    loginTemplate,
    userDashboardTemplate,
    parcelCardTemplate,
    parcelDetailsTemplate
};