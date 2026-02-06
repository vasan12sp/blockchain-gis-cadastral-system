import ZKProofSystem from '../zk/zkProofSystem.js';
import { config } from '../config/environment.js';
import logger from '../utils/logger.js';

export let zkSystem = null;

// Initialize ZK system
(async () => {
    try {
        if (config.zk.setup) {
            logger.info('Initializing ZK proof system...');
            zkSystem = new ZKProofSystem();
            await zkSystem.setup();
            logger.success('✅ ZK proof system initialized successfully');
        } else {
            logger.warn('⚠️ ZK system disabled (ZK_SETUP=false in .env)');
        }
    } catch (error) {
        logger.error('❌ Failed to initialize ZK system:', error);
        zkSystem = null;
    }
})();

export default { zkSystem };