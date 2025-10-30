"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestGenerationSocketService = void 0;
const angularComponentScanner_1 = require("./angularComponentScanner");
const chatgptService_1 = require("./chatgptService");
const jestExecutionService_1 = require("./jestExecutionService");
const fs_1 = require("fs");
class TestGenerationSocketService {
    constructor(io) {
        this.chatGPTService = null;
        this.io = io;
        this.angularScanner = new angularComponentScanner_1.AngularComponentScanner();
        this.jestExecutionService = new jestExecutionService_1.JestExecutionService();
        this.setupSocketHandlers();
    }
    getChatGPTService() {
        if (!this.chatGPTService) {
            this.chatGPTService = new chatgptService_1.ChatGPTService();
        }
        return this.chatGPTService;
    }
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            socket.on('scan-directory', async (data) => {
                await this.handleScanDirectory(socket, data);
            });
            socket.on('get-file-content', async (data) => {
                await this.handleGetFileContent(socket, data);
            });
            socket.on('generate-tests', async (data) => {
                await this.handleGenerateTests(socket, data);
            });
            socket.on('create-test-file', async (data) => {
                await this.handleCreateTestFile(socket, data);
            });
            socket.on('execute-test', async (data) => {
                await this.handleExecuteTest(socket, data);
            });
            socket.on('execute-all-tests', async (data) => {
                await this.handleExecuteAllTests(socket, data);
            });
            socket.on('fix-test-error', async (data) => {
                await this.handleFixTestError(socket, data);
            });
            socket.on('disconnect', () => {
            });
        });
    }
    async handleScanDirectory(socket, data) {
        try {
            socket.emit('scan-started', { directoryPath: data.directoryPath });
            const result = await this.angularScanner.scanDirectory(data.directoryPath, data.options);
            if (result.errors.length > 0) {
                socket.emit('scan-error', { error: `Erros encontrados: ${result.errors.length}` });
            }
            socket.emit('scan-completed', { result });
        }
        catch (error) {
            socket.emit('scan-error', {
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    async handleGetFileContent(socket, data) {
        try {
            const content = (0, fs_1.readFileSync)(data.filePath, 'utf-8');
            socket.emit('file-content', {
                filePath: data.filePath,
                content
            });
        }
        catch (error) {
            socket.emit('file-content-error', {
                filePath: data.filePath,
                error: error instanceof Error ? error.message : 'Erro ao ler arquivo'
            });
        }
    }
    async handleGenerateTests(socket, data) {
        try {
            socket.emit('test-generation-started', { files: data.files });
            const results = [];
            const totalFiles = data.files.length;
            for (let i = 0; i < data.files.length; i++) {
                const filePath = data.files[i];
                const progress = {
                    current: i + 1,
                    total: totalFiles,
                    currentFile: filePath,
                    percentage: Math.round(((i + 1) / totalFiles) * 100)
                };
                socket.emit('test-generation-progress', progress);
                try {
                    const fileContent = (0, fs_1.readFileSync)(filePath, 'utf-8');
                    const language = this.detectLanguage(filePath);
                    const framework = this.detectFramework(filePath, fileContent);
                    const unitTestRequest = {
                        code: fileContent,
                        language,
                        framework,
                        testType: 'unit',
                        additionalInstructions: this.getAdditionalInstructions(language, framework),
                        filePath: filePath
                    };
                    const testResult = await this.getChatGPTService().generateUnitTest(unitTestRequest);
                    const result = {
                        filePath,
                        testCode: testResult.testCode,
                        explanation: testResult.explanation,
                        testCases: testResult.testCases,
                        dependencies: testResult.dependencies || [],
                        setupInstructions: testResult.setupInstructions,
                        success: true
                    };
                    results.push(result);
                    socket.emit('test-generated', result);
                }
                catch (error) {
                    const result = {
                        filePath,
                        testCode: '',
                        explanation: '',
                        testCases: [],
                        dependencies: [],
                        success: false,
                        error: error instanceof Error ? error.message : 'Erro desconhecido'
                    };
                    results.push(result);
                    socket.emit('test-generated', result);
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            socket.emit('test-generation-completed', { results });
        }
        catch (error) {
            socket.emit('test-generation-error', {
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    detectLanguage(filePath) {
        if (filePath.endsWith('.ts'))
            return 'typescript';
        if (filePath.endsWith('.js'))
            return 'javascript';
        if (filePath.endsWith('.py'))
            return 'python';
        if (filePath.endsWith('.java'))
            return 'java';
        if (filePath.endsWith('.cs'))
            return 'csharp';
        return 'typescript';
    }
    detectFramework(filePath, content) {
        if (content.includes('@Component') && content.includes('angular'))
            return 'jest';
        if (content.includes('React') || content.includes('react'))
            return 'jest';
        if (content.includes('Vue') || content.includes('vue'))
            return 'jest';
        if (content.includes('@Test') && content.includes('junit'))
            return 'junit';
        if (content.includes('pytest') || content.includes('unittest'))
            return 'pytest';
        return 'jest';
    }
    getAdditionalInstructions(language, framework) {
        const instructions = {
            'typescript-jest': 'Gere testes para componentes Angular usando signals. Use TestBed.configureTestingModule com imports para componentes standalone.',
            'javascript-jest': 'Gere testes unitários completos com casos positivos e negativos.',
            'python-pytest': 'Gere testes usando pytest com fixtures quando apropriado.',
            'java-junit': 'Gere testes JUnit com anotações apropriadas.',
            'csharp': 'Gere testes usando NUnit ou MSTest.'
        };
        return instructions[`${language}-${framework}`] || 'Gere testes unitários completos e abrangentes.';
    }
    async handleCreateTestFile(socket, data) {
        try {
            const { filePath, content } = data;
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, content, 'utf8');
            socket.emit('test-file-created', {
                filePath,
                success: true
            });
        }
        catch (error) {
            socket.emit('test-file-error', {
                filePath: data.filePath,
                error: error instanceof Error ? error.message : 'Erro desconhecido ao criar arquivo'
            });
        }
    }
    async handleExecuteTest(socket, data) {
        try {
            const { filePath, testCode, originalFilePath } = data;
            socket.emit('test-execution-started', { filePath, originalFilePath });
            const projectPath = filePath.split('src')[0].slice(0, -1);
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            if (!fs.existsSync(filePath)) {
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(filePath, testCode, 'utf8');
            }
            const outputHandler = (d) => {
                if (d.testFilePath === filePath) {
                    socket.emit('test-execution-output', {
                        filePath: d.testFilePath,
                        originalFilePath,
                        output: d.output
                    });
                }
            };
            const completedHandler = (d) => {
                if (d.testFilePath === filePath) {
                    socket.emit('test-execution-completed', {
                        filePath: d.testFilePath,
                        originalFilePath,
                        status: d.success ? 'success' : 'error',
                        output: d.output
                    });
                }
            };
            const errorHandler = (d) => {
                if (d.testFilePath === filePath) {
                    socket.emit('test-execution-error', {
                        filePath: d.testFilePath,
                        originalFilePath,
                        error: d.error
                    });
                }
            };
            this.jestExecutionService.on('output', outputHandler);
            this.jestExecutionService.on('completed', completedHandler);
            this.jestExecutionService.on('error', errorHandler);
            const result = await this.jestExecutionService.executeTest({
                projectPath,
                testFilePath: filePath,
                timeout: 30000
            });
            this.jestExecutionService.off('output', outputHandler);
            this.jestExecutionService.off('completed', completedHandler);
            this.jestExecutionService.off('error', errorHandler);
        }
        catch (error) {
            socket.emit('test-execution-error', {
                filePath: data.filePath,
                originalFilePath: data.originalFilePath,
                error: error instanceof Error ? error.message : 'Erro desconhecido na execução'
            });
        }
    }
    async handleExecuteAllTests(socket, data) {
        try {
            const { projectPath } = data;
            if (!projectPath) {
                socket.emit('all-tests-execution-error', {
                    error: 'Caminho do projeto não fornecido'
                });
                return;
            }
            const outputHandler = (d) => {
                if (d.testFilePath === 'all-tests') {
                    socket.emit('all-tests-output', {
                        output: d.output
                    });
                }
            };
            const completedHandler = (d) => {
                if (d.testFilePath === 'all-tests') {
                    socket.emit('all-tests-completed', {
                        success: d.success,
                        output: d.output,
                        exitCode: d.exitCode
                    });
                }
            };
            const errorHandler = (d) => {
                if (d.testFilePath === 'all-tests') {
                    socket.emit('all-tests-execution-error', {
                        error: d.error
                    });
                }
            };
            this.jestExecutionService.on('output', outputHandler);
            this.jestExecutionService.on('completed', completedHandler);
            this.jestExecutionService.on('error', errorHandler);
            const result = await this.jestExecutionService.executeAllTests({
                projectPath,
                timeout: 60000
            });
            this.jestExecutionService.off('output', outputHandler);
            this.jestExecutionService.off('completed', completedHandler);
            this.jestExecutionService.off('error', errorHandler);
        }
        catch (error) {
            socket.emit('all-tests-execution-error', {
                error: error instanceof Error ? error.message : 'Erro desconhecido na execução'
            });
        }
    }
    async handleFixTestError(socket, data) {
        try {
            const { componentCode, testCode, errorMessage, componentName, filePath } = data;
            if (!componentCode || !testCode || !errorMessage) {
                console.error('Dados insuficientes para correção');
                socket.emit('test-fix-error', {
                    error: 'Dados insuficientes para correção do teste'
                });
                return;
            }
            socket.emit('test-fix-started', {
                filePath,
                componentName
            });
            const chatGPTService = this.getChatGPTService();
            const fixedTest = await chatGPTService.fixUnitTestError({
                componentCode,
                testCode,
                errorMessage,
                componentName,
                filePath
            });
            socket.emit('test-fixed', {
                filePath,
                componentName,
                fixedTest: {
                    testCode: fixedTest.testCode,
                    explanation: fixedTest.explanation,
                    testCases: fixedTest.testCases,
                    dependencies: fixedTest.dependencies,
                    setupInstructions: fixedTest.setupInstructions
                }
            });
        }
        catch (error) {
            socket.emit('test-fix-error', {
                error: error instanceof Error ? error.message : 'Erro desconhecido na correção'
            });
        }
    }
}
exports.TestGenerationSocketService = TestGenerationSocketService;
//# sourceMappingURL=testGenerationSocketService.js.map