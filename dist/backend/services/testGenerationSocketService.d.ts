import { Server as SocketIOServer } from 'socket.io';
export declare class TestGenerationSocketService {
    private io;
    private chatGPTService;
    private angularScanner;
    private jestExecutionService;
    constructor(io: SocketIOServer);
    private getChatGPTService;
    private setupSocketHandlers;
    private handleScanDirectory;
    private handleGetFileContent;
    private handleGenerateTests;
    private detectLanguage;
    private detectFramework;
    private getAdditionalInstructions;
    private handleCreateTestFile;
    private handleExecuteTest;
    private handleExecuteAllTests;
    private handleFixTestError;
}
//# sourceMappingURL=testGenerationSocketService.d.ts.map