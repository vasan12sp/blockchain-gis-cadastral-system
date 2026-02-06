import { loginTemplate } from '../ui/templates.js';
import authService from '../services/auth.service.js';
import storage from '../utils/storage.js';

export class LoginView {
    constructor() {
        this.container = document.getElementById('main-content');
    }

    render() {
        this.container.innerHTML = loginTemplate();
        this.attachEventListeners();
    }

    attachEventListeners() {
        const connectBtnMain = document.getElementById('connect-wallet-main');
        const verifyProofBtn = document.getElementById('verify-proof-btn');

        if (connectBtnMain) {
            connectBtnMain.onclick = () => this.handleConnectWallet();
        }

        if (verifyProofBtn) {
            verifyProofBtn.onclick = () => this.showVerificationTool();
        }
    }

    async handleConnectWallet() {
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) errorMessage.textContent = '';

        try {
            // Connect wallet
            const address = await authService.connectWallet();
            console.log('Connected:', address);

            // Request nonce
            const nonce = await authService.requestNonce(address);
            
            // Sign message
            const message = `Please sign this nonce: ${nonce}`;
            const signature = await authService.signMessage(message);

            // Verify signature and get token
            const { token, user } = await authService.verifySignature(address, signature);

            // Check if user exists
            const userData = await authService.checkUserExists(address);

            if (userData) {
                // User exists, login successful
                window.app.handleLoginSuccess(address, userData.name, userData.is_authority);
            } else {
                // New user, show signup form
                this.showSignupForm(address);
            }

        } catch (error) {
            console.error('Wallet connection failed:', error);
            if (errorMessage) {
                errorMessage.textContent = error.message;
            }
        }
    }

    showSignupForm(address) {
        // Import and show signup modal
        import('../ui/modals.js').then(({ showSignupModal }) => {
            showSignupModal(address);
        });
    }

    showVerificationTool() {
        import('../ui/modals.js').then(({ showVerificationModal }) => {
            showVerificationModal();
        });
    }
}

export default LoginView;