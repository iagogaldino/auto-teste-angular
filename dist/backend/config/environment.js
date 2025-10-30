"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.getConfig = getConfig;
exports.reloadConfig = reloadConfig;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
function loadConfig() {
    const CONFIG_FILE_PATH = path_1.default.join(process.cwd(), 'config.json');
    if ((0, fs_1.existsSync)(CONFIG_FILE_PATH)) {
        try {
            const configData = (0, fs_1.readFileSync)(CONFIG_FILE_PATH, 'utf-8');
            const config = JSON.parse(configData);
            console.log('[Config] Loaded from config.json');
            return config;
        }
        catch (error) {
            console.warn('[Config] Error reading config.json, falling back to .env:', error);
        }
    }
    console.log('[Config] Using .env file');
    return {
        NODE_ENV: process.env['NODE_ENV'] || 'development',
        PORT: parseInt(process.env['PORT'] || '3001', 10),
        CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:4200',
        DATABASE_URL: process.env['DATABASE_URL'],
        JWT_SECRET: process.env['JWT_SECRET'],
        LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
        OPENAI_API_KEY: process.env['OPENAI_API_KEY'] || '',
        AI_PROVIDER: process.env['AI_PROVIDER'] || 'openai',
        STACKSPOT_CLIENT_ID: process.env['STACKSPOT_CLIENT_ID'],
        STACKSPOT_CLIENT_KEY: process.env['STACKSPOT_CLIENT_KEY'],
        STACKSPOT_REALM: process.env['STACKSPOT_REALM'],
        STACKSPOT_TOKEN_URL: process.env['STACKSPOT_TOKEN_URL'],
        STACKSPOT_USER_AGENT: process.env['STACKSPOT_USER_AGENT'] || 'DelsucTest/1.0 (+backend)',
        STACKSPOT_COMPLETIONS_URL: process.env['STACKSPOT_COMPLETIONS_URL'],
        STACKSPOT_AGENT_CHAT_URL: process.env['STACKSPOT_AGENT_CHAT_URL']
    };
}
let cachedConfig = null;
function getConfig() {
    if (cachedConfig) {
        return cachedConfig;
    }
    cachedConfig = loadConfig();
    return cachedConfig;
}
function reloadConfig() {
    cachedConfig = null;
    return getConfig();
}
exports.config = getConfig();
//# sourceMappingURL=environment.js.map