import { Server as SocketIOServer } from 'socket.io';
import { AngularComponentScanner } from './angularComponentScanner';
import { ChatGPTService } from './chatgptService';
import { JestExecutionService } from './jestExecutionService';
import { SocketEvents, ScanProgressData, TestGenerationProgress, TestGenerationResult } from '../types/socketEvents';
import { UnitTestRequest } from '../types/chatgpt';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

export class TestGenerationSocketService {
  private io: SocketIOServer;
  private chatGPTService: ChatGPTService | null = null;
  private angularScanner: AngularComponentScanner;
  private jestExecutionService: JestExecutionService;
  private chatHistories: Map<string, { role: 'user' | 'assistant'; content: string }[]> = new Map();

  // Lista arquivos do projeto (relativos ao directoryPath)
  private listProjectFiles(rootDir: string, opts?: { exts?: string[]; maxDepth?: number; maxResults?: number }): string[] {
    const exts = (opts?.exts || ['.ts', '.js', '.scss', '.html', '.json']).map(e => e.toLowerCase());
    const maxDepth = opts?.maxDepth ?? 12;
    const maxResults = opts?.maxResults ?? 5000;
    const results: string[] = [];
    const visit = (dir: string, depth: number) => {
      if (depth > maxDepth || results.length >= maxResults) return;
      let entries: fs.Dirent[] = [];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const ent of entries) {
        if (results.length >= maxResults) break;
        const full = path.join(dir, ent.name);
        const rel = full.replace(/\\/g, '/');
        if (ent.isDirectory()) {
          if (/node_modules|dist|coverage|\.git|\.angular|\.cache/i.test(ent.name)) continue;
          visit(full, depth + 1);
        } else if (ent.isFile()) {
          const lower = ent.name.toLowerCase();
          if (exts.some(ext => lower.endsWith(ext))) {
            results.push(full.replace(/\\/g, '/'));
          }
        }
      }
    };
    visit(rootDir, 0);
    // converter para relativo a rootDir
    const normRoot = rootDir.replace(/\\/g, '/').replace(/\/+$/, '');
    return results.map(f => f.startsWith(normRoot) ? f.slice(normRoot.length).replace(/^\/+/, '') : f);
  }

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

      // Registrar logs do fluxo automático enviados pelo frontend
      socket.on('auto-flow-log', async (data: { line: string }) => {
        try {
          const logsDir = path.join(process.cwd(), 'logs');
          if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
          const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          const file = path.join(logsDir, `auto-flow-${day}.txt`);
          const content = `[${new Date().toISOString()}] ${String(data?.line || '').replace(/\r?\n/g, ' ')}\n`;
          fs.appendFileSync(file, content, 'utf8');
        } catch (e) {
          try {
            const file = path.join(process.cwd(), 'logs', 'app.txt');
            fs.appendFileSync(file, `[${new Date().toISOString()}] auto-flow-log-error ${(e instanceof Error ? e.message : 'unknown')}\n`, 'utf8');
          } catch {}
        }
      });

      // Chat IA: recebe mensagem e responde com texto e possíveis ações (via provedor de IA)
      socket.on('chat:message', async (data: { conversationId?: string; message: string; context?: { directoryPath?: string; previewPath?: string } }) => {
        try {
          const conversationId = (data?.conversationId && String(data.conversationId)) || socket.id;
          const userMessage = (data?.message || '').trim();
          const directoryPath = (data?.context?.directoryPath || '').replace(/\\/g, '/');

          if (!userMessage) {
            socket.emit('chat:error', { conversationId, error: 'Mensagem vazia' });
            return;
          }

          // Função de log de conversa
          const appendChatLog = (role: 'user' | 'assistant' | 'system', content: string) => {
            try {
              const logsDir = path.join(process.cwd(), 'logs');
              const chatDir = path.join(logsDir, 'chat');
              if (!fs.existsSync(chatDir)) fs.mkdirSync(chatDir, { recursive: true });
              const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
              const file = path.join(chatDir, `${day}.txt`);
              const line = `${new Date().toISOString()} [${conversationId}] ${role.toUpperCase()}: ${content.replace(/\r?\n/g, ' ')}`;
              fs.appendFileSync(file, line + '\n', 'utf8');
            } catch (e) {
              logger.warn('chat_log_fail', { msg: e instanceof Error ? e.message : 'append_fail' });
            }
          };

          appendChatLog('user', userMessage);

          // 1) Atualiza histórico da conversa (mantém últimas 20 mensagens)
          const hist = this.chatHistories.get(conversationId) || [];
          hist.push({ role: 'user', content: userMessage });
          while (hist.length > 20) hist.shift();
          this.chatHistories.set(conversationId, hist);

          // 2) Chama IA para responder e, opcionalmente, descrever uma ação (com histórico)
          let aiContent = '';
          let aiAction: { type: 'open_file'; path: string } | undefined;
          try {
            // Monta um índice de arquivos do projeto para a IA decidir qual abrir
            let filesIndex = '';
            if (directoryPath) {
              const files = this.listProjectFiles(directoryPath, { maxDepth: 8, maxResults: 1500 });
              // prioriza src/ e arquivos ts/html/scss, limita a 400 linhas
              const prioritized = [...files].sort((a, b) => {
                const sa = (a.includes('src/') ? 0 : 1) + (a.endsWith('.ts') ? 0 : a.endsWith('.html') || a.endsWith('.scss') ? 0.1 : 0.2);
                const sb = (b.includes('src/') ? 0 : 1) + (b.endsWith('.ts') ? 0 : b.endsWith('.html') || b.endsWith('.scss') ? 0.1 : 0.2);
                return sa - sb;
              }).slice(0, 400);
              filesIndex = prioritized.join('\n');
            }

            const ai = await this.getChatGPTService().agentChatWithHistory(hist, { directoryPath, previewPath: data?.context?.previewPath, filesIndex });
            aiContent = ai.content || '';
            aiAction = ai.action;
          } catch (e) {
            aiContent = 'Não foi possível contatar o provedor de IA no momento.';
          }

          // 3) Se IA não retornou ação mas parece um pedido de abrir arquivo, fazemos fallback heurístico
          const lower = userMessage.toLowerCase();
          const wantsOpen = /(\babr[ei]\b|\babrir\b|\bopen\b)/.test(lower);
          const normalize = (p: string) => (p || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
          let safeRel = normalize(aiAction?.path || '');
          let isSafe = !!safeRel && !safeRel.includes('..');
          if (!aiAction && wantsOpen) {
            // tentar extrair do texto para fallback
            let extractedPath = '';
            const codeMatch = userMessage.match(/`([^`]+)`/);
            if (codeMatch && codeMatch[1]) extractedPath = codeMatch[1];
            const fileNameMatch = userMessage.match(/([\w\-\.]+\.(?:ts|js|scss|html|json))/i);
            if (!extractedPath && fileNameMatch) extractedPath = fileNameMatch[1];
            safeRel = normalize(extractedPath);
            isSafe = !!safeRel && !safeRel.includes('..');
          }

          // 4) Se ainda não há caminho relativo, tentamos localizar por nome no projeto
          if (wantsOpen && (!isSafe || !safeRel.includes('/')) && directoryPath && !safeRel.includes('..')) {
            const targetName = safeRel || userMessage.replace(/\s+/g, ' ').trim();
            const fileNameMatch = targetName.match(/([\w\-\.]+\.(?:ts|js|scss|html|json))/i);
            const fileName = fileNameMatch ? fileNameMatch[1] : '';
            if (fileName) {
              const matches: string[] = [];
              // busca limitada em profundidade para evitar travar
              const maxResults = 20;
              const maxDepth = 7;
              const visit = (dir: string, depth: number) => {
                if (depth > maxDepth || matches.length >= maxResults) return;
                let entries: fs.Dirent[] = [];
                try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
                for (const ent of entries) {
                  const full = join(dir, ent.name);
                  if (ent.isDirectory()) {
                    // pular node_modules e dist
                    if (/node_modules|dist|coverage|\.git/.test(ent.name)) continue;
                    visit(full, depth + 1);
                  } else if (ent.isFile()) {
                    if (ent.name.toLowerCase() === fileName.toLowerCase()) {
                      matches.push(full.replace(/\\/g, '/'));
                      if (matches.length >= maxResults) break;
                    }
                  }
                }
              };
              visit(directoryPath, 0);
              if (matches.length > 0) {
                // escolha simples: preferir caminhos dentro de src/ primeiro, depois o mais curto
                const preferred = [...matches].sort((a, b) => {
                  const aScore = (a.includes('/src/') ? 0 : 1) + a.split('/').length / 1000;
                  const bScore = (b.includes('/src/') ? 0 : 1) + b.split('/').length / 1000;
                  return aScore - bScore;
                })[0];
                // converter para relativo ao directoryPath
                if (preferred.startsWith(directoryPath)) {
                  safeRel = preferred.slice(directoryPath.length).replace(/^\/+/, '');
                  isSafe = true;
                }
              }
            }
          }

          const assistantMsg = aiContent || (wantsOpen && isSafe
            ? `Ok! Vou abrir o arquivo ${safeRel}.`
            : (wantsOpen ? 'Não encontrei o arquivo solicitado. Informe um caminho relativo ou o nome exato do arquivo.' : 'Posso abrir arquivos, gerar e corrigir testes. Diga "abrir <caminho-relativo>".'));

          socket.emit('chat:message', { conversationId, role: 'assistant', content: assistantMsg });
          hist.push({ role: 'assistant', content: assistantMsg });
          while (hist.length > 20) hist.shift();
          this.chatHistories.set(conversationId, hist);
          appendChatLog('assistant', assistantMsg);

          if ((aiAction && aiAction.type === 'open_file' && isSafe) || (wantsOpen && isSafe)) {
            // opcional: validar que o arquivo existe sob o directoryPath se fornecido
            try {
              if (directoryPath) {
                const candidate = join(directoryPath, safeRel);
                if (!existsSync(candidate)) {
                  // ainda assim emitir ação; frontend pode tentar ler e falhar com feedback
                }
              }
            } catch {}
            socket.emit('chat:action', { conversationId, type: 'open_file', path: safeRel });
            appendChatLog('system', `ACTION open_file path=${safeRel}`);
          }
        } catch (err) {
          const conversationId = data?.conversationId || socket.id;
          socket.emit('chat:error', { conversationId, error: err instanceof Error ? err.message : 'Erro no chat' });
          try {
            const logsDir = path.join(process.cwd(), 'logs');
            const chatDir = path.join(logsDir, 'chat');
            if (!fs.existsSync(chatDir)) fs.mkdirSync(chatDir, { recursive: true });
            const day = new Date().toISOString().slice(0, 10);
            const file = path.join(chatDir, `${day}.txt`);
            const line = `${new Date().toISOString()} [${conversationId}] ERROR: ${err instanceof Error ? err.message : 'Erro no chat'}`;
            fs.appendFileSync(file, line + '\n', 'utf8');
          } catch {}
        }
      });

      socket.on('disconnect', () => {
      });
    });
  }

  private async handleScanDirectory(socket: any, data: { directoryPath: string; options?: any }) {
    try {
      socket.emit('scan-started', { directoryPath: data.directoryPath });

      const result = await this.angularScanner.scanDirectory(data.directoryPath, data.options);

      if (result.errors.length > 0) {
        socket.emit('scan-error', { error: `Erros encontrados: ${result.errors.length}` });
      }

      socket.emit('scan-completed', { result });

    } catch (error) {
      socket.emit('scan-error', { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
    }
  }

  private async handleGetFileContent(socket: any, data: { filePath: string }) {
    try {
      const content = readFileSync(data.filePath, 'utf-8');
      
      socket.emit('file-content', { 
        filePath: data.filePath, 
        content 
      });

    } catch (error) {
      socket.emit('file-content-error', { 
        filePath: data.filePath,
        error: error instanceof Error ? error.message : 'Erro ao ler arquivo'
      });
    }
  }

  private async handleGenerateTests(socket: any, data: { files: string[]; options?: any }) {
    try {
      socket.emit('test-generation-started', { files: data.files });

      const results: TestGenerationResult[] = [];
      const generatedFiles: { filePath: string; fileName: string; directory: string; content: string }[] = [];
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
          
          // Determinar linguagem e framework baseado no arquivo e no projeto
          const language = this.detectLanguage(filePath);
          const framework = this.detectProjectTestFramework(filePath) || this.detectFramework(filePath, fileContent);

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

          // Criar automaticamente o arquivo de teste no mesmo diretório relativo a src/app
          try {
            const fs = await import('fs');
            const path = await import('path');

            // Raiz do repositório e projeto de testes
            const repoRoot = path.resolve(__dirname, '../../..');
            const testProjectRoot = path.join(repoRoot, 'test-angular');

            // Extrair caminho relativo dentro de src/app do arquivo original
            const match = filePath.match(/[\\\/]src[\\\/]app[\\\/](.*)/);
            const relWithinApp = match ? match[1] : path.basename(filePath);

            const originalDirWithinApp = path.dirname(relWithinApp);
            const originalBaseWithExt = path.basename(relWithinApp);
            const originalBase = originalBaseWithExt.replace(/\.[^.]+$/, '');

            // Diretório alvo dentro do test-angular espelhando a estrutura
            const targetDir = path.join(testProjectRoot, 'src', 'app', originalDirWithinApp);
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }

            const specFileName = originalBaseWithExt.endsWith('.spec.ts')
              ? originalBaseWithExt
              : originalBaseWithExt.replace(/\.ts$/, '.spec.ts');
            const specFilePath = path.join(targetDir, specFileName);

            // Ajustar import do componente para um import local no mesmo diretório
            let codeToWrite = result.testCode || '';
            const sameDirImport = `./${originalBase}`;
            codeToWrite = codeToWrite.replace(
              new RegExp("from\\s+['\"]\\./[^'\"]+['\"]"),
              `from '${sameDirImport}'`
            );

            fs.writeFileSync(specFilePath, codeToWrite, 'utf8');

            const fileName = path.basename(specFilePath);
            const directory = path.dirname(specFilePath);

            // Persistir para retorno ao final
            generatedFiles.push({
              filePath: specFilePath,
              fileName,
              directory,
              content: codeToWrite
            });

            socket.emit('test-file-created', {
              filePath: specFilePath,
              fileName,
              directory,
              content: codeToWrite,
              success: true
            });
          } catch (autoWriteErr) {
            socket.emit('test-file-error', {
              filePath: filePath,
              error: autoWriteErr instanceof Error ? autoWriteErr.message : 'Erro ao salvar teste gerado'
            });
          }
          

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
        }

        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Enviar resultado final com arquivos gerados
      socket.emit('test-generation-completed', { results, generatedFiles });

    } catch (error) {
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

  /**
   * Detecta o framework de testes do projeto (Jest ou Jasmine/Karma)
   * subindo diretórios a partir do arquivo até encontrar um package.json
   */
  private detectProjectTestFramework(filePath: string): 'jest' | 'jasmine' | undefined {
    try {
      const path = require('path');
      const fs = require('fs');

      const findProjectRoot = (startPath: string): string | undefined => {
        let current = path.dirname(startPath);
        const { root } = path.parse(current);
        while (true) {
          const pkgPath = path.join(current, 'package.json');
          if (fs.existsSync(pkgPath)) return current;
          if (current === root) break;
          current = path.dirname(current);
        }
        return undefined;
      };

      const projectRoot = findProjectRoot(filePath);
      if (!projectRoot) return undefined;

      const pkgJsonPath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as any;

      const hasDep = (name: string) => {
        const d = pkg.dependencies || {};
        const dd = pkg.devDependencies || {};
        return Boolean(d[name] || dd[name]);
      };

      // Heurísticas de Jest
      const jestConfigFiles = [
        'jest.config.js',
        'jest.config.ts',
        'jest.preset.js',
        'jest.preset.ts',
      ].some((f) => fs.existsSync(path.join(projectRoot, f)));
      if (hasDep('jest') || hasDep('ts-jest') || hasDep('jest-preset-angular') || jestConfigFiles) {
        return 'jest';
      }

      // Heurísticas de Jasmine/Karma (Angular CLI padrão)
      const karmaFiles = [
        'karma.conf.js',
        'karma.conf.ts',
      ].some((f) => fs.existsSync(path.join(projectRoot, f)));
      const hasAngularKarmaBuilder = (() => {
        try {
          const angularJsonPath = path.join(projectRoot, 'angular.json');
          if (!fs.existsSync(angularJsonPath)) return false;
          const angular = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8')) as any;
          const projects = angular.projects || {};
          return Object.values(projects).some((p: any) => {
            const testCfg = p?.architect?.test || p?.targets?.test;
            const builder = testCfg?.builder || testCfg?.executor;
            return typeof builder === 'string' && builder.includes('build-angular:karma');
          });
        } catch {
          return false;
        }
      })();

      if (hasDep('jasmine-core') || hasDep('karma') || karmaFiles || hasAngularKarmaBuilder) {
        return 'jasmine';
      }

      return undefined;
    } catch {
      return undefined;
    }
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
      
      // Enviar confirmação para o cliente
      socket.emit('test-file-created', {
        filePath,
        success: true
      });
      
    } catch (error) {
      
      socket.emit('test-file-error', {
        filePath: data.filePath,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao criar arquivo'
      });
    }
  }

  private async handleExecuteTest(socket: any, data: { filePath: string; testCode: string; originalFilePath: string }) {
    try {
      const { filePath, testCode, originalFilePath } = data;
      
      // Enviar evento de início
      socket.emit('test-execution-started', { filePath, originalFilePath });
      
      
      // Determinar o diretório do projeto (assumindo que é o diretório pai do arquivo)
      const projectPath = filePath.split('src')[0].slice(0, -1); // Remove a barra final
      
      
      // Verificar se o arquivo de teste existe, se não, criar primeiro
      const fs = await import('fs');
      const path = await import('path');
      
      // Sempre garante que o conteúdo mais recente esteja no disco quando fornecido
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (typeof testCode === 'string' && testCode.trim().length > 0) {
        try {
          fs.writeFileSync(filePath, testCode, 'utf8');
        } catch {}
      } else if (!fs.existsSync(filePath)) {
        // Se não há testCode e o arquivo ainda não existe, cria vazio para evitar falha
        fs.writeFileSync(filePath, '', 'utf8');
      }
      
      // Configurar listeners para saída em tempo real
      const outputHandler = (d: { testFilePath: string; output: string }) => {
        
        if (d.testFilePath === filePath) {
          
          socket.emit('test-execution-output', {
            filePath: d.testFilePath,
            originalFilePath,
            output: d.output
          });
        }
      };

      const completedHandler = (d: { testFilePath: string; success: boolean; output: string; exitCode?: number }) => {
        
        if (d.testFilePath === filePath) {
          
          socket.emit('test-execution-completed', {
            filePath: d.testFilePath,
            originalFilePath,
            status: d.success ? 'success' : 'error',
            output: d.output
          });
        }
      };

      const errorHandler = (d: { testFilePath: string; error: string }) => {
        
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

      // Executar o teste
      const result = await this.jestExecutionService.executeTest({
        projectPath,
        testFilePath: filePath,
        timeout: 30000
      });

      // Limpar listeners
      this.jestExecutionService.off('output', outputHandler);
      this.jestExecutionService.off('completed', completedHandler);
      this.jestExecutionService.off('error', errorHandler);
      
    } catch (error) {
      
      socket.emit('test-execution-error', {
        filePath: data.filePath,
        originalFilePath: data.originalFilePath,
        error: error instanceof Error ? error.message : 'Erro desconhecido na execução'
      });
    }
  }

  // Handler para executar todos os testes
  private async handleExecuteAllTests(socket: any, data: { projectPath: string }) {
    
    
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
        
        if (d.testFilePath === 'all-tests') {
          
          socket.emit('all-tests-output', {
            output: d.output
          });
        }
      };

      const completedHandler = (d: { testFilePath: string; success: boolean; output: string; exitCode?: number }) => {
        
        if (d.testFilePath === 'all-tests') {
          
          socket.emit('all-tests-completed', {
            success: d.success,
            output: d.output,
            exitCode: d.exitCode
          });
        }
      };

      const errorHandler = (d: { testFilePath: string; error: string }) => {
        
        if (d.testFilePath === 'all-tests') {
          
          socket.emit('all-tests-execution-error', {
            error: d.error
          });
        }
      };

      this.jestExecutionService.on('output', outputHandler);
      this.jestExecutionService.on('completed', completedHandler);
      this.jestExecutionService.on('error', errorHandler);

      // Executar todos os testes
      const result = await this.jestExecutionService.executeAllTests({
        projectPath,
        timeout: 60000
      });


      // Limpar handlers
      this.jestExecutionService.off('output', outputHandler);
      this.jestExecutionService.off('completed', completedHandler);
      this.jestExecutionService.off('error', errorHandler);
      
    } catch (error) {
      
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
    
    
    try {
      const { componentCode, testCode, errorMessage, componentName, filePath } = data;
      
      // Normaliza valores
      const normComponentCode = (componentCode || '').trim();
      const normErrorMessage = (errorMessage || '').trim();
      const normTestCode = (testCode || '').trim();

      // Permite testCode opcional; exigimos ao menos componentCode e uma mensagem (erro/prompt)
      const missing: string[] = [];
      if (!normComponentCode) missing.push('componentCode');
      if (!normErrorMessage) missing.push('errorMessage');
      if (missing.length > 0) {
        console.error('Dados insuficientes para correção', { missing, filePath, componentName });
        socket.emit('test-fix-error', {
          error: `Dados insuficientes para correção do teste: faltando ${missing.join(', ')}`
        });
        return;
      }

      

      // Notificar que a correção começou
      socket.emit('test-fix-started', {
        filePath,
        componentName
      });

      

      // Usar o ChatGPT para corrigir o erro
      const chatGPTService = this.getChatGPTService();
      const fixedTest = await chatGPTService.fixUnitTestError({
        componentCode: normComponentCode,
        testCode: normTestCode,
        errorMessage: normErrorMessage,
        componentName,
        filePath
      });

      

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

      // Também persistir automaticamente o arquivo .spec.ts espelhando a estrutura em test-angular
      try {
        const fs = await import('fs');
        const path = await import('path');

        // Raiz do repositório e projeto de testes
        const repoRoot = path.resolve(__dirname, '../../..');
        const testProjectRoot = path.join(repoRoot, 'test-angular');

        // Extrair caminho relativo dentro de src/app do arquivo original
        const match = filePath.match(/[\\\/]src[\\\/]app[\\\/](.*)/);
        const relWithinApp = match ? match[1] : path.basename(filePath);

        const originalDirWithinApp = path.dirname(relWithinApp);
        const originalBaseWithExt = path.basename(relWithinApp);
        const originalBase = originalBaseWithExt.replace(/\.[^.]+$/, '');

        // Diretório alvo dentro do test-angular espelhando a estrutura
        const targetDir = path.join(testProjectRoot, 'src', 'app', originalDirWithinApp);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const specFileName = originalBaseWithExt.endsWith('.spec.ts')
          ? originalBaseWithExt
          : originalBaseWithExt.replace(/\.ts$/, '.spec.ts');
        const specFilePath = path.join(targetDir, specFileName);

        // Ajustar import do componente para um import local no mesmo diretório
        let codeToWrite = (fixedTest.testCode || '').trim();
        const sameDirImport = `./${originalBase}`;
        codeToWrite = codeToWrite.replace(
          new RegExp("from\\s+['\"]\\./[^'\"]+['\"]"),
          `from '${sameDirImport}'`
        );

        fs.writeFileSync(specFilePath, codeToWrite, 'utf8');

        const fileName = path.basename(specFilePath);
        const directory = path.dirname(specFilePath);

        socket.emit('test-file-created', {
          filePath: specFilePath,
          fileName,
          directory,
          content: codeToWrite,
          success: true
        });
      } catch (persistErr) {
        socket.emit('test-file-error', {
          filePath,
          error: persistErr instanceof Error ? persistErr.message : 'Erro ao salvar teste corrigido'
        });
      }

      

    } catch (error) {
      
      socket.emit('test-fix-error', {
        error: error instanceof Error ? error.message : 'Erro desconhecido na correção'
      });
    }
  }
}
