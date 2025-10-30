import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { SocketEvents, ScanProgressData, TestGenerationProgress, TestGenerationResult } from '../types/socket-events';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private readonly serverUrl = 'http://localhost:3000';

  constructor() {
    this.socket = io(this.serverUrl);
  }

  // Conectar ao servidor
  connect(): void {
    this.socket.connect();
  }

  // Desconectar do servidor
  disconnect(): void {
    this.socket.disconnect();
  }

  // Verificar se está conectado
  isConnected(): boolean {
    return this.socket.connected;
  }

  // Escanear diretório
  scanDirectory(directoryPath: string, options?: any): void {
    this.socket.emit('scan-directory', { directoryPath, options });
  }

  // Obter conteúdo do arquivo
  getFileContent(filePath: string): void {
    this.socket.emit('get-file-content', { filePath });
  }

  // Gerar testes
  generateTests(files: string[], options?: any): void {
    this.socket.emit('generate-tests', { files, options });
  }

  // Criar arquivo de teste
  createTestFile(filePath: string, content: string): void {
    this.socket.emit('create-test-file', { filePath, content });
  }

  // Executar teste
  executeTest(filePath: string, testCode: string, originalFilePath: string): void {
    console.log('📡 Frontend: Enviando execute-test', { filePath, originalFilePath, testCodeLength: testCode.length });
    this.socket.emit('execute-test', { filePath, testCode, originalFilePath });
  }

  // Executar todos os testes
  executeAllTests(projectPath: string): void {
    console.log('📡 Frontend: Enviando execute-all-tests', { projectPath });
    this.socket.emit('execute-all-tests', { projectPath });
  }

  // Corrigir erro de teste
  fixTestError(data: { 
    componentCode: string; 
    testCode: string; 
    errorMessage: string; 
    componentName: string; 
    filePath: string; 
  }): void {
    console.log('📡 [SOCKET] Enviando fix-test-error');
    console.log('📡 [SOCKET] FilePath:', data.filePath);
    console.log('📡 [SOCKET] ComponentName:', data.componentName);
    console.log('📡 [SOCKET] ComponentCode length:', data.componentCode.length);
    console.log('📡 [SOCKET] TestCode length:', data.testCode.length);
    console.log('📡 [SOCKET] ErrorMessage length:', data.errorMessage.length);
    console.log('📡 [SOCKET] Socket connected:', this.socket.connected);
    
    this.socket.emit('fix-test-error', data);
    
    console.log('✅ [SOCKET] Evento fix-test-error enviado com sucesso');
  }

  // Observables para eventos do servidor
  onScanStarted(): Observable<{ directoryPath: string }> {
    return new Observable(observer => {
      this.socket.on('scan-started', (data: { directoryPath: string }) => observer.next(data));
    });
  }

  onScanProgress(): Observable<ScanProgressData> {
    return new Observable(observer => {
      this.socket.on('scan-progress', (data: ScanProgressData) => observer.next(data));
    });
  }

  onScanCompleted(): Observable<{ result: any }> {
    return new Observable(observer => {
      this.socket.on('scan-completed', (data: { result: any }) => observer.next(data));
    });
  }

  onScanError(): Observable<{ error: string }> {
    return new Observable(observer => {
      this.socket.on('scan-error', (data: { error: string }) => observer.next(data));
    });
  }

  onFileContent(): Observable<{ filePath: string; content: string }> {
    return new Observable(observer => {
      this.socket.on('file-content', (data: { filePath: string; content: string }) => observer.next(data));
    });
  }

  onFileContentError(): Observable<{ filePath: string; error: string }> {
    return new Observable(observer => {
      this.socket.on('file-content-error', (data: { filePath: string; error: string }) => observer.next(data));
    });
  }

  onTestGenerationStarted(): Observable<{ files: string[] }> {
    return new Observable(observer => {
      this.socket.on('test-generation-started', (data: { files: string[] }) => observer.next(data));
    });
  }

  onTestGenerationProgress(): Observable<TestGenerationProgress> {
    return new Observable(observer => {
      this.socket.on('test-generation-progress', (data: TestGenerationProgress) => observer.next(data));
    });
  }

  onTestGenerated(): Observable<TestGenerationResult> {
    return new Observable(observer => {
      this.socket.on('test-generated', (data: TestGenerationResult) => observer.next(data));
    });
  }

  onTestGenerationCompleted(): Observable<{ results: TestGenerationResult[] }> {
    return new Observable(observer => {
      this.socket.on('test-generation-completed', (data: { results: TestGenerationResult[] }) => observer.next(data));
    });
  }

  onTestGenerationError(): Observable<{ error: string }> {
    return new Observable(observer => {
      this.socket.on('test-generation-error', (data: { error: string }) => observer.next(data));
    });
  }

  onConnection(): Observable<void> {
    return new Observable(observer => {
      this.socket.on('connect', () => observer.next());
    });
  }

  onDisconnection(): Observable<void> {
    return new Observable(observer => {
      this.socket.on('disconnect', () => observer.next());
    });
  }

  onTestFileCreated(): Observable<{ filePath: string; success: boolean }> {
    return new Observable(observer => {
      this.socket.on('test-file-created', (data: { filePath: string; success: boolean }) => observer.next(data));
    });
  }

  onTestFileError(): Observable<{ filePath: string; error: string }> {
    return new Observable(observer => {
      this.socket.on('test-file-error', (data: { filePath: string; error: string }) => observer.next(data));
    });
  }

  // Observables para execução de testes
  onTestExecutionStarted(): Observable<{ filePath: string; originalFilePath: string }> {
    return new Observable(observer => {
      this.socket.on('test-execution-started', (data: { filePath: string; originalFilePath: string }) => observer.next(data));
    });
  }

  onTestExecutionOutput(): Observable<{ filePath: string; originalFilePath: string; output: string }> {
    return new Observable(observer => {
      this.socket.on('test-execution-output', (data: { filePath: string; originalFilePath: string; output: string }) => observer.next(data));
    });
  }

  onTestExecutionCompleted(): Observable<{ filePath: string; originalFilePath: string; status: 'success' | 'error'; output: string }> {
    return new Observable(observer => {
      this.socket.on('test-execution-completed', (data: { filePath: string; originalFilePath: string; status: 'success' | 'error'; output: string }) => observer.next(data));
    });
  }

  onTestExecutionError(): Observable<{ filePath: string; originalFilePath: string; error: string }> {
    return new Observable(observer => {
      this.socket.on('test-execution-error', (data: { filePath: string; originalFilePath: string; error: string }) => observer.next(data));
    });
  }

  // Observables para execução de todos os testes
  onAllTestsOutput(): Observable<{ output: string }> {
    return new Observable(observer => {
      this.socket.on('all-tests-output', (data: { output: string }) => observer.next(data));
    });
  }

  onAllTestsCompleted(): Observable<{ success: boolean; output: string; exitCode?: number }> {
    return new Observable(observer => {
      this.socket.on('all-tests-completed', (data: { success: boolean; output: string; exitCode?: number }) => observer.next(data));
    });
  }

  onAllTestsError(): Observable<{ error: string }> {
    return new Observable(observer => {
      this.socket.on('all-tests-execution-error', (data: { error: string }) => observer.next(data));
    });
  }

  // Observables para correção de erros de teste
  onTestFixStarted(): Observable<{ filePath: string; componentName: string }> {
    return new Observable(observer => {
      this.socket.on('test-fix-started', (data: { filePath: string; componentName: string }) => observer.next(data));
    });
  }

  onTestFixed(): Observable<{ 
    filePath: string; 
    componentName: string; 
    fixedTest: { 
      testCode: string; 
      explanation: string; 
      testCases: string[]; 
      dependencies: string[]; 
      setupInstructions: string; 
    } 
  }> {
    return new Observable(observer => {
      this.socket.on('test-fixed', (data: { 
        filePath: string; 
        componentName: string; 
        fixedTest: { 
          testCode: string; 
          explanation: string; 
          testCases: string[]; 
          dependencies: string[]; 
          setupInstructions: string; 
        } 
      }) => observer.next(data));
    });
  }

  onTestFixError(): Observable<{ error: string }> {
    return new Observable(observer => {
      this.socket.on('test-fix-error', (data: { error: string }) => observer.next(data));
    });
  }
}
