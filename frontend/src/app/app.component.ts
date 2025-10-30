import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from './services/socket.service';
import { AngularComponent, TestGenerationResult, ScanProgressData, TestGenerationProgress } from './types/socket-events';

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
    MatCheckboxModule,
    MatChipsModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  // Colunas da tabela
  displayedColumns: string[] = ['select', 'component', 'file', 'type', 'actions'];
  
  // Colunas da tabela de resultados dos testes
  testResultsDisplayedColumns: string[] = ['status', 'file', 'actions'];
  
  // Signals para estado da aplicação
  directoryPath = signal<string>('');
  isScanning = signal<boolean>(false);
  isGeneratingTests = signal<boolean>(false);
  isCreatingTest = signal<boolean>(false);
  isExecutingTest = signal<boolean>(false);
  isExecutingAllTests = signal<boolean>(false);
  isConnected = signal<boolean>(false);
  
  // Dados escaneados
  scannedComponents = signal<AngularComponent[]>([]);
  selectedFiles = signal<string[]>([]);
  
  // Progresso
  scanProgress = signal<ScanProgressData | null>(null);
  testProgress = signal<TestGenerationProgress | null>(null);
  
  // Resultados
  fileContent = signal<string>('');
  currentFilePath = signal<string>('');
  testResults = signal<TestGenerationResult[]>([]);
  
  // Execução de todos os testes
  allTestsOutput = signal<string>('');
  allTestsExecution = signal<{ status: 'running' | 'success' | 'error'; output: string; startTime?: Date } | null>(null);
  
  // Modal de detalhes do teste
  selectedTestResult = signal<TestGenerationResult | null>(null);
  
  // Correção de erros de teste
  isFixingTest = signal<boolean>(false);
  fixingTestFile = signal<string>('');
  
  // Dialog de prompt customizado
  showCustomPromptDialog = signal<boolean>(false);
  selectedTestForPrompt = signal<TestGenerationResult | null>(null);
  customPrompt = signal<string>('');
  
  // Computed signals
  hasSelectedFiles = computed(() => this.selectedFiles().length > 0);
  canGenerateTests = computed(() => this.hasSelectedFiles() && !this.isGeneratingTests());
  hasCreatedTests = computed(() => this.testResults().length > 0);
  
  // Contadores para resultados
  successCount = computed(() => this.testResults().filter(r => r.success).length);
  errorCount = computed(() => this.testResults().filter(r => !r.success).length);
  
  // Mensagens de status
  statusMessage = signal<string>('Conectando ao servidor...');
  errorMessage = signal<string>('');

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    this.setupSocketListeners();
    this.socketService.connect();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  private setupSocketListeners(): void {
    // Conexão
    this.socketService.onConnection().subscribe(() => {
      this.isConnected.set(true);
      this.statusMessage.set('Conectado ao servidor');
      this.errorMessage.set('');
    });

    this.socketService.onDisconnection().subscribe(() => {
      this.isConnected.set(false);
      this.statusMessage.set('Desconectado do servidor');
    });

    // Escaneamento
    this.socketService.onScanStarted().subscribe(data => {
      this.isScanning.set(true);
      this.statusMessage.set(`Escaneando diretório: ${data.directoryPath}`);
      this.errorMessage.set('');
    });

    this.socketService.onScanProgress().subscribe(progress => {
      this.scanProgress.set(progress);
      this.statusMessage.set(`Escaneando... ${progress.current}/${progress.total} - ${progress.currentFile}`);
    });

    this.socketService.onScanCompleted().subscribe(data => {
      this.isScanning.set(false);
      this.scanProgress.set(null);
      this.scannedComponents.set(data.result.components || []);
      this.statusMessage.set(`Escaneamento concluído: ${data.result.components?.length || 0} componentes encontrados`);
    });

    this.socketService.onScanError().subscribe(data => {
      this.isScanning.set(false);
      this.scanProgress.set(null);
      this.errorMessage.set(`Erro no escaneamento: ${data.error}`);
    });

    // Conteúdo do arquivo
    this.socketService.onFileContent().subscribe(data => {
      this.fileContent.set(data.content);
      this.currentFilePath.set(data.filePath);
      this.statusMessage.set(`Conteúdo carregado: ${data.filePath}`);
    });

    this.socketService.onFileContentError().subscribe(data => {
      this.errorMessage.set(`Erro ao carregar arquivo: ${data.error}`);
    });

    // Geração de testes
    this.socketService.onTestGenerationStarted().subscribe(data => {
      this.isGeneratingTests.set(true);
      
      // Só limpa todos os resultados se for uma geração completa (não um retry)
      if (data.files.length > 1 || !this.testResults().some(r => r.error === 'Processando...')) {
        this.testResults.set([]);
      }
      
      this.statusMessage.set(`Iniciando geração de testes para ${data.files.length} arquivos`);
      this.errorMessage.set('');
    });

    this.socketService.onTestGenerationProgress().subscribe(progress => {
      this.testProgress.set(progress);
      this.statusMessage.set(`Gerando testes... ${progress.current}/${progress.total} - ${progress.currentFile}`);
    });

    this.socketService.onTestGenerated().subscribe(result => {
      // Adiciona timestamp ao resultado
      const resultWithTimestamp = {
        ...result,
        timestamp: new Date()
      };
      
      this.testResults.update(results => {
        // Verifica se já existe um teste com este filePath
        const existingIndex = results.findIndex(r => r.filePath === result.filePath);
        if (existingIndex !== -1) {
          // Atualiza o teste existente
          const updatedResults = [...results];
          updatedResults[existingIndex] = resultWithTimestamp;
          return updatedResults;
        } else {
          // Adiciona novo teste
          return [...results, resultWithTimestamp];
        }
      });
      this.statusMessage.set(`Teste gerado: ${result.filePath}`);
    });

    this.socketService.onTestGenerationCompleted().subscribe(data => {
      this.isGeneratingTests.set(false);
      this.testProgress.set(null);
      this.statusMessage.set(`Geração concluída: ${data.results.filter(r => r.success).length}/${data.results.length} sucessos`);
    });

    this.socketService.onTestGenerationError().subscribe(data => {
      this.isGeneratingTests.set(false);
      this.testProgress.set(null);
      this.errorMessage.set(`Erro na geração: ${data.error}`);
    });

    // Criação de arquivo de teste
    this.socketService.onTestFileCreated().subscribe(data => {
      this.isCreatingTest.set(false);
      if (data.success) {
        this.statusMessage.set(`Arquivo de teste criado: ${data.filePath}`);
        // Limpa a mensagem após 5 segundos
        setTimeout(() => {
          this.statusMessage.set('');
        }, 5000);
      } else {
        this.errorMessage.set('Erro ao criar arquivo de teste');
      }
    });

    this.socketService.onTestFileError().subscribe(data => {
      this.isCreatingTest.set(false);
      this.errorMessage.set(`Erro ao criar arquivo de teste: ${data.error}`);
    });

    // Execução de testes
    this.socketService.onTestExecutionStarted().subscribe(data => {
      console.log('🔔 Frontend: test-execution-started recebido', data);
      this.isExecutingTest.set(true);
      this.statusMessage.set(`Iniciando execução do teste: ${data.filePath}`);

      // Cria/atualiza a área de execução com uma mensagem inicial
      this.testResults.update(results => {
        const updatedResults = [...results];
        const resultIndex = updatedResults.findIndex(r => r.filePath === data.originalFilePath);
        if (resultIndex !== -1) {
          if (!updatedResults[resultIndex].testExecution) {
            updatedResults[resultIndex].testExecution = {
              status: 'running',
              output: 'Iniciando execução...\n',
              startTime: new Date()
            };
          } else {
            updatedResults[resultIndex].testExecution!.status = 'running';
            updatedResults[resultIndex].testExecution!.output = 'Iniciando execução...\n';
            updatedResults[resultIndex].testExecution!.startTime = new Date();
          }
        }
        return updatedResults;
      });
    });

    this.socketService.onTestExecutionOutput().subscribe(data => {
      console.log('📤 Frontend: test-execution-output recebido', data);
      // Atualiza a saída do teste em tempo real
      this.testResults.update(results => {
        const updatedResults = [...results];
        const resultIndex = updatedResults.findIndex(r => r.filePath === data.originalFilePath);
        if (resultIndex !== -1) {
          if (!updatedResults[resultIndex].testExecution) {
            updatedResults[resultIndex].testExecution = {
              status: 'running',
              output: data.output,
              startTime: new Date()
            };
          } else {
            updatedResults[resultIndex].testExecution!.output += data.output;
          }
        }
        return updatedResults;
      });
    });

    this.socketService.onTestExecutionCompleted().subscribe(data => {
      console.log('✅ Frontend: test-execution-completed recebido', data);
      this.isExecutingTest.set(false);
      this.statusMessage.set(`Execução concluída: ${data.filePath} - ${data.status === 'success' ? 'Sucesso' : 'Erro'}`);
      
      // Atualiza o status final do teste
      this.testResults.update(results => {
        const updatedResults = [...results];
        const resultIndex = updatedResults.findIndex(r => r.filePath === data.originalFilePath);
        if (resultIndex !== -1) {
          if (!updatedResults[resultIndex].testExecution) {
            updatedResults[resultIndex].testExecution = {
              status: data.status,
              output: data.output,
              startTime: new Date(),
              endTime: new Date()
            };
          } else {
            updatedResults[resultIndex].testExecution!.status = data.status;
            updatedResults[resultIndex].testExecution!.output = data.output;
            updatedResults[resultIndex].testExecution!.endTime = new Date();
          }
        }
        return updatedResults;
      });
    });

    this.socketService.onTestExecutionError().subscribe(data => {
      console.log('❌ Frontend: test-execution-error recebido', data);
      this.isExecutingTest.set(false);
      this.errorMessage.set(`Erro na execução: ${data.error}`);
      
      // Atualiza o status de erro do teste
      this.testResults.update(results => {
        const updatedResults = [...results];
        const resultIndex = updatedResults.findIndex(r => r.filePath === data.originalFilePath);
        if (resultIndex !== -1) {
          if (!updatedResults[resultIndex].testExecution) {
            updatedResults[resultIndex].testExecution = {
              status: 'error',
              output: data.error,
              startTime: new Date(),
              endTime: new Date()
            };
          } else {
            updatedResults[resultIndex].testExecution!.status = 'error';
            updatedResults[resultIndex].testExecution!.output += `\nErro: ${data.error}`;
            updatedResults[resultIndex].testExecution!.endTime = new Date();
          }
        }
        return updatedResults;
      });
    });

    // Execução de todos os testes
    this.socketService.onAllTestsOutput().subscribe(data => {
      console.log('📤 Frontend: all-tests-output recebido', data);
      this.allTestsOutput.update(output => output + data.output);
      
      // Atualiza o objeto de execução
      this.allTestsExecution.update(execution => {
        if (!execution) {
          return {
            status: 'running',
            output: data.output,
            startTime: new Date()
          };
        } else {
          return {
            ...execution,
            output: execution.output + data.output
          };
        }
      });
    });

    this.socketService.onAllTestsCompleted().subscribe(data => {
      console.log('✅ Frontend: all-tests-completed recebido', data);
      this.isExecutingAllTests.set(false);
      this.statusMessage.set(`Execução de todos os testes concluída: ${data.success ? 'Sucesso' : 'Erro'}`);
      
      this.allTestsExecution.update(execution => {
        if (!execution) {
          return {
            status: data.success ? 'success' : 'error',
            output: data.output,
            startTime: new Date(),
            endTime: new Date()
          };
        } else {
          return {
            ...execution,
            status: data.success ? 'success' : 'error',
            output: data.output,
            endTime: new Date()
          };
        }
      });
    });

    this.socketService.onAllTestsError().subscribe(data => {
      console.log('❌ Frontend: all-tests-execution-error recebido', data);
      this.isExecutingAllTests.set(false);
      this.errorMessage.set(`Erro na execução de todos os testes: ${data.error}`);
      
      this.allTestsExecution.update(execution => {
        if (!execution) {
          return {
            status: 'error',
            output: data.error,
            startTime: new Date(),
            endTime: new Date()
          };
        } else {
          return {
            ...execution,
            status: 'error',
            output: data.error,
            endTime: new Date()
          };
        }
      });
    });

    // Correção de erros de teste
    this.socketService.onTestFixStarted().subscribe(data => {
      console.log('🔧 [EVENT] test-fix-started recebido', data);
      console.log('🔧 [EVENT] Iniciando correção para:', data.filePath);
      this.isFixingTest.set(true);
      this.fixingTestFile.set(data.filePath);
      this.statusMessage.set(`🤖 IA iniciou correção do teste: ${data.componentName}`);
    });

    this.socketService.onTestFixed().subscribe(data => {
      console.log('✅ [EVENT] test-fixed recebido', data);
      console.log('✅ [EVENT] Correção concluída para:', data.filePath);
      this.isFixingTest.set(false);
      this.fixingTestFile.set('');
      this.statusMessage.set(`✅ Teste corrigido com sucesso: ${data.componentName}`);
      
      // Atualiza o resultado do teste na lista sem afetar outros
      this.testResults.update(results => {
        const updatedResults = [...results];
        const resultIndex = updatedResults.findIndex(r => r.filePath === data.filePath);
        if (resultIndex !== -1) {
          console.log('✅ [EVENT] Atualizando teste na lista, índice:', resultIndex);
          // Atualiza apenas o teste específico
          const updatedTest: TestGenerationResult = {
            ...updatedResults[resultIndex],
            success: true,
            testCode: data.fixedTest.testCode,
            explanation: data.fixedTest.explanation,
            testCases: data.fixedTest.testCases,
            dependencies: data.fixedTest.dependencies,
            error: undefined,
            testExecution: undefined // Remove a execução anterior para resetar
          };
          updatedResults[resultIndex] = updatedTest;
          
          // Se o teste corrigido está sendo visualizado no modal, atualiza o selectedTestResult
          const currentSelected = this.selectedTestResult();
          if (currentSelected && currentSelected.filePath === data.filePath) {
            console.log('✅ [EVENT] Atualizando selectedTestResult no modal');
            this.selectedTestResult.set(updatedTest);
          }
          
          return updatedResults;
        } else {
          console.log('✅ [EVENT] Adicionando novo teste à lista');
          // Se não encontrar o teste na lista, adiciona como novo resultado
          const newResult: TestGenerationResult = {
            filePath: data.filePath,
            success: true,
            testCode: data.fixedTest.testCode,
            explanation: data.fixedTest.explanation,
            testCases: data.fixedTest.testCases,
            dependencies: data.fixedTest.dependencies,
            error: undefined
          };
          updatedResults.push(newResult);
          return updatedResults;
        }
      });
    });

    this.socketService.onTestFixError().subscribe(data => {
      console.error('❌ [EVENT] test-fix-error recebido', data);
      console.error('❌ [EVENT] Erro na correção:', data.error);
      this.isFixingTest.set(false);
      this.fixingTestFile.set('');
      this.errorMessage.set(`Erro ao melhorar teste: ${data.error}`);
    });
  }

  // Métodos da interface
  scanDirectory(): void {
    if (!this.directoryPath().trim()) {
      this.errorMessage.set('Por favor, insira um caminho de diretório');
      return;
    }

    this.scannedComponents.set([]);
    this.selectedFiles.set([]);
    this.testResults.set([]);
    this.socketService.scanDirectory(this.directoryPath());
  }

  toggleFileSelection(filePath: string): void {
    this.selectedFiles.update(files => {
      if (files.includes(filePath)) {
        return files.filter(f => f !== filePath);
      } else {
        return [...files, filePath];
      }
    });
  }

  selectAllFiles(): void {
    const allFiles = this.scannedComponents().map(c => c.filePath);
    this.selectedFiles.set(allFiles);
  }

  clearSelection(): void {
    this.selectedFiles.set([]);
  }

  toggleAllFiles(): void {
    if (this.selectedFiles().length === this.scannedComponents().length) {
      this.clearSelection();
    } else {
      this.selectAllFiles();
    }
  }

  viewFileContent(component: AngularComponent): void {
    const fullPath = `${this.directoryPath()}/${component.filePath}`;
    this.socketService.getFileContent(fullPath);
  }

  generateTests(): void {
    if (!this.hasSelectedFiles()) {
      this.errorMessage.set('Selecione pelo menos um arquivo');
      return;
    }

    const fullPaths = this.selectedFiles().map(file => `${this.directoryPath()}/${file}`);
    this.socketService.generateTests(fullPaths);
  }

  clearError(): void {
    this.errorMessage.set('');
  }

  getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
  }

  // Funções para a coluna de execução
  getExecutionChipColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'success': return 'primary';
      case 'error': return 'warn';
      case 'running': return 'accent';
      default: return 'primary';
    }
  }

  getExecutionIcon(status: string): string {
    switch (status) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'running': return 'hourglass_empty';
      default: return 'help';
    }
  }

  getComponentName(filePath: string): string {
    const component = this.scannedComponents().find(c => c.filePath === filePath);
    return component?.name || this.getFileName(filePath);
  }

  formatTestCode(code: string): string {
    if (!code) return '';
    
    // Remove caracteres de escape e formata o código (mesma lógica do createTestFile)
    let formattedCode = code
      .replace(/\\n/g, '\n')           // Converte \n para quebras de linha reais
      .replace(/\\t/g, '\t')           // Converte \t para tabs reais
      .replace(/\\"/g, '"')            // Converte \" para aspas duplas
      .replace(/\\'/g, "'")            // Converte \' para aspas simples
      .replace(/\\\\/g, '\\')          // Converte \\ para \
      .replace(/\\r/g, '\r')           // Converte \r para retorno de carro
      .trim();

    // Se o código ainda não tem quebras de linha adequadas, tenta formatar
    if (!formattedCode.includes('\n') && formattedCode.length > 100) {
      // Tenta adicionar quebras de linha em pontos lógicos
      formattedCode = formattedCode
        .replace(/;/g, ';\n')          // Adiciona quebra após ponto e vírgula
        .replace(/\{/g, '{\n')         // Adiciona quebra após {
        .replace(/\}/g, '\n}')         // Adiciona quebra antes de }
        .replace(/\)\s*\{/g, ') {\n')  // Adiciona quebra após ) {
        .replace(/,\s*/g, ',\n')       // Adiciona quebra após vírgulas
        .replace(/\n\s*\n/g, '\n')     // Remove linhas vazias duplicadas
        .trim();
    }

    // Aplica indentação básica para melhorar a legibilidade
    formattedCode = this.formatCode(formattedCode);
    
    return formattedCode;
  }

  async copyTestCode(code: string): Promise<void> {
    try {
      // Aplica a mesma formatação do createTestFile (sem syntax highlighting)
      let cleanCode = code
        .replace(/\\n/g, '\n')           // Converte \n para quebras de linha reais
        .replace(/\\t/g, '\t')           // Converte \t para tabs reais
        .replace(/\\"/g, '"')            // Converte \" para aspas duplas
        .replace(/\\'/g, "'")            // Converte \' para aspas simples
        .replace(/\\\\/g, '\\')          // Converte \\ para \
        .replace(/\\r/g, '\r')           // Converte \r para retorno de carro
        .trim();

      // Se o código ainda não tem quebras de linha adequadas, tenta formatar
      if (!cleanCode.includes('\n') && cleanCode.length > 100) {
        // Tenta adicionar quebras de linha em pontos lógicos
        cleanCode = cleanCode
          .replace(/;/g, ';\n')          // Adiciona quebra após ponto e vírgula
          .replace(/\{/g, '{\n')         // Adiciona quebra após {
          .replace(/\}/g, '\n}')         // Adiciona quebra antes de }
          .replace(/\)\s*\{/g, ') {\n')  // Adiciona quebra após ) {
          .replace(/,\s*/g, ',\n')       // Adiciona quebra após vírgulas
          .replace(/\n\s*\n/g, '\n')     // Remove linhas vazias duplicadas
          .trim();
      }

      // Aplica indentação básica para melhorar a legibilidade
      cleanCode = this.formatCode(cleanCode);
        
      await navigator.clipboard.writeText(cleanCode);
      this.statusMessage.set('Código copiado para a área de transferência!');
      
      // Limpa a mensagem após 3 segundos
      setTimeout(() => {
        this.statusMessage.set('');
      }, 3000);
    } catch (err) {
      this.errorMessage.set('Erro ao copiar código para a área de transferência');
    }
  }

  async createTestFile(result: TestGenerationResult): Promise<void> {
    if (!result.success || !result.testCode) {
      this.errorMessage.set('Não é possível criar arquivo de teste: código inválido');
      return;
    }

    try {
      this.isCreatingTest.set(true);
      this.statusMessage.set('Criando arquivo de teste...');

      // Remove caracteres de escape do código e formata adequadamente
      let cleanCode = result.testCode
        .replace(/\\n/g, '\n')           // Converte \n para quebras de linha reais
        .replace(/\\t/g, '\t')           // Converte \t para tabs reais
        .replace(/\\"/g, '"')            // Converte \" para aspas duplas
        .replace(/\\'/g, "'")            // Converte \' para aspas simples
        .replace(/\\\\/g, '\\')          // Converte \\ para \
        .replace(/\\r/g, '\r')           // Converte \r para retorno de carro
        .trim();

      // Se o código ainda não tem quebras de linha adequadas, tenta formatar
      if (!cleanCode.includes('\n') && cleanCode.length > 100) {
        // Tenta adicionar quebras de linha em pontos lógicos
        cleanCode = cleanCode
          .replace(/;/g, ';\n')          // Adiciona quebra após ponto e vírgula
          .replace(/\{/g, '{\n')         // Adiciona quebra após {
          .replace(/\}/g, '\n}')         // Adiciona quebra antes de }
          .replace(/\)\s*\{/g, ') {\n')  // Adiciona quebra após ) {
          .replace(/,\s*/g, ',\n')       // Adiciona quebra após vírgulas
          .replace(/\n\s*\n/g, '\n')     // Remove linhas vazias duplicadas
          .trim();
      }

      // Aplica indentação básica para melhorar a legibilidade
      cleanCode = this.formatCode(cleanCode);

      // Gera o caminho do arquivo de teste baseado no arquivo original
      const fullTestPath = this.generateTestFilePath(result.filePath);

      // Chama o serviço para criar o arquivo
      this.socketService.createTestFile(fullTestPath, cleanCode);

    } catch (err) {
      this.isCreatingTest.set(false);
      this.errorMessage.set('Erro ao criar arquivo de teste');
    }
  }

  private generateTestFilePath(originalPath: string): string {
    // Remove a extensão do arquivo original e adiciona .spec.ts
    const pathParts = originalPath.split('.');
    if (pathParts.length > 1) {
      pathParts[pathParts.length - 1] = 'spec.ts';
    } else {
      pathParts.push('spec.ts');
    }
    return pathParts.join('.');
  }

  private formatCode(code: string): string {
    const lines = code.split('\n');
    let formattedLines: string[] = [];
    let indentLevel = 0;
    const indentSize = 2;

    for (let line of lines) {
      line = line.trim();
      if (!line) {
        formattedLines.push('');
        continue;
      }

      // Decrementa indentação antes de fechar chaves
      if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Adiciona a linha com indentação
      const indent = ' '.repeat(indentLevel * indentSize);
      formattedLines.push(indent + line);

      // Incrementa indentação após abrir chaves
      if (line.endsWith('{') || line.endsWith('[') || line.endsWith('(')) {
        indentLevel++;
      }
    }

    return formattedLines.join('\n');
  }

  // Métodos para execução de teste
  executeTest(result: TestGenerationResult): void {
    console.log('🚀 Frontend: executeTest chamado', result.filePath);
    
    if (!result.success || !result.testCode) {
      this.errorMessage.set('Não é possível executar teste: código inválido');
      return;
    }

    this.isExecutingTest.set(true);
    this.statusMessage.set('Executando teste...');

     // Inicializa o objeto de execução se não existir
     if (!result.testExecution) {
       result.testExecution = {
         status: 'running',
         output: '',
         startTime: new Date()
       };
     } else {
       result.testExecution.status = 'running';
       result.testExecution.output = '';
       result.testExecution.startTime = new Date();
     }

     // O resultado.filePath é o arquivo original (ex: component.ts). Precisamos enviar o caminho .spec.ts (full path) e manter o original para mapeamento do card
     const specPath = this.generateTestFilePath(result.filePath);
     
     // Chama o serviço para executar o teste
     this.socketService.executeTest(specPath, result.testCode, result.filePath);
   }

  getExecutionStatusClass(status: string): string {
    switch (status) {
      case 'running': return 'running';
      case 'success': return 'success';
      case 'error': return 'error';
      default: return '';
    }
  }

  getExecutionStatusText(status: string): string {
    switch (status) {
      case 'running': return 'Executando';
      case 'success': return 'Sucesso';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  }

  // Método para executar todos os testes
  executeAllTests(): void {
    if (!this.directoryPath().trim()) {
      this.errorMessage.set('Por favor, selecione um diretório primeiro');
      return;
    }

    this.isExecutingAllTests.set(true);
    this.statusMessage.set('Executando todos os testes...');
    this.allTestsOutput.set('');
    this.allTestsExecution.set({
      status: 'running',
      output: 'Iniciando execução de todos os testes...\n',
      startTime: new Date()
    });

    this.socketService.executeAllTests(this.directoryPath());
  }

  // Método para gerar teste individual para um componente específico
  generateTestForComponent(component: AngularComponent): void {
    if (this.isCreatingTest()) {
      return;
    }

    // Define apenas este componente como selecionado
    this.selectedFiles.set([component.filePath]);
    
    // Inicia a geração de teste
    this.isCreatingTest.set(true);
    this.statusMessage.set(`Gerando teste para ${component.name}...`);
    this.errorMessage.set('');
    
    // Chama o serviço para gerar teste
    this.socketService.generateTests([component.filePath]);
  }

  // Métodos para status de execução de todos os testes
  getAllTestsExecutionStatusClass(status: string): string {
    switch (status) {
      case 'running': return 'running';
      case 'success': return 'success';
      case 'error': return 'error';
      default: return '';
    }
  }

  getAllTestsExecutionStatusText(status: string): string {
    switch (status) {
      case 'running': return 'Executando';
      case 'success': return 'Sucesso';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  }

  // Métodos para modal de detalhes
  viewTestDetails(result: TestGenerationResult): void {
    this.selectedTestResult.set(result);
  }

  closeTestDetails(): void {
    this.selectedTestResult.set(null);
  }

  // Método para formatar mensagens de erro
  formatErrorMessage(error: string | undefined): string {
    if (!error) return 'Erro desconhecido';
    
    // Tenta formatar como JSON se possível
    try {
      const parsed = JSON.parse(error);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Se não for JSON, retorna o erro original
      return error;
    }
  }

  // Métodos para modal de visualização do código do arquivo
  closeFileContentModal(): void {
    this.fileContent.set('');
    this.currentFilePath.set('');
  }

  // Método para calcular tempo de execução
  getExecutionTime(execution: { startTime?: Date; endTime?: Date }): string {
    if (!execution.startTime) return '';
    
    const endTime = execution.endTime || new Date();
    const duration = endTime.getTime() - execution.startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const milliseconds = duration % 1000;
    
    if (seconds > 0) {
      return `${seconds}.${Math.floor(milliseconds / 100)}s`;
    } else {
      return `${milliseconds}ms`;
    }
  }

  // Método para refazer um teste específico
  retryTest(result: TestGenerationResult): void {
    if (!result.success) {
      console.log('🔄 Refazendo teste para:', result.filePath);
      
      // Marca que está refazendo este teste específico
      this.isGeneratingTests.set(true);
      this.statusMessage.set(`Refazendo teste: ${result.filePath}`);
      
      // Marca o teste como "processando" sem removê-lo da lista
      this.testResults.update(results => {
        return results.map(r => {
          if (r.filePath === result.filePath) {
            return {
              ...r,
              success: false,
              error: 'Processando...',
              testCode: '',
              explanation: '',
              testCases: [],
              dependencies: []
            };
          }
          return r;
        });
      });
      
      // Salva a seleção original
      const originalSelection = [...this.selectedFiles()];
      
      // Seleciona temporariamente apenas o arquivo com erro
      this.selectedFiles.set([result.filePath]);
      
      // Gera o teste novamente
      this.socketService.generateTests([result.filePath]);
      
      // Restaura a seleção original após um pequeno delay
      setTimeout(() => {
        this.selectedFiles.set(originalSelection);
      }, 100);
    }
  }

  // Método para abrir dialog de prompt customizado
  fixTestError(result: TestGenerationResult): void {
    console.log('🔧 Abrindo dialog de prompt customizado para:', result.filePath);
    
    // Define o teste selecionado e abre o dialog
    this.selectedTestForPrompt.set(result);
    this.customPrompt.set(result.success 
      ? 'Por favor, analise e melhore este teste para torná-lo mais robusto e abrangente'
      : (result.error || 'Erro desconhecido')
    );
    this.showCustomPromptDialog.set(true);
  }

  // Método para processar prompt customizado
  processCustomPrompt(): void {
    const result = this.selectedTestForPrompt();
    if (!result) return;

    console.log('🔧 Processando prompt customizado para:', result.filePath);
    
    // Busca o componente original para enviar para a IA
    const component = this.scannedComponents().find(c => c.filePath === result.filePath);
    if (!component) {
      this.errorMessage.set('Componente não encontrado para ajuste');
      return;
    }

    // Carrega o código do componente
    const fullPath = `${this.directoryPath()}/${component.filePath}`;
    this.socketService.getFileContent(fullPath);
    
    // Aguarda o conteúdo ser carregado e então envia para ajuste
    const subscription = this.socketService.onFileContent().subscribe(data => {
      if (data.filePath === fullPath) {
        subscription.unsubscribe();
        
        this.socketService.fixTestError({
          componentCode: data.content,
          testCode: result.testCode || '',
          errorMessage: this.customPrompt(),
          componentName: component.name,
          filePath: result.filePath
        });
      }
    });

    // Fecha o dialog
    this.closeCustomPromptDialog();
  }

  // Método para gerar um novo teste baseado no erro de execução
  regenerateTestFromExecutionError(result: TestGenerationResult): void {
    console.log('🔄 [DEBUG] Botão clicado - Regenerando teste com erro de execução');
    console.log('🔄 [DEBUG] FilePath:', result.filePath);
    console.log('🔄 [DEBUG] DirectoryPath:', this.directoryPath());
    console.log('🔄 [DEBUG] TestExecution:', result.testExecution);
    
    // Verifica se há um erro de execução
    if (!result.testExecution || result.testExecution.status !== 'error') {
      console.error('❌ [DEBUG] Não há erro de execução para corrigir');
      this.errorMessage.set('Não há erro de execução para corrigir');
      return;
    }

    console.log('✅ [DEBUG] Erro de execução encontrado:', result.testExecution.output.substring(0, 200));

    // Extrai o caminho relativo do filePath completo
    let relativePath = result.filePath;
    
    // Se o filePath contém o caminho do diretório base, remove-o
    const directoryPath = this.directoryPath();
    if (directoryPath && result.filePath.includes(directoryPath)) {
      relativePath = result.filePath.replace(directoryPath, '').replace(/^[\/\\]+/, '');
      console.log('📝 [DEBUG] Caminho relativo extraído:', relativePath);
    }
    
    // Busca o componente original pelo caminho relativo
    const component = this.scannedComponents().find(c => c.filePath === relativePath);
    
    if (!component) {
      console.error('❌ [DEBUG] Componente não encontrado');
      console.error('❌ [DEBUG] Caminho procurado:', relativePath);
      console.error('❌ [DEBUG] Componentes disponíveis:', this.scannedComponents().map(c => c.filePath));
      this.errorMessage.set('Componente não encontrado');
      return;
    }

    console.log('✅ [DEBUG] Componente encontrado:', component.name);

    // Define que está corrigindo este teste específico
    this.isFixingTest.set(true);
    this.fixingTestFile.set(result.filePath);
    this.statusMessage.set(`🔄 Carregando código do componente: ${component.name}...`);
    console.log('✅ [DEBUG] Estado atualizado - isFixingTest:', true, 'fixingTestFile:', result.filePath);

    // Usa o filePath completo do resultado (que já é o caminho completo)
    console.log('📁 [DEBUG] Carregando arquivo:', result.filePath);
    this.socketService.getFileContent(result.filePath);
    
    // Aguarda o conteúdo ser carregado e então envia para ajuste
    const subscription = this.socketService.onFileContent().subscribe(data => {
      console.log('📥 [DEBUG] Conteúdo do arquivo recebido:', data.filePath);
      if (data.filePath === result.filePath) {
        subscription.unsubscribe();
        console.log('✅ [DEBUG] Unsubscribed do file-content listener');
        
        // Prepara a mensagem de erro com detalhes da execução
        const errorDetails = `Erro na execução do teste:\n\n${result.testExecution!.output}\n\nPor favor, corrija o teste para que ele execute com sucesso.`;
        
        console.log('🚀 [DEBUG] Enviando para fixTestError');
        console.log('📝 [DEBUG] ComponentCode length:', data.content.length);
        console.log('📝 [DEBUG] TestCode length:', result.testCode?.length || 0);
        console.log('📝 [DEBUG] ErrorDetails length:', errorDetails.length);
        
        this.statusMessage.set(`🤖 Enviando para IA corrigir o teste...`);
        
        this.socketService.fixTestError({
          componentCode: data.content,
          testCode: result.testCode || '',
          errorMessage: errorDetails,
          componentName: component.name,
          filePath: result.filePath
        });
        
        console.log('✅ [DEBUG] fixTestError chamado com sucesso');
      }
    });
    
    // Adiciona um timeout para debug caso algo dê errado
    setTimeout(() => {
      if (this.isFixingTest() && this.fixingTestFile() === result.filePath) {
        console.warn('⏱️ [DEBUG] Timeout - parece que o processo está demorando mais que o esperado');
      }
    }, 10000);
  }

  // Método para fechar dialog de prompt customizado
  closeCustomPromptDialog(): void {
    this.showCustomPromptDialog.set(false);
    this.selectedTestForPrompt.set(null);
    this.customPrompt.set('');
  }
}
