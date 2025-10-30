export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGIN: string;
  DATABASE_URL?: string | undefined;
  JWT_SECRET?: string | undefined;
  LOG_LEVEL: string;
  OPENAI_API_KEY: string;
  AI_PROVIDER: 'openai' | 'stackspot';
  STACKSPOT_CLIENT_ID?: string;
  STACKSPOT_CLIENT_KEY?: string;
  STACKSPOT_REALM?: string;
  STACKSPOT_TOKEN_URL?: string;
  STACKSPOT_USER_AGENT?: string;
  STACKSPOT_COMPLETIONS_URL?: string;
  STACKSPOT_AGENT_CHAT_URL?: string;
}

export const config: EnvironmentConfig = {
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  PORT: parseInt(process.env['PORT'] || '3001', 10),
  CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:4200',
  DATABASE_URL: process.env['DATABASE_URL'],
  JWT_SECRET: process.env['JWT_SECRET'],
  LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
  OPENAI_API_KEY: process.env['OPENAI_API_KEY'] || '',
  AI_PROVIDER: (process.env['AI_PROVIDER'] as 'openai' | 'stackspot') || 'openai',
  STACKSPOT_CLIENT_ID: process.env['STACKSPOT_CLIENT_ID'],
  STACKSPOT_CLIENT_KEY: process.env['STACKSPOT_CLIENT_KEY'],
  STACKSPOT_REALM: process.env['STACKSPOT_REALM'],
  STACKSPOT_TOKEN_URL: process.env['STACKSPOT_TOKEN_URL'],
  STACKSPOT_USER_AGENT: process.env['STACKSPOT_USER_AGENT'] || 'AutoUnitTest/1.0 (+backend)',
  STACKSPOT_COMPLETIONS_URL: process.env['STACKSPOT_COMPLETIONS_URL'],
  STACKSPOT_AGENT_CHAT_URL: process.env['STACKSPOT_AGENT_CHAT_URL']
};
