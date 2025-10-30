export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGIN: string;
  DATABASE_URL?: string | undefined;
  JWT_SECRET?: string | undefined;
  LOG_LEVEL: string;
  OPENAI_API_KEY: string;
}

export const config: EnvironmentConfig = {
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  PORT: parseInt(process.env['PORT'] || '3001', 10),
  CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:4200',
  DATABASE_URL: process.env['DATABASE_URL'],
  JWT_SECRET: process.env['JWT_SECRET'],
  LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
  OPENAI_API_KEY: process.env['OPENAI_API_KEY'] || ''
};
