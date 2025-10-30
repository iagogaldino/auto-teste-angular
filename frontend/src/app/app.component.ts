import { Component, signal, computed, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from './services/socket.service';
import { ConfigService, EnvironmentConfig } from './services/config.service';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTreeModule } from '@angular/material/tree';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { SplashComponent } from './components/splash/splash.component';

// PrismJS global (loaded via CDN in index.html)
declare const Prism: any;

// Tipo da árvore para representar a estrutura do projeto
export interface TreeNode { name: string; path: string; children?: TreeNode[]; isFile: boolean; component?: AngularComponent; displayName?: string; result?: TestGenerationResult }

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
    MatChipsModule,
    MatExpansionModule,
    MatStepperModule,
    MatSelectModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatTreeModule,
    MatProgressSpinnerModule,
    SplashComponent
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
  
  // Estrutura de árvore derivada dos componentes escaneados
  // Controle e fonte de dados da árvore
  treeControl = new NestedTreeControl<TreeNode>(node => node.children || []);
  treeDataSource = new MatTreeNestedDataSource<TreeNode>();
  
  // Progresso
  scanProgress = signal<ScanProgressData | null>(null);
  testProgress = signal<TestGenerationProgress | null>(null);
  
  // Resultados
  fileContent = signal<string>('');
  currentFilePath = signal<string>('');
  testResults = signal<TestGenerationResult[]>([]);
  resultsTreeNodes = computed<TreeNode[]>(() => this.testResults().map(r => ({
    name: this.getFileName(r.filePath),
    path: r.filePath,
    isFile: true,
    result: r
  })));

  // Exibição inline para resultados (código de teste)
  resultExpanded = signal<{ [path: string]: boolean }>({});

  isResultExpanded(path: string): boolean {
    return !!this.resultExpanded()[path];
  }

  toggleResultInline(node: { result?: TestGenerationResult; path: string }): void {
    if (!node.result) return;
    const key = node.path;
    const expanded = this.resultExpanded()[key];
    this.resultExpanded.update(m => ({ ...m, [key]: !expanded }));
    if (!expanded) {
      setTimeout(() => { try { Prism && Prism.highlightAll(); } catch {} }, 0);
    }
  }

  getResultInlineContent(node: { result?: TestGenerationResult }): string {
    if (!node.result) return '';
    return this.formatTestCode(node.result.testCode || '');
  }
  
  // Exibição inline de arquivos na lista
  inlineFileContents = signal<{ [path: string]: string }>({});
  expandedFiles = signal<{ [path: string]: boolean }>({});
  
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
  
  // Modal de configuração
  showConfigModal = signal<boolean>(false);
  isSavingConfig = signal<boolean>(false);
  configSaveSuccess = signal<boolean>(false);
  configSaveMessage = signal<string>('');
  configData = signal<EnvironmentConfig>({
    NODE_ENV: 'development',
    PORT: 3000,
    CORS_ORIGIN: 'http://localhost:4200',
    LOG_LEVEL: 'info',
    OPENAI_API_KEY: '',
    AI_PROVIDER: 'openai'
  });
  
  // Individual config field signals for two-way binding
  configNodeEnv = signal<string>('development');
  configPort = signal<number>(3000);
  configCorsOrigin = signal<string>('http://localhost:4200');
  configLogLevel = signal<string>('info');
  configOpenaiKey = signal<string>('');
  configAiProvider = signal<'openai' | 'stackspot'>('openai');
  configStackspotClientId = signal<string>('');
  configStackspotClientKey = signal<string>('');
  configStackspotRealm = signal<string>('');
  configStackspotTokenUrl = signal<string>('');
  configStackspotCompletionsUrl = signal<string>('');
  configStackspotAgentChatUrl = signal<string>('');
  configDatabaseUrl = signal<string>('');
  configJwtSecret = signal<string>('');
  configUserAgent = signal<string>('');
  
  // Computed signals
  hasSelectedFiles = computed(() => this.selectedFiles().length > 0);
  canGenerateTests = computed(() => this.hasSelectedFiles() && !this.isGeneratingTests());
  hasCreatedTests = computed(() => this.testResults().length > 0);
  
  // Completion indicators
  scanCompleted = computed(() => !this.isScanning() && this.scannedComponents().length > 0);
  testsGenerated = computed(() => !this.isGeneratingTests() && this.testResults().length > 0);
  
  // Contadores para resultados
  successCount = computed(() => this.testResults().filter(r => r.success).length);
  errorCount = computed(() => this.testResults().filter(r => !r.success).length);
  
  // Mensagens de status
  statusMessage = signal<string>('Conectando ao servidor...');
  errorMessage = signal<string>('');

  // Splash screen control
  showSplash = signal<boolean>(true);

  // Histórico de diretórios recentes
  private recentDirectoriesKey = 'recentDirectories';
  recentDirectories = signal<string[]>([]);

  // Stepper reference
  @ViewChild(MatStepper) stepper?: MatStepper;
  @ViewChild('allTestsOutputContainer') allTestsOutputContainer?: ElementRef<HTMLDivElement>;

  constructor(
    private socketService: SocketService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.setupSocketListeners();
    this.socketService.connect();
    this.loadRecentDirectories();
    // Auto-hide splash after animation time (fallback)
    setTimeout(() => this.showSplash.set(false), 3000);
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
      // Constrói a árvore a partir dos caminhos dos arquivos dos componentes
      this.treeDataSource.data = this.buildTreeFromComponents(this.scannedComponents());
      this.treeControl.dataNodes = this.treeDataSource.data;
      
      // Mensagem mais informativa
      const totalFiles = data.result.totalFiles || 0;
      const componentCount = data.result.components?.length || 0;
      
      if (componentCount === 0) {
        this.statusMessage.set(`Nenhum componente Angular encontrado (${totalFiles} arquivos .ts escaneados)`);
        this.errorMessage.set('Nenhum componente Angular foi detectado. Verifique se os arquivos contêm o decorator @Component.');
      } else {
        this.statusMessage.set(`Escaneamento concluído: ${componentCount} componentes encontrados em ${totalFiles} arquivos`);
        this.errorMessage.set('');
      }
      
      // Auto-avança para o próximo step após o escaneamento concluir
      if (data.result.components && data.result.components.length > 0 && this.stepper) {
        setTimeout(() => {
          this.stepper?.next();
        }, 500); // Pequeno delay para melhorar a UX
      }

      // Salva diretório escaneado com sucesso no histórico
      const scannedDir = this.directoryPath();
      if (scannedDir && scannedDir.trim()) {
        this.addRecentDirectory(scannedDir);
      }
    });

    this.socketService.onScanError().subscribe(data => {
      this.isScanning.set(false);
      this.scanProgress.set(null);
      this.errorMessage.set(`Erro no escaneamento: ${data.error}`);
    });

    // Conteúdo do arquivo
    this.socketService.onFileContent().subscribe(data => {
      // Não usamos mais modal; apenas cache para exibição inline
      this.inlineFileContents.update(map => ({ ...map, [data.filePath]: data.content }));
      this.statusMessage.set(`Conteúdo carregado: ${data.filePath}`);
      setTimeout(() => { try { Prism && Prism.highlightAll(); } catch {} }, 0);
    });

    this.socketService.onFileContentError().subscribe(data => {
      // Se falhar ao carregar o arquivo, interrompe qualquer loading pendente
      this.isFixingTest.set(false);
      this.fixingTestFile.set('');
      this.errorMessage.set(`Erro ao carregar arquivo: ${data.error}`);
    });

    // Geração de testes
    this.socketService.onTestGenerationStarted().subscribe(data => {
      this.isGeneratingTests.set(true);
      // Reset progress to force waiting animation until first progress arrives
      this.testProgress.set(null);
      
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
      
      // Auto-avança para o próximo step após a geração de testes concluir
      if (data.results && data.results.length > 0 && this.stepper) {
        setTimeout(() => {
          this.stepper?.next();
        }, 500); // Pequeno delay para melhorar a UX
      }
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

      // Auto-scroll se o usuário estiver perto do final do log
      setTimeout(() => this.scrollAllTestsToBottomIfNeeded(), 0);
    });

    this.socketService.onAllTestsCompleted().subscribe(data => {
      
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

      // Após concluir, rolar para o final
      setTimeout(() => this.scrollAllTestsToBottomIfNeeded(), 0);
    });

    this.socketService.onAllTestsError().subscribe(data => {
      
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

      // Após erro, rolar para o final
      setTimeout(() => this.scrollAllTestsToBottomIfNeeded(), 0);
    });

    // Correção de erros de teste
    this.socketService.onTestFixStarted().subscribe(data => {
      
      this.isFixingTest.set(true);
      this.fixingTestFile.set(data.filePath);
      this.statusMessage.set(`🤖 IA iniciou correção do teste: ${data.componentName}`);
    });

    this.socketService.onTestFixed().subscribe(data => {
      
      this.isFixingTest.set(false);
      this.fixingTestFile.set('');
      this.statusMessage.set(`✅ Teste corrigido com sucesso: ${data.componentName}`);
      
      // Atualiza o resultado do teste na lista sem afetar outros
      this.testResults.update(results => {
        const updatedResults = [...results];
        const resultIndex = updatedResults.findIndex(r => r.filePath === data.filePath);
        if (resultIndex !== -1) {
          
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
            
            this.selectedTestResult.set(updatedTest);
          }
          
          return updatedResults;
        } else {
          
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

  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;

  private buildTreeFromComponents(components: AngularComponent[]): TreeNode[] {
    // Lista plana de arquivos usando o tree como lista
    const nodes: TreeNode[] = components.map(comp => {
      const normalized = comp.filePath.replace(/\\/g, '/');
      const fileName = normalized.split('/').pop() || normalized;
      return {
        name: fileName,
        path: normalized,
        isFile: true,
        component: comp
      } as TreeNode;
    }).sort((a, b) => a.name.localeCompare(b.name));
    return nodes;
  }

  private getCommonPrefixSegments(paths: string[]): string[] {
    if (paths.length === 0) return [];
    const splitPaths = paths.map(p => p.split('/').filter(s => !!s));
    const first = splitPaths[0];
    const prefix: string[] = [];
    for (let i = 0; i < first.length; i++) {
      const segment = first[i];
      if (splitPaths.every(arr => arr[i] === segment)) {
        prefix.push(segment);
      } else {
        break;
      }
    }
    return prefix;
  }

  private getPreferredRootSegment(paths: string[]): string | null {
    const firstSegments: Record<string, number> = {};
    let hasSrcAnywhere = false;
    for (const p of paths) {
      const segs = p.split('/').filter(s => !!s);
      if (segs.length === 0) continue;
      firstSegments[segs[0]] = (firstSegments[segs[0]] || 0) + 1;
      if (segs.includes('src')) hasSrcAnywhere = true;
    }
    // Se existir 'src' em qualquer caminho, usamos 'src' como raiz
    if (hasSrcAnywhere) return 'src';
    // Caso contrário, usa o primeiro segmento mais frequente
    let best: string | null = null;
    let count = -1;
    for (const [seg, c] of Object.entries(firstSegments)) {
      if (c > count) { best = seg; count = c; }
    }
    return best;
  }

  // Expande/recolhe todos os nós da árvore
  expandAllNodes(): void {
    const nodes = this.treeControl.dataNodes && this.treeControl.dataNodes.length > 0
      ? this.treeControl.dataNodes
      : this.treeDataSource.data;
    nodes.forEach(n => this.treeControl.expandDescendants(n));
  }

  collapseAllNodes(): void {
    const nodes = this.treeControl.dataNodes && this.treeControl.dataNodes.length > 0
      ? this.treeControl.dataNodes
      : this.treeDataSource.data;
    nodes.forEach(n => this.treeControl.collapseDescendants(n));
  }

  private expandCollapseRecursive(node: TreeNode, expand: boolean): void {}

  viewFileContent(component: AngularComponent): void {
    const fullPath = `${this.directoryPath()}/${component.filePath}`;
    this.socketService.getFileContent(fullPath);
  }

  // Inline code viewing helpers
  isFileExpanded(path: string): boolean {
    return !!this.expandedFiles()[path];
  }

  getInlineContent(path: string): string {
    // path recebido pode ser relativo; no cache usamos caminho completo
    const fullPath = path.includes(this.directoryPath()) ? path : `${this.directoryPath()}/${path}`;
    return this.inlineFileContents()[fullPath] || '';
  }

  toggleInlineFile(node: { path: string; component?: AngularComponent }): void {
    const path = node.path;
    const fullPath = `${this.directoryPath()}/${path}`;
    const expanded = this.expandedFiles()[path];
    this.expandedFiles.update(m => ({ ...m, [path]: !expanded }));
    if (!expanded) {
      // Expanding: load content if not cached
      if (!this.inlineFileContents()[fullPath]) {
        this.socketService.getFileContent(fullPath);
      }
      setTimeout(() => { try { Prism && Prism.highlightAll(); } catch {} }, 0);
    }
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

  // ===== Diretórios Recentes (localStorage) =====
  private async loadRecentDirectories(): Promise<void> {
    try {
      const res = await fetch('/api/directories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.directories)) {
          this.recentDirectories.set(data.directories);
          return;
        }
      }
    } catch {}
    // Fallback local
    try {
      const raw = localStorage.getItem(this.recentDirectoriesKey);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) this.recentDirectories.set(list);
      }
    } catch {}
  }

  private saveRecentDirectoriesFallback(): void {
    try {
      localStorage.setItem(this.recentDirectoriesKey, JSON.stringify(this.recentDirectories()));
    } catch {}
  }

  async addRecentDirectory(path: string): Promise<void> {
    if (!path) return;
    const trimmed = path.trim();
    if (!trimmed) return;
    try {
      const res = await fetch('/api/directories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: trimmed })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.directories)) {
          this.recentDirectories.set(data.directories);
          return;
        }
      }
    } catch {}
    // fallback local
    this.recentDirectories.update(list => {
      const exists = list.some(p => p.toLowerCase() === trimmed.toLowerCase());
      return exists ? list : [trimmed, ...list].slice(0, 10);
    });
    this.saveRecentDirectoriesFallback();
  }

  selectRecentDirectory(path: string): void {
    this.directoryPath.set(path);
  }

  async removeRecentDirectory(path: string, event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    try {
      const res = await fetch('/api/directories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.directories)) {
          this.recentDirectories.set(data.directories);
          return;
        }
      }
    } catch {}
    // fallback local
    this.recentDirectories.update(list => list.filter(p => p !== path));
    this.saveRecentDirectoriesFallback();
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
    return this.cleanAndFormatCode(code);
  }

  async copyTestCode(code: string): Promise<void> {
    try {
      let cleanCode = this.cleanAndFormatCode(code);
        
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
      let cleanCode = this.cleanAndFormatCode(result.testCode);

      // Gera o caminho do arquivo de teste baseado no arquivo original
      const fullTestPath = this.generateTestFilePath(result.filePath);

      // Chama o serviço para criar o arquivo
      this.socketService.createTestFile(fullTestPath, cleanCode);

    } catch (err) {
      this.isCreatingTest.set(false);
      this.errorMessage.set('Erro ao criar arquivo de teste');
    }
  }

  private cleanAndFormatCode(code: string): string {
    let processed = (code || '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, '\\')
      .replace(/\\r/g, '\r')
      .trim();

    if (!processed.includes('\n') && processed.length > 100) {
      processed = processed
        .replace(/;/g, ';\n')
        .replace(/\{/g, '{\n')
        .replace(/\}/g, '\n}')
        .replace(/\)\s*\{/g, ') {\n')
        .replace(/,\s*/g, ',\n')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    }

    return this.formatCode(processed);
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
     
    // Expande inline na lista de resultados para exibir o log ao lado
    this.resultExpanded.update(m => ({ ...m, [result.filePath]: true }));

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

    // Garantir que role para o fim ao iniciar
    setTimeout(() => this.scrollAllTestsToBottomIfNeeded(), 0);

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

  private scrollAllTestsToBottomIfNeeded(): void {
    const container = this.allTestsOutputContainer?.nativeElement;
    if (!container) return;

    const threshold = 80; // px de tolerância para considerar que o usuário está no fim
    const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    if (isNearBottom) {
      // Garante que o layout foi atualizado e repete após um pequeno delay
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 50);
      });
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

    // Feedback imediato de loading
    this.isFixingTest.set(true);
    this.fixingTestFile.set(result.filePath);
    this.statusMessage.set('🔄 Preparando dados para a IA...');

    // Captura o prompt antes de fechar o modal (ele limpa o signal)
    const promptMessage = (this.customPrompt() || '').trim();
    if (!promptMessage) {
      this.isFixingTest.set(false);
      this.fixingTestFile.set('');
      this.errorMessage.set('Por favor, preencha as instruções para a IA.');
      return;
    }

    // Normaliza o caminho para comparar com os componentes escaneados (que usam caminho relativo)
    const baseDir = this.directoryPath();
    const normalize = (p: string) => (p || '').replace(/\\/g, '/');
    const base = normalize(baseDir);
    const resultPath = normalize(result.filePath);

    // Remove prefixo do diretório base se presente
    let relativePath = resultPath;
    if (base && (resultPath === base || resultPath.startsWith(base + '/'))) {
      relativePath = resultPath.slice(base.length).replace(/^\//, '');
    }

    // Busca o componente original para enviar para a IA (comparação normalizada)
    const component = this.scannedComponents().find(c => {
      const compPath = normalize(c.filePath);
      return compPath === relativePath || compPath === resultPath;
    });
    if (!component) {
      this.errorMessage.set('Componente não encontrado para ajuste');
      this.isFixingTest.set(false);
      this.fixingTestFile.set('');
      return;
    }

    // Carrega o código do componente e, depois, tenta carregar o código do teste (.spec.ts)
    const compPathNorm = normalize(component.filePath);
    const fullPath = compPathNorm.startsWith(base + '/') || compPathNorm === base
      ? compPathNorm
      : `${base}/${compPathNorm}`;
    this.socketService.getFileContent(fullPath);

    const subscription = this.socketService.onFileContent().subscribe(first => {
      if (first.filePath === fullPath) {
        // Validação do componente
        const componentCode = (first.content || '').trim();
        if (!componentCode) {
          subscription.unsubscribe();
          this.isFixingTest.set(false);
          this.fixingTestFile.set('');
          this.errorMessage.set('Não foi possível carregar o código do componente para enviar à IA.');
          return;
        }

        // Agora tenta ler o .spec.ts atual do disco
        const specRelative = this.generateTestFilePath(component.filePath);
        const specFull = specRelative.startsWith(base + '/') || specRelative === base
          ? specRelative
          : `${base}/${specRelative}`;
        this.socketService.getFileContent(specFull);

        const specSub = this.socketService.onFileContent().subscribe(second => {
          if (second.filePath === specFull) {
            specSub.unsubscribe();
            subscription.unsubscribe();
            const testCodeToSend = (second.content || '').trim() || (result.testCode || '');
            this.socketService.fixTestError({
              componentCode,
              testCode: testCodeToSend,
              errorMessage: promptMessage,
              componentName: component.name,
              filePath: result.filePath
            });
          }
        });

        // Fallback após 2s se não receber o arquivo de teste
        setTimeout(() => {
          try { specSub.unsubscribe(); } catch {}
          try { subscription.unsubscribe(); } catch {}
          if (this.isFixingTest()) {
            const testCodeToSend = (result.testCode || '').trim();
            this.socketService.fixTestError({
              componentCode,
              testCode: testCodeToSend,
              errorMessage: promptMessage,
              componentName: component.name,
              filePath: result.filePath
            });
          }
        }, 2000);
      }
    });

    // Fecha o dialog
    this.closeCustomPromptDialog();
  }

  // Método para gerar um novo teste baseado no erro de execução
  regenerateTestFromExecutionError(result: TestGenerationResult): void {
    
    
    // Verifica se há um erro de execução
    if (!result.testExecution || result.testExecution.status !== 'error') {
      
      this.errorMessage.set('Não há erro de execução para corrigir');
      return;
    }

    

    // Extrai o caminho relativo do filePath completo
    let relativePath = result.filePath;
    
    // Se o filePath contém o caminho do diretório base, remove-o
    const directoryPath = this.directoryPath();
    if (directoryPath && result.filePath.includes(directoryPath)) {
      relativePath = result.filePath.replace(directoryPath, '').replace(/^[\/\\]+/, '');
      
    }
    
    // Busca o componente original pelo caminho relativo
    const component = this.scannedComponents().find(c => c.filePath === relativePath);
    
    if (!component) {
      
      this.errorMessage.set('Componente não encontrado');
      return;
    }

    

    // Define que está corrigindo este teste específico
    this.isFixingTest.set(true);
    this.fixingTestFile.set(result.filePath);
    this.statusMessage.set(`🔄 Carregando código do componente: ${component.name}...`);
    

    // Usa o filePath completo do resultado (que já é o caminho completo)
    
    this.socketService.getFileContent(result.filePath);
    
    // Aguarda o conteúdo ser carregado e então envia para ajuste
    const subscription = this.socketService.onFileContent().subscribe(data => {
      
      if (data.filePath === result.filePath) {
        subscription.unsubscribe();
        
        
        // Prepara a mensagem de erro com detalhes da execução
        const errorDetails = `Erro na execução do teste:\n\n${result.testExecution!.output}\n\nPor favor, corrija o teste para que ele execute com sucesso.`;
        
        
        
        this.statusMessage.set(`🤖 Enviando para IA corrigir o teste...`);
        
        this.socketService.fixTestError({
          componentCode: data.content,
          testCode: result.testCode || '',
          errorMessage: errorDetails,
          componentName: component.name,
          filePath: result.filePath
        });
        
        
      }
    });
    
    // Adiciona um timeout para debug caso algo dê errado
    setTimeout(() => {
      if (this.isFixingTest() && this.fixingTestFile() === result.filePath) {
        
      }
    }, 10000);
  }

  // Método para fechar dialog de prompt customizado
  closeCustomPromptDialog(): void {
    this.showCustomPromptDialog.set(false);
    this.selectedTestForPrompt.set(null);
    this.customPrompt.set('');
  }

  // Métodos para configuração
  openConfigModal(): void {
    this.showConfigModal.set(true);
    this.loadConfig();
  }

  closeConfigModal(): void {
    this.showConfigModal.set(false);
    // Limpa mensagens de sucesso ao fechar
    this.configSaveSuccess.set(false);
    this.configSaveMessage.set('');
  }

  loadConfig(): void {
    this.configService.getConfig().subscribe({
      next: (response) => {
        if (response.success && response.config) {
          const config = response.config;
          this.configNodeEnv.set(config.NODE_ENV);
          this.configPort.set(config.PORT);
          this.configCorsOrigin.set(config.CORS_ORIGIN);
          this.configLogLevel.set(config.LOG_LEVEL);
          this.configOpenaiKey.set(config.OPENAI_API_KEY || '');
          this.configAiProvider.set(config.AI_PROVIDER);
          this.configStackspotClientId.set(config.STACKSPOT_CLIENT_ID || '');
          this.configStackspotClientKey.set(config.STACKSPOT_CLIENT_KEY || '');
          this.configStackspotRealm.set(config.STACKSPOT_REALM || '');
          this.configStackspotTokenUrl.set(config.STACKSPOT_TOKEN_URL || '');
          this.configStackspotCompletionsUrl.set(config.STACKSPOT_COMPLETIONS_URL || '');
          this.configStackspotAgentChatUrl.set(config.STACKSPOT_AGENT_CHAT_URL || '');
          this.configDatabaseUrl.set(config.DATABASE_URL || '');
          this.configJwtSecret.set(config.JWT_SECRET || '');
          this.configUserAgent.set(config.STACKSPOT_USER_AGENT || '');
          this.configData.set(config);
          
          // Log para indicar a origem da configuração (útil para debug)
          const responseAny = response as any;
          if (responseAny.source) {
            console.log(`Configuration loaded from: ${responseAny.source}`);
          }
        }
      },
      error: (error) => {
        console.error('Error loading config:', error);
        this.errorMessage.set('Erro ao carregar configuração');
      }
    });
  }

  saveConfig(): void {
    this.isSavingConfig.set(true);
    const configToSave: EnvironmentConfig = {
      NODE_ENV: this.configNodeEnv(),
      PORT: this.configPort(),
      CORS_ORIGIN: this.configCorsOrigin(),
      LOG_LEVEL: this.configLogLevel(),
      OPENAI_API_KEY: this.configOpenaiKey(),
      AI_PROVIDER: this.configAiProvider(),
      STACKSPOT_CLIENT_ID: this.configStackspotClientId() || undefined,
      STACKSPOT_CLIENT_KEY: this.configStackspotClientKey() || undefined,
      STACKSPOT_REALM: this.configStackspotRealm() || undefined,
      STACKSPOT_TOKEN_URL: this.configStackspotTokenUrl() || undefined,
      STACKSPOT_COMPLETIONS_URL: this.configStackspotCompletionsUrl() || undefined,
      STACKSPOT_AGENT_CHAT_URL: this.configStackspotAgentChatUrl() || undefined,
      DATABASE_URL: this.configDatabaseUrl() || undefined,
      JWT_SECRET: this.configJwtSecret() || undefined,
      STACKSPOT_USER_AGENT: this.configUserAgent() || undefined
    };
    
    this.configService.saveConfig(configToSave).subscribe({
      next: (response) => {
        if (response.success) {
          // Mostra feedback de sucesso dentro do modal
          this.configSaveSuccess.set(true);
          this.configSaveMessage.set(response.message || 'Configuração salva com sucesso! Aplicada automaticamente.');
          this.isSavingConfig.set(false);
          
          // Limpa a mensagem após 5 segundos
          setTimeout(() => {
            this.configSaveSuccess.set(false);
            this.configSaveMessage.set('');
          }, 5000);
        }
      },
      error: (error) => {
        console.error('Error saving config:', error);
        // Mostra erro também dentro do modal
        this.configSaveSuccess.set(false);
        this.configSaveMessage.set('Erro ao salvar configuração. Tente novamente.');
        this.isSavingConfig.set(false);
        
        // Limpa a mensagem de erro após 5 segundos
        setTimeout(() => {
          this.configSaveMessage.set('');
        }, 5000);
      }
    });
  }

  applyConfig(): void {
    this.configService.applyConfig().subscribe({
      next: (response) => {
        if (response.success) {
          this.statusMessage.set(response.message);
          setTimeout(() => {
            this.statusMessage.set('');
          }, 5000);
        }
      },
      error: (error) => {
        console.error('Error applying config:', error);
        this.errorMessage.set('Erro ao aplicar configuração');
      }
    });
  }
}
