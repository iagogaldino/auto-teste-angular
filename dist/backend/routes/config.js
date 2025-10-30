"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../services/logger");
const environment_1 = require("../config/environment");
const router = express_1.default.Router();
const CONFIG_FILE_PATH = path_1.default.join(process.cwd(), 'config.json');
async function readConfigFile() {
    try {
        const data = await fs_1.promises.readFile(CONFIG_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        logger_1.logger.warn('config_file_not_found', { path: CONFIG_FILE_PATH });
        return null;
    }
}
async function saveConfigFile(config) {
    try {
        await fs_1.promises.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
        logger_1.logger.info('config_file_saved', { path: CONFIG_FILE_PATH });
    }
    catch (error) {
        logger_1.logger.error('config_file_save_error', { error, path: CONFIG_FILE_PATH });
        throw error;
    }
}
router.get('/', async (req, res, next) => {
    try {
        const configFile = await readConfigFile();
        if (!configFile) {
            logger_1.logger.info('returning_current_config_from_env');
            return res.json({
                success: true,
                config: (0, environment_1.getConfig)(),
                source: 'env'
            });
        }
        res.json({
            success: true,
            config: configFile,
            source: 'config.json'
        });
    }
    catch (error) {
        logger_1.logger.error('get_config_error', { error });
        next(error);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const configData = req.body;
        const existingConfig = await readConfigFile();
        const newConfig = {
            NODE_ENV: configData.NODE_ENV || existingConfig?.NODE_ENV || 'development',
            PORT: configData.PORT || existingConfig?.PORT || 3000,
            CORS_ORIGIN: configData.CORS_ORIGIN || existingConfig?.CORS_ORIGIN || 'http://localhost:4200',
            DATABASE_URL: configData.DATABASE_URL || existingConfig?.DATABASE_URL,
            JWT_SECRET: configData.JWT_SECRET || existingConfig?.JWT_SECRET,
            LOG_LEVEL: configData.LOG_LEVEL || existingConfig?.LOG_LEVEL || 'info',
            OPENAI_API_KEY: configData.OPENAI_API_KEY || existingConfig?.OPENAI_API_KEY || '',
            AI_PROVIDER: configData.AI_PROVIDER || existingConfig?.AI_PROVIDER || 'openai',
            STACKSPOT_CLIENT_ID: configData.STACKSPOT_CLIENT_ID || existingConfig?.STACKSPOT_CLIENT_ID,
            STACKSPOT_CLIENT_KEY: configData.STACKSPOT_CLIENT_KEY || existingConfig?.STACKSPOT_CLIENT_KEY,
            STACKSPOT_REALM: configData.STACKSPOT_REALM || existingConfig?.STACKSPOT_REALM,
            STACKSPOT_TOKEN_URL: configData.STACKSPOT_TOKEN_URL || existingConfig?.STACKSPOT_TOKEN_URL,
            STACKSPOT_USER_AGENT: configData.STACKSPOT_USER_AGENT || existingConfig?.STACKSPOT_USER_AGENT,
            STACKSPOT_COMPLETIONS_URL: configData.STACKSPOT_COMPLETIONS_URL || existingConfig?.STACKSPOT_COMPLETIONS_URL,
            STACKSPOT_AGENT_CHAT_URL: configData.STACKSPOT_AGENT_CHAT_URL || existingConfig?.STACKSPOT_AGENT_CHAT_URL
        };
        await saveConfigFile(newConfig);
        (0, environment_1.reloadConfig)();
        logger_1.logger.info('config_saved_and_reloaded', { configFile: CONFIG_FILE_PATH });
        res.json({
            success: true,
            message: 'Configuration saved and reloaded successfully. No server restart needed!',
            config: newConfig
        });
    }
    catch (error) {
        logger_1.logger.error('save_config_error', { error });
        next(error);
    }
});
router.post('/apply', async (req, res, next) => {
    try {
        const config = await readConfigFile();
        if (!config) {
            return res.status(400).json({
                success: false,
                message: 'No configuration found. Please save configuration first.'
            });
        }
        (0, environment_1.reloadConfig)();
        logger_1.logger.info('config_applied', { config });
        res.json({
            success: true,
            message: 'Configuration reloaded successfully. Changes are now active!'
        });
    }
    catch (error) {
        logger_1.logger.error('apply_config_error', { error });
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=config.js.map