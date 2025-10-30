import { EventEmitter } from 'events';
export interface JestExecutionOptions {
    projectPath: string;
    testFilePath: string;
    timeout?: number;
}
export interface JestAllTestsOptions {
    projectPath: string;
    timeout?: number;
}
export interface JestExecutionResult {
    success: boolean;
    output: string;
    exitCode?: number;
    error?: string;
}
export declare class JestExecutionService extends EventEmitter {
    private activeProcesses;
    private findProjectRoot;
    executeTest(options: JestExecutionOptions): Promise<JestExecutionResult>;
    cancelTest(testFilePath: string): boolean;
    cancelAllTests(): void;
    hasActiveTests(): boolean;
    getActiveTests(): string[];
    executeAllTests(options: JestAllTestsOptions): Promise<JestExecutionResult>;
}
//# sourceMappingURL=jestExecutionService.d.ts.map