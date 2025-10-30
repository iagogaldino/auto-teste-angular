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
export declare function getConfig(): EnvironmentConfig;
export declare function reloadConfig(): EnvironmentConfig;
export declare const config: EnvironmentConfig;
//# sourceMappingURL=environment.d.ts.map