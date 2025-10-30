import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@/services/logger';
import type { EnvironmentConfig } from '@/config/environment';
import { getConfig, reloadConfig } from '@/config/environment';

const router = express.Router();
const CONFIG_FILE_PATH = path.join(process.cwd(), 'config.json');

// Helper para ler config.json
async function readConfigFile(): Promise<EnvironmentConfig | null> {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.warn('config_file_not_found', { path: CONFIG_FILE_PATH });
    return null;
  }
}

// Helper para salvar config.json
async function saveConfigFile(config: EnvironmentConfig): Promise<void> {
  try {
    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
    logger.info('config_file_saved', { path: CONFIG_FILE_PATH });
  } catch (error) {
    logger.error('config_file_save_error', { error, path: CONFIG_FILE_PATH });
    throw error;
  }
}

// GET /api/config - Obter configuração atual
router.get('/', async (req, res, next) => {
  try {
    const configFile = await readConfigFile();
    
    // Se não houver config.json, retorna a configuração atual carregada do .env
    if (!configFile) {
      logger.info('returning_current_config_from_env');
      return res.json({
        success: true,
        config: getConfig(),
        source: 'env' // Indica que está vindo do .env
      });
    }

    res.json({
      success: true,
      config: configFile,
      source: 'config.json' // Indica que está vindo do config.json
    });
  } catch (error) {
    logger.error('get_config_error', { error });
    next(error);
  }
});

// POST /api/config - Salvar nova configuração
router.post('/', async (req, res, next) => {
  try {
    const configData: Partial<EnvironmentConfig> = req.body;

    // Ler configuração existente ou criar nova
    const existingConfig = await readConfigFile();
    
    // Merge com configuração existente
    const newConfig: EnvironmentConfig = {
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
    
    // Recarrega a configuração em memória para aplicar imediatamente
    reloadConfig();
    
    logger.info('config_saved_and_reloaded', { configFile: CONFIG_FILE_PATH });

    res.json({
      success: true,
      message: 'Configuration saved and reloaded successfully. No server restart needed!',
      config: newConfig
    });
  } catch (error) {
    logger.error('save_config_error', { error });
    next(error);
  }
});

// POST /api/config/apply - Aplicar configuração (reiniciar servidor logicamente)
router.post('/apply', async (req, res, next) => {
  try {
    const config = await readConfigFile();
    
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'No configuration found. Please save configuration first.'
      });
    }

    // Recarrega a configuração
    reloadConfig();
    logger.info('config_applied', { config });

    res.json({
      success: true,
      message: 'Configuration reloaded successfully. Changes are now active!'
    });
  } catch (error) {
    logger.error('apply_config_error', { error });
    next(error);
  }
});

export default router;

