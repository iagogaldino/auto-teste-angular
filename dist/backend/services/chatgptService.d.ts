import { UnitTestRequest, UnitTestResponse } from '../types/chatgpt';
export declare class ChatGPTService {
    private readonly model;
    private readonly temperature;
    private readonly maxTokens;
    private readonly provider;
    private aiProvider;
    constructor();
    generateUnitTest(request: UnitTestRequest): Promise<UnitTestResponse>;
    private callChatGPT;
    private buildSystemPrompt;
    private buildUserPrompt;
    private parseUnitTestResponse;
    private normalizeAiResponse;
    fixUnitTestError(request: {
        componentCode: string;
        testCode: string;
        errorMessage: string;
        componentName: string;
        filePath: string;
    }): Promise<UnitTestResponse>;
    private buildFixErrorSystemPrompt;
    private buildFixErrorUserPrompt;
    private parseFixErrorResponse;
    private fixUnclosedBlocks;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=chatgptService.d.ts.map