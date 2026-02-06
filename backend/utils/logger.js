import { config } from '../config/environment.js';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const formatMessage = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    let formattedMsg = `[${timestamp}] [${level}] ${message}`;
    
    if (data && config.nodeEnv === 'development') {
        formattedMsg += `\n${JSON.stringify(data, null, 2)}`;
    }
    
    return formattedMsg;
};

export const logger = {
    info: (message, data = null) => {
        console.log(`${colors.cyan}${formatMessage('INFO', message, data)}${colors.reset}`);
    },
    
    success: (message, data = null) => {
        console.log(`${colors.green}${formatMessage('SUCCESS', message, data)}${colors.reset}`);
    },
    
    warn: (message, data = null) => {
        console.warn(`${colors.yellow}${formatMessage('WARN', message, data)}${colors.reset}`);
    },
    
    error: (message, error = null) => {
        const errorData = error ? {
            message: error.message,
            stack: config.nodeEnv === 'development' ? error.stack : undefined
        } : null;
        
        console.error(`${colors.red}${formatMessage('ERROR', message, errorData)}${colors.reset}`);
    },
    
    debug: (message, data = null) => {
        if (config.nodeEnv === 'development') {
            console.log(`${colors.magenta}${formatMessage('DEBUG', message, data)}${colors.reset}`);
        }
    }
};

export default logger;