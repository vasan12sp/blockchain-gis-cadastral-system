import { userDashboardTemplate, parcelCardTemplate } from '../ui/templates.js';
import parcelService from '../services/parcel.service.js';
import { formatAddress } from '../utils/formatting.js';

export class UserDashboardView {
    constructor(userName) {
        this.userName = userName;
        this.container = document.getElementById('main-content');
    }

    async render() {
        this.container.innerHTML = userDashboardTemplate(this.userName);
        await this.loadParcels();
    }

    async loadParcels() {
        const landCardGrid = document.getElementById('land-card-grid');
        if (!landCardGrid) return;

        landCardGrid.innerHTML = '<p>Loading your land holdings...</p>';

        try {
            const { parcels } = await parcelService.getMyParcels();
            
            landCardGrid.innerHTML = '';

            if (parcels && parcels.length > 0) {
                parcels.forEach(parcel => {
                    const card = this.createParcelCard(parcel);
                    landCardGrid.appendChild(card);
                });
            } else {
                landCardGrid.innerHTML = this.getEmptyStateHTML();
            }

        } catch (error) {
            console.error('Failed to load parcels:', error);
            landCardGrid.innerHTML = `
                <p class="error-message">Could not load your land holdings. Please try again.</p>
            `;
        }
    }

    createParcelCard(parcel) {
        const card = document.createElement('div');
        card.className = 'land-card';
        
        if (parcel.blockchain_verified) {
            card.onclick = () => this.showParcelDetails(parcel.parcel_id);
            card.style.cursor = 'pointer';
        } else {
            card.style.opacity = '0.6';
            card.style.cursor = 'not-allowed';
        }
        
        card.innerHTML = parcelCardTemplate(parcel);
        return card;
    }

    showParcelDetails(parcelId) {
        import('./parcel-details.view.js').then(({ ParcelDetailsView }) => {
            const detailsView = new ParcelDetailsView(parcelId);
            detailsView.render();
        });
    }

    getEmptyStateHTML() {
        return `
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <h3>No Land Parcels Found</h3>
                <p style="color: #6b7280; margin: 1rem 0;">You don't currently own any registered land parcels.</p>
                <p style="font-size: 0.9rem; color: #9ca3af;">Land parcels must be registered by an authorized authority before they appear here.</p>
            </div>
        `;
    }
}

export default UserDashboardView;