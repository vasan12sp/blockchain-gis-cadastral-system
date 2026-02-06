import { LoginView } from './views/login.view.js';
import { UserDashboardView } from './views/user-dashboard.view.js';
import { AuthorityDashboardView } from './views/authority-dashboard.view.js';
import authService from './services/auth.service.js';
import storage from './utils/storage.js';
import { showToast } from './ui/components.js';

class App {
    constructor() {
        this.currentUser = null;
        this.currentView = null;
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Cadastral System...');
        
        // Try to restore session
        await this.restoreSession();
        
        // Setup MetaMask listeners
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (this.currentUser && accounts[0]?.toLowerCase() !== this.currentUser.address) {
                    this.handleLogout();
                }
            });
        }
        
        // Render initial view
        this.render();
    }

    async restoreSession() {
        const token = storage.getToken();
        const address = storage.getUserAddress();
        
        if (token && address) {
            try {
                const userData = await authService.verifyToken(token);
                if (userData) {
                    this.currentUser = {
                        address,
                        name: userData.name,
                        isAuthority: userData.is_authority
                    };
                    console.log('✅ Session restored:', this.currentUser.name);
                }
            } catch (error) {
                console.log('⚠️ Session expired');
                storage.clear();
            }
        }
    }

    render() {
        this.updateHeader();
        
        if (!this.currentUser) {
            this.currentView = new LoginView();
        } else if (this.currentUser.isAuthority) {
            this.currentView = new AuthorityDashboardView();
        } else {
            this.currentView = new UserDashboardView(this.currentUser.name);
        }
        
        this.currentView.render();
    }

    updateHeader() {
        const authSection = document.getElementById('auth-section');
        
        if (this.currentUser) {
            const shortAddress = `${this.currentUser.address.substring(0, 6)}...${this.currentUser.address.substring(this.currentUser.address.length - 4)}`;
            
            authSection.innerHTML = `
                <div class="wallet-info">
                    <a href="#" onclick="window.app.showVerificationTool(); return false;" class="verification-link" style="margin-right: 1rem;">
                        🔍 Verify Proof
                    </a>
                    <span class="wallet-address">${shortAddress}</span>
                    ${this.currentUser.isAuthority ? '<span class="authority-badge">AUTHORITY</span>' : ''}
                    <button id="disconnect-btn" class="button button-danger">Disconnect</button>
                </div>
            `;
            
            document.getElementById('disconnect-btn').onclick = () => this.handleLogout();
        } else {
            authSection.innerHTML = `
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <a href="#" onclick="window.app.showVerificationTool(); return false;" class="verification-link">
                        🔍 Verify Proof
                    </a>
                    <button id="connect-wallet-header" class="button button-primary">Connect Wallet</button>
                </div>
            `;
            
            document.getElementById('connect-wallet-header').onclick = () => this.handleLogin();
        }
    }

    async handleLogin() {
        // Delegate to LoginView
        if (this.currentView instanceof LoginView) {
            await this.currentView.handleConnectWallet();
        }
    }

    handleLoginSuccess(address, name, isAuthority) {
        this.currentUser = { address, name, isAuthority };
        showToast(`Welcome, ${name}!`, 'success');
        this.render();
    }

    handleLogout() {
        authService.logout();
        this.currentUser = null;
        showToast('Disconnected successfully', 'info');
        this.render();
    }

    showDashboard() {
        this.render();
    }

    showVerificationTool() {
        import('./ui/modals.js').then(({ showVerificationModal }) => {
            showVerificationModal();
        });
    }
}

// Initialize app
const app = new App();

// Make app globally available
window.app = app;

console.log('✅ Application loaded successfully');