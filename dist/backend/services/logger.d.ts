export declare const logger: {
    debug(event: string, data?: Record<string, unknown>): void;
    info(event: string, data?: Record<string, unknown>): void;
    warn(event: string, data?: Record<string, unknown>): void;
    error(event: string, data?: Record<string, unknown>): void;
};
export declare function reqSummary(method: string, url: string, status?: number, ms?: number): void;
export declare function writeRaw(prefix: string, content: string, extension?: string): void;
//# sourceMappingURL=logger.d.ts.map