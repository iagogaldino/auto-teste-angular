"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JestExecutionService = void 0;
const events_1 = require("events");
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_1 = require("fs");
const logger_1 = require("./logger");
class JestExecutionService extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.activeProcesses = new Map();
    }
    findProjectRoot(startPath) {
        let currentPath = (0, path_1.resolve)(startPath);
        const rootPath = (0, path_1.resolve)('/');
        while (currentPath !== rootPath) {
            const packageJsonPath = (0, path_1.join)(currentPath, 'package.json');
            if ((0, fs_1.existsSync)(packageJsonPath)) {
                logger_1.logger.debug('jest_pkg_found', { path: currentPath });
                return currentPath;
            }
            currentPath = (0, path_1.dirname)(currentPath);
        }
        throw new Error(`package.json não encontrado em nenhum diretório pai de: ${startPath}`);
    }
    async executeTest(options) {
        const { projectPath, testFilePath, timeout = 30000 } = options;
        try {
            if (!(0, fs_1.existsSync)(testFilePath)) {
                throw new Error(`Arquivo de teste não encontrado: ${testFilePath}`);
            }
            if (!(0, fs_1.existsSync)(projectPath)) {
                throw new Error(`Diretório do projeto não encontrado: ${projectPath}`);
            }
            const actualProjectPath = this.findProjectRoot(projectPath);
            logger_1.logger.info('jest_run_start', { cwd: actualProjectPath, file: testFilePath });
            const processKey = testFilePath;
            if (this.activeProcesses.has(processKey)) {
                const existingProcess = this.activeProcesses.get(processKey);
                if (existingProcess && !existingProcess.killed) {
                    existingProcess.kill('SIGTERM');
                }
                this.activeProcesses.delete(processKey);
            }
            const jestProcess = (0, child_process_1.spawn)('npx', ['jest', testFilePath, '--verbose', '--no-cache'], {
                cwd: actualProjectPath,
                stdio: 'pipe',
                shell: true,
                env: { ...process.env, NODE_ENV: 'test' }
            });
            this.activeProcesses.set(processKey, jestProcess);
            let output = '';
            let errorOutput = '';
            this.emit('output', {
                testFilePath,
                output: `Executando: ${testFilePath} em ${actualProjectPath}\n`
            });
            jestProcess.stdout?.on('data', (data) => {
                const chunk = data.toString();
                output += chunk;
                this.emit('output', {
                    testFilePath,
                    output: chunk
                });
            });
            jestProcess.stderr?.on('data', (data) => {
                const chunk = data.toString();
                errorOutput += chunk;
                this.emit('output', {
                    testFilePath,
                    output: chunk
                });
            });
            const timeoutId = setTimeout(() => {
                if (!jestProcess.killed) {
                    jestProcess.kill('SIGTERM');
                    this.emit('error', {
                        testFilePath,
                        error: 'Timeout na execução do teste'
                    });
                }
            }, timeout);
            return new Promise((resolve) => {
                jestProcess.on('close', (code) => {
                    clearTimeout(timeoutId);
                    this.activeProcesses.delete(processKey);
                    const fullOutput = output + errorOutput;
                    const success = code === 0;
                    logger_1.logger.info('jest_run_done', { code, success, preview: fullOutput.substring(0, 200) });
                    this.emit('completed', {
                        testFilePath,
                        success,
                        output: fullOutput,
                        exitCode: code
                    });
                    resolve({
                        success,
                        output: fullOutput,
                        exitCode: code ?? undefined,
                        error: success ? undefined : `Teste falhou com código ${code}`
                    });
                });
                jestProcess.on('error', (error) => {
                    clearTimeout(timeoutId);
                    this.activeProcesses.delete(processKey);
                    logger_1.logger.error('jest_run_proc_error', { error: error instanceof Error ? error.message : 'unknown' });
                    this.emit('error', {
                        testFilePath,
                        error: error.message
                    });
                    resolve({
                        success: false,
                        output: errorOutput,
                        error: error.message
                    });
                });
            });
        }
        catch (error) {
            logger_1.logger.error('jest_run_error', { error: error instanceof Error ? error.message : 'unknown' });
            this.emit('error', {
                testFilePath,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
    cancelTest(testFilePath) {
        const process = this.activeProcesses.get(testFilePath);
        if (process && !process.killed) {
            process.kill('SIGTERM');
            this.activeProcesses.delete(testFilePath);
            return true;
        }
        return false;
    }
    cancelAllTests() {
        for (const [testFilePath, process] of this.activeProcesses) {
            if (!process.killed) {
                process.kill('SIGTERM');
            }
        }
        this.activeProcesses.clear();
    }
    hasActiveTests() {
        return this.activeProcesses.size > 0;
    }
    getActiveTests() {
        return Array.from(this.activeProcesses.keys());
    }
    async executeAllTests(options) {
        const { projectPath, timeout = 60000 } = options;
        try {
            if (!(0, fs_1.existsSync)(projectPath)) {
                throw new Error(`Diretório do projeto não encontrado: ${projectPath}`);
            }
            const actualProjectPath = this.findProjectRoot(projectPath);
            logger_1.logger.info('jest_all_start', { cwd: actualProjectPath });
            const processKey = 'all-tests';
            if (this.activeProcesses.has(processKey)) {
                const existingProcess = this.activeProcesses.get(processKey);
                if (existingProcess && !existingProcess.killed) {
                    existingProcess.kill('SIGTERM');
                }
                this.activeProcesses.delete(processKey);
            }
            const jestProcess = (0, child_process_1.spawn)('jest', ['--verbose', '--no-cache'], {
                cwd: actualProjectPath,
                stdio: 'pipe',
                shell: true,
                env: { ...process.env, NODE_ENV: 'test' }
            });
            this.activeProcesses.set(processKey, jestProcess);
            let output = '';
            let errorOutput = '';
            this.emit('output', {
                testFilePath: 'all-tests',
                output: `Executando todos os testes com Jest diretamente em: ${actualProjectPath}\n`
            });
            jestProcess.stdout?.on('data', (data) => {
                const chunk = data.toString();
                output += chunk;
                this.emit('output', {
                    testFilePath: 'all-tests',
                    output: chunk
                });
            });
            jestProcess.stderr?.on('data', (data) => {
                const chunk = data.toString();
                errorOutput += chunk;
                this.emit('output', {
                    testFilePath: 'all-tests',
                    output: chunk
                });
            });
            const timeoutId = setTimeout(() => {
                if (!jestProcess.killed) {
                    jestProcess.kill('SIGTERM');
                    this.emit('error', {
                        testFilePath: 'all-tests',
                        error: 'Timeout na execução dos testes'
                    });
                }
            }, timeout);
            return new Promise((resolve) => {
                jestProcess.on('close', (code) => {
                    clearTimeout(timeoutId);
                    this.activeProcesses.delete(processKey);
                    const fullOutput = output + errorOutput;
                    const success = code === 0;
                    logger_1.logger.info('jest_all_done', { code, success, preview: fullOutput.substring(0, 200) });
                    this.emit('completed', {
                        testFilePath: 'all-tests',
                        success,
                        output: fullOutput,
                        exitCode: code
                    });
                    resolve({
                        success,
                        output: fullOutput,
                        exitCode: code ?? undefined,
                        error: success ? undefined : `Testes falharam com código ${code}`
                    });
                });
                jestProcess.on('error', (error) => {
                    clearTimeout(timeoutId);
                    this.activeProcesses.delete(processKey);
                    logger_1.logger.error('jest_all_proc_error', { error: error instanceof Error ? error.message : 'unknown' });
                    this.emit('error', {
                        testFilePath: 'all-tests',
                        error: error.message
                    });
                    resolve({
                        success: false,
                        output: errorOutput,
                        error: error.message
                    });
                });
            });
        }
        catch (error) {
            logger_1.logger.error('jest_all_error', { error: error instanceof Error ? error.message : 'unknown' });
            this.emit('error', {
                testFilePath: 'all-tests',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
}
exports.JestExecutionService = JestExecutionService;
//# sourceMappingURL=jestExecutionService.js.map