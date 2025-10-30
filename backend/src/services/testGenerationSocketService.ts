import { Server as SocketIOServer } from 'socket.io';
import { AngularComponentScanner } from './angularComponentScanner';
import { ChatGPTService } from './chatgptService';
import { JestExecutionService } from './jestExecutionService';
import { SocketEvents, ScanProgressData, TestGenerationProgress, TestGenerationResult } from '../types/socketEvents';
import { UnitTestRequest } from '../types/chatgpt';
import { readFileSync } from 'fs';
import { join } from 'path';

export class TestGenerationSocketService {
  private io: SocketIOServer;
  private chatGPTService: ChatGPTService | null = null;
  private angularScanner: AngularComponentScanner;
  private jestExecutionService: JestExecutionService;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.angularScanner = new AngularComponentScanner();
    this.jestExecutionService = new JestExecutionService();
    this.setupSocketHandlers();
  }

  private getChatGPTService(): ChatGPTService {
    if (!this.chatGPTService) {
      this.chatGPTService = new ChatGPTService();
    }
    return this.chatGPTService;
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);

      // Escanear diretório
      socket.on('scan-directory', async (data: { directoryPath: string; options?: any }) => {
        await this.handleScanDirectory(socket, data);
      });

      // Obter conteúdo do arquivo
      socket.on('get-file-content', async (data: { filePath: string }) => {
        await this.handleGetFileContent(socket, data);
      });

      // Gerar testes para arquivos selecionados
      socket.on('generate-tests', async (data: { files: string[]; options?: any }) => {
        await this.handleGenerateTests(socket, data);
      });

      // Criar arquivo de teste
      socket.on('create-test-file', async (data: { filePath: string; content: string }) => {
        await this.handleCreateTestFile(socket, data);
      });

      // Executar teste
      socket.on('execute-test', async (data: { filePath: string; testCode: string; originalFilePath: string }) => {
        await this.handleExecuteTest(socket, data);
      });

      // Executar todos os testes
      socket.on('execute-all-tests', async (data: { projectPath: string }) => {
        await this.handleExecuteAllTests(socket, data);
      });

      // Corrigir erro de teste
      socket.on('fix-test-error', async (data: { 
        componentCode: string; 
        testCode: string; 
        errorMessage: string; 
        componentName: string; 
        filePath: string; 
      }) => {
        await this.handleFixTestError(socket, data);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
      });
    });
  }

  private async handleScanDirectory(socket: any, data: { directoryPath: string; options?: any }) {
    try {
      console.log(`📁 Iniciando escaneamento: ${data.directoryPath}`);
      
      socket.emit('scan-started', { directoryPath: data.directoryPath });

      const result = await this.angularScanner.scanDirectory(data.directoryPath, data.options);

      if (result.errors.length > 0) {
        socket.emit('scan-error', { error: `Erros encontrados: ${result.errors.length}` });
      }

      socket.emit('scan-completed', { result });
      console.log(`✅ Escaneamento concluído: ${result.components.length} componentes encontrados`);

    } catch (error) {
      console.error('❌ Erro no escaneamento:', error);
      socket.emit('scan-error', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
    }
  }

  private async handleGetFileContent(socket: any, data: { filePath: string }) {
    try {
      console.log(`📄 Obtendo conteúdo do arquivo: ${data.filePath}`);
      
      const content = readFileSync(data.filePath, 'utf-8');
      
      socket.emit('file-content', { 
        filePath: data.filePath, 
        content 
      });

    } catch (error) {
      console.error('❌ Erro ao ler arquivo:', error);
      socket.emit('file-content-error', { 
        filePath: data.filePath,
        error: error instanceof Error ? error.message : 'Erro ao ler arquivo'
      });
    }
  }

  private async handleGenerateTests(socket: any, data: { files: string[]; options?: any }) {
    try {
      console.log(`🧪 Iniciando geração de testes para ${data.files.length} arquivos`);
      
      socket.emit('test-generation-started', { files: data.files });

      const results: TestGenerationResult[] = [];
      const totalFiles = data.files.length;

      for (let i = 0; i < data.files.length; i++) {
        const filePath = data.files[i];
        
        // Enviar progresso
        const progress: TestGenerationProgress = {
          current: i + 1,
          total: totalFiles,
          currentFile: filePath,
          percentage: Math.round(((i + 1) / totalFiles) * 100)
        };
        
        socket.emit('test-generation-progress', progress);

        try {
          // Ler conteúdo do arquivo
          const fileContent = readFileSync(filePath, 'utf-8');
          
          // Determinar linguagem e framework baseado no arquivo
          const language = this.detectLanguage(filePath);
          const framework = this.detectFramework(filePath, fileContent);

          // Criar requisição para ChatGPT
          const unitTestRequest: UnitTestRequest = {
            code: fileContent,
            language,
            framework,
            testType: 'unit',
            additionalInstructions: this.getAdditionalInstructions(language, framework),
            filePath: filePath
          };

          // Gerar teste usando ChatGPT
          const testResult = await this.getChatGPTService().generateUnitTest(unitTestRequest);

          const result: TestGenerationResult = {
            filePath,
            testCode: testResult.testCode,
            explanation: testResult.explanation,
            testCases: testResult.testCases,
            dependencies: testResult.dependencies || [],
            setupInstructions: testResult.setupInstructions,
            success: true
          };

          results.push(result);
          
          // Enviar resultado individual
          socket.emit('test-generated', result);
          
          console.log(`✅ Teste gerado para: ${filePath}`);

        } catch (error) {
          const result: TestGenerationResult = {
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
          console.error(`❌ Erro ao gerar teste para ${filePath}:`, error);
        }

        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Enviar resultado final
      socket.emit('test-generation-completed', { results });
      console.log(`🎉 Geração de testes concluída: ${results.filter(r => r.success).length}/${totalFiles} sucessos`);

    } catch (error) {
      console.error('❌ Erro na geração de testes:', error);
      socket.emit('test-generation-error', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
    }
  }

  private detectLanguage(filePath: string): string {
    if (filePath.endsWith('.ts')) return 'typescript';
    if (filePath.endsWith('.js')) return 'javascript';
    if (filePath.endsWith('.py')) return 'python';
    if (filePath.endsWith('.java')) return 'java';
    if (filePath.endsWith('.cs')) return 'csharp';
    return 'typescript'; // padrão
  }

  private detectFramework(filePath: string, content: string): string {
    if (content.includes('@Component') && content.includes('angular')) return 'jest';
    if (content.includes('React') || content.includes('react')) return 'jest';
    if (content.includes('Vue') || content.includes('vue')) return 'jest';
    if (content.includes('@Test') && content.includes('junit')) return 'junit';
    if (content.includes('pytest') || content.includes('unittest')) return 'pytest';
    return 'jest'; // padrão
  }

  private getAdditionalInstructions(language: string, framework: string): string {
    const instructions: { [key: string]: string } = {
      'typescript-jest': 'Gere testes para componentes Angular usando signals. Use TestBed.configureTestingModule com imports para componentes standalone.',
      'javascript-jest': 'Gere testes unitários completos com casos positivos e negativos.',
      'python-pytest': 'Gere testes usando pytest com fixtures quando apropriado.',
      'java-junit': 'Gere testes JUnit com anotações apropriadas.',
      'csharp': 'Gere testes usando NUnit ou MSTest.'
    };

    return instructions[`${language}-${framework}`] || 'Gere testes unitários completos e abrangentes.';
  }

  private async handleCreateTestFile(socket: any, data: { filePath: string; content: string }) {
    try {
      const { filePath, content } = data;
      
      console.log(`📝 Criando arquivo de teste: ${filePath}`);
      
      // Importar fs e path
      const fs = await import('fs');
      const path = await import('path');
      
      // Garantir que o diretório existe
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Escrever o arquivo
      fs.writeFileSync(filePath, content, 'utf8');
      
      console.log(`✅ Arquivo de teste criado com sucesso: ${filePath}`);
      
      // Enviar confirmação para o cliente
      socket.emit('test-file-created', {
        filePath,
        success: true
      });
      
    } catch (error) {
      console.error(`❌ Erro ao criar arquivo de teste:`, error);
      
      socket.emit('test-file-error', {
        filePath: data.filePath,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao criar arquivo'
      });
    }
  }

  private async handleExecuteTest(socket: any, data: { filePath: string; testCode: string; originalFilePath: string }) {
    try {
      const { filePath, testCode, originalFilePath } = data;
      
      console.log(`🧪 Iniciando execução do teste: ${filePath}`);
      console.log(`📝 Código do teste recebido: ${testCode.substring(0, 100)}...`);
      
      // Enviar evento de início
      socket.emit('test-execution-started', { filePath, originalFilePath });
      console.log(`📡 Evento 'test-execution-started' enviado para: ${filePath}`);
      
      // Determinar o diretório do projeto (assumindo que é o diretório pai do arquivo)
      const projectPath = filePath.split('src')[0].slice(0, -1); // Remove a barra final
      console.log(`📁 Diretório do projeto detectado: ${projectPath}`);
      
      // Verificar se o arquivo de teste existe, se não, criar primeiro
      const fs = await import('fs');
      const path = await import('path');
      
      if (!fs.existsSync(filePath)) {
        console.log(`📝 Arquivo de teste não existe, criando: ${filePath}`);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, testCode, 'utf8');
        console.log(`✅ Arquivo de teste criado: ${filePath}`);
      }
      
      // Configurar listeners para saída em tempo real
      const outputHandler = (d: { testFilePath: string; output: string }) => {
        console.log(`📤 Output recebido para ${d.testFilePath}: ${d.output.substring(0, 50)}...`);
        if (d.testFilePath === filePath) {
          console.log(`📡 Enviando 'test-execution-output' para socket`);
          socket.emit('test-execution-output', {
            filePath: d.testFilePath,
            originalFilePath,
            output: d.output
          });
        }
      };

      const completedHandler = (d: { testFilePath: string; success: boolean; output: string; exitCode?: number }) => {
        console.log(`✅ Completed recebido para ${d.testFilePath}: success=${d.success}`);
        if (d.testFilePath === filePath) {
          console.log(`📡 Enviando 'test-execution-completed' para socket`);
          socket.emit('test-execution-completed', {
            filePath: d.testFilePath,
            originalFilePath,
            status: d.success ? 'success' : 'error',
            output: d.output
          });
        }
      };

      const errorHandler = (d: { testFilePath: string; error: string }) => {
        console.log(`❌ Error recebido para ${d.testFilePath}: ${d.error}`);
        if (d.testFilePath === filePath) {
          console.log(`📡 Enviando 'test-execution-error' para socket`);
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

      // Executar o teste
      console.log(`🚀 Iniciando execução do Jest...`);
      const result = await this.jestExecutionService.executeTest({
        projectPath,
        testFilePath: filePath,
        timeout: 30000
      });

      console.log(`✅ Execução do teste concluída: ${filePath} - ${result.success ? 'Sucesso' : 'Erro'}`);
      
      // Limpar listeners
      this.jestExecutionService.off('output', outputHandler);
      this.jestExecutionService.off('completed', completedHandler);
      this.jestExecutionService.off('error', errorHandler);
      
    } catch (error) {
      console.error(`❌ Erro ao executar teste:`, error);
      
      socket.emit('test-execution-error', {
        filePath: data.filePath,
        originalFilePath: data.originalFilePath,
        error: error instanceof Error ? error.message : 'Erro desconhecido na execução'
      });
    }
  }

  // Handler para executar todos os testes
  private async handleExecuteAllTests(socket: any, data: { projectPath: string }) {
    console.log('🚀 Frontend: execute-all-tests chamado', data.projectPath);
    
    try {
      const { projectPath } = data;
      
      if (!projectPath) {
        socket.emit('all-tests-execution-error', {
          error: 'Caminho do projeto não fornecido'
        });
        return;
      }

      // Configurar handlers para eventos do Jest
      const outputHandler = (d: { testFilePath: string; output: string }) => {
        console.log(`📡 Output recebido para ${d.testFilePath}: ${d.output.substring(0, 100)}...`);
        if (d.testFilePath === 'all-tests') {
          console.log(`📡 Enviando 'all-tests-output' para socket`);
          socket.emit('all-tests-output', {
            output: d.output
          });
        }
      };

      const completedHandler = (d: { testFilePath: string; success: boolean; output: string; exitCode?: number }) => {
        console.log(`✅ Completed recebido para ${d.testFilePath}: ${d.success ? 'sucesso' : 'erro'}`);
        if (d.testFilePath === 'all-tests') {
          console.log(`📡 Enviando 'all-tests-completed' para socket`);
          socket.emit('all-tests-completed', {
            success: d.success,
            output: d.output,
            exitCode: d.exitCode
          });
        }
      };

      const errorHandler = (d: { testFilePath: string; error: string }) => {
        console.log(`❌ Error recebido para ${d.testFilePath}: ${d.error}`);
        if (d.testFilePath === 'all-tests') {
          console.log(`📡 Enviando 'all-tests-execution-error' para socket`);
          socket.emit('all-tests-execution-error', {
            error: d.error
          });
        }
      };

      this.jestExecutionService.on('output', outputHandler);
      this.jestExecutionService.on('completed', completedHandler);
      this.jestExecutionService.on('error', errorHandler);

      // Executar todos os testes
      console.log(`🚀 Iniciando execução de todos os testes...`);
      const result = await this.jestExecutionService.executeAllTests({
        projectPath,
        timeout: 60000
      });

      console.log(`✅ Execução de todos os testes concluída: ${result.success ? 'sucesso' : 'erro'}`);

      // Limpar handlers
      this.jestExecutionService.off('output', outputHandler);
      this.jestExecutionService.off('completed', completedHandler);
      this.jestExecutionService.off('error', errorHandler);
      
    } catch (error) {
      console.error(`❌ Erro ao executar todos os testes:`, error);
      
      socket.emit('all-tests-execution-error', {
        error: error instanceof Error ? error.message : 'Erro desconhecido na execução'
      });
    }
  }

  // Handler para corrigir erro de teste
  private async handleFixTestError(socket: any, data: { 
    componentCode: string; 
    testCode: string; 
    errorMessage: string; 
    componentName: string; 
    filePath: string; 
  }) {
    console.log('🔧 [BACKEND] fix-test-error chamado');
    console.log('🔧 [BACKEND] FilePath:', data.filePath);
    console.log('🔧 [BACKEND] ComponentName:', data.componentName);
    console.log('🔧 [BACKEND] ComponentCode length:', data.componentCode?.length || 0);
    console.log('🔧 [BACKEND] TestCode length:', data.testCode?.length || 0);
    console.log('🔧 [BACKEND] ErrorMessage length:', data.errorMessage?.length || 0);
    console.log('🔧 [BACKEND] ErrorMessage preview:', data.errorMessage?.substring(0, 200));
    
    try {
      const { componentCode, testCode, errorMessage, componentName, filePath } = data;
      
      if (!componentCode || !testCode || !errorMessage) {
        console.error('❌ [BACKEND] Dados insuficientes para correção');
        socket.emit('test-fix-error', {
          error: 'Dados insuficientes para correção do teste'
        });
        return;
      }

      console.log(`🔧 [BACKEND] Corrigindo teste para: ${componentName} (${filePath})`);

      // Notificar que a correção começou
      socket.emit('test-fix-started', {
        filePath,
        componentName
      });

      console.log('🤖 [BACKEND] Chamando ChatGPT para corrigir...');

      // Usar o ChatGPT para corrigir o erro
      const chatGPTService = this.getChatGPTService();
      const fixedTest = await chatGPTService.fixUnitTestError({
        componentCode,
        testCode,
        errorMessage,
        componentName,
        filePath
      });

      console.log(`✅ [BACKEND] Teste corrigido pelo ChatGPT para: ${componentName}`);
      console.log(`✅ [BACKEND] Fixed test code length:`, fixedTest.testCode.length);
      console.log(`✅ [BACKEND] Fixed test explanation:`, fixedTest.explanation?.substring(0, 100));

      // Enviar o teste corrigido
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

      console.log('✅ [BACKEND] Evento test-fixed enviado para o frontend');

    } catch (error) {
      console.error(`❌ [BACKEND] Erro ao corrigir teste:`, error);
      console.error(`❌ [BACKEND] Stack trace:`, error instanceof Error ? error.stack : 'N/A');
      
      socket.emit('test-fix-error', {
        error: error instanceof Error ? error.message : 'Erro desconhecido na correção'
      });
    }
  }
}
