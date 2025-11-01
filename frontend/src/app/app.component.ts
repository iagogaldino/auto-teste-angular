import { Component, signal, computed, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { environment } from '../environments/environment';
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
import { MatSidenavModule } from '@angular/material/sidenav';
// (revert) remove MatMenu usage
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { SplashComponent } from './components/splash/splash.component';
import { AiChatComponent } from './components/ai-chat/ai-chat.component';

// PrismJS global (loaded via CDN in index.html)
declare const Prism: any;

// Tipo da árvore para representar a estrutura do projeto
export interface TreeNode { name: string; path: string; children?: TreeNode[]; isFile: boolean; isSpec?: boolean; component?: AngularComponent; displayName?: string; result?: TestGenerationResult }

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
    MatSidenavModule,
    SplashComponent,
    AiChatComponent
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
  // Modo de seleção múltipla (exibe/oculta checkboxes)
  selectionMode = signal<boolean>(false);
  
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
  // Execução de specs a partir da árvore
  specExecutions = signal<{ [fullSpecPath: string]: { status: 'running' | 'success' | 'error'; output: string; startTime?: Date; endTime?: Date } }>({});
  // Preview fixo e larguras das colunas
  previewPath = signal<string | null>(null);
  filesWidthPct = signal<number>(25);
  codeWidthPct = signal<number>(50);
  logWidthPct = signal<number>(25);
  private resizeState: { handle: 'files-code' | 'code-log' | null; startX: number; startFiles: number; startCode: number; startLog: number } = { handle: null, startX: 0, startFiles: 25, startCode: 50, startLog: 25 };
  
  // Execução de todos os testes
  allTestsOutput = signal<string>('');
  allTestsExecution = signal<{ status: 'running' | 'success' | 'error'; output: string; startTime?: Date } | null>(null);
  // Destaque para novos specs criados (até interação)
  newSpecHighlights = signal<{ [relativePath: string]: boolean }>({});
  
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

  // ===== Chat IA (sidenav à direita) =====
  showAiChat = signal<boolean>(false);

  // Histórico de diretórios recentes
  recentDirectories = signal<string[]>([]);

  // Stepper reference
  @ViewChild(MatStepper) stepper?: MatStepper;
  @ViewChild('allTestsOutputContainer') allTestsOutputContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('autoFlowOutputContainer') autoFlowOutputContainer?: ElementRef<HTMLDivElement>;

  showAllTestsModal = signal<boolean>(false);

  // Forçar re-render do bloco de código quando novo conteúdo chega
  codeRenderKey = signal<number>(0);

  // ===== Fluxo automático: gerar → executar → corrigir com IA =====
  autoFlowRunning = signal<boolean>(false);
  autoFlowTargets = signal<string[]>([]); // full paths dos arquivos alvo
  autoFlowPendingExecutions = signal<number>(0);
  showAutoFlowModal = signal<boolean>(false);
  autoFlowLog = signal<string>('');
  autoFlowPaused = signal<boolean>(false);
  autoFlowPausedQueue = signal<string[]>([]); // filePaths aguardando ação quando pausado
  private appendAutoFlowLog(message: string): void {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const prefix = `[${hh}:${mm}:${ss}] `;
    this.autoFlowLog.update(l => (l ? l + '\n' : '') + prefix + message);
    setTimeout(() => this.scrollAutoFlowToBottom(), 0);
    try { this.socketService.logAutoFlow(prefix + message); } catch {}
  }

  private appendAutoFlowRaw(chunk: string): void {
    this.autoFlowLog.update(l => (l ? l : '') + chunk);
    setTimeout(() => this.scrollAutoFlowToBottom(), 0);
    // Envia apenas novas linhas “inteiras” para o backend (split por \n)
    try {
      const lines = (chunk || '').split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        this.socketService.logAutoFlow(line);
      }
    } catch {}
  }

  private extractFailCount(output: string): number | null {
    if (!output) return null;
    // Try Jest summary line: Tests: 1 failed, 2 passed, 3 total
    const m = output.match(/Tests:\s*(?:.*?,\s*)?(\d+)\s*failed/i);
    if (m) return +m[1];
    // Fallback: count of lines starting with FAIL or ✖ in output
    const failLines = output.split(/\r?\n/).filter(l => /^(FAIL|✖)/i.test(l)).length;
    return failLines > 0 ? failLines : null;
  }

  toggleAutoFlowPause(): void {
    const next = !this.autoFlowPaused();
    this.autoFlowPaused.set(next);
    if (next) {
      this.appendAutoFlowLog('Fluxo pausado.');
    } else {
      this.appendAutoFlowLog('Fluxo retomado.');
      this.processAutoFlowQueue();
    }
  }

  private processAutoFlowQueue(): void {
    const queue = [...this.autoFlowPausedQueue()];
    if (queue.length === 0) return;
    this.autoFlowPausedQueue.set([]);
    // Para cada item, agenda a correção ou reexecução conforme apropriado
    queue.forEach(path => {
      const result = this.testResults().find(r => r.filePath === path);
      if (!result) return;
      // Se existe testExecution com erro -> corrigir; senão, se tem testCode -> executar
      if (result.testExecution && result.testExecution.status === 'error') {
        this.appendAutoFlowLog(`Retomado: corrigindo teste pendente: ${this.getFileName(path)}`);
        this.autoFlowPendingExecutions.update(n => n + 1);
        try { this.regenerateTestFromExecutionError(result); } catch {}
      } else if (result.success && result.testCode) {
        this.appendAutoFlowLog(`Retomado: executando teste pendente: ${this.getFileName(path)}`);
        this.autoFlowPendingExecutions.update(n => n + 1);
        try { this.executeTest(result); } catch {}
      }
    });
  }

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

    // Chat actions: abrir arquivo
    this.socketService.onChatAction().subscribe(action => {
      if (action.type === 'open_file') {
        const rel = (action.path || '').replace(/\\/g, '/');
        if (!rel) return;
        this.previewPath.set(rel);
        const full = `${this.directoryPath()}/${rel}`;
        this.socketService.getFileContent(full);
      }
    });
  }

  // Abre menu de contexto apenas no clique direito
  

  // ===== Chat IA handlers =====
  toggleAiChat(): void { this.showAiChat.update(v => !v); }

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
      // Usa a árvore enviada pelo backend se existir; senão, constrói localmente
      const backendTree = (data.result && data.result.fileTree) ? data.result.fileTree : null;
      this.treeDataSource.data = backendTree || this.buildTreeFromComponents(this.scannedComponents());
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
      const normalize = (p: string) => (p || '').replace(/\\/g, '/');
      const filePathNorm = normalize(data.filePath);
      // Deriva a chave relativa a partir do diretório atual, quando possível
      const base = normalize(this.directoryPath() || '');
      let relKey = filePathNorm;
      if (base && (filePathNorm.startsWith(base + '/') || filePathNorm === base)) {
        relKey = filePathNorm.slice(base.length).replace(/^\//, '');
      }
      this.inlineFileContents.update(map => ({
        ...map,
        [data.filePath]: data.content,
        [filePathNorm]: data.content,
        [relKey]: data.content
      }));

      // Verifica se o conteúdo corresponde ao arquivo atualmente em preview
      const previewRel = normalize(this.previewPath() || '');
      const isCurrent = relKey.toLowerCase() === previewRel.toLowerCase();
      if (isCurrent) {
        this.codeRenderKey.update(v => v + 1);
        setTimeout(() => { try { Prism && Prism.highlightAll(); } catch {} }, 0);
      }

      this.statusMessage.set(`Conteúdo carregado: ${data.filePath}`);
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
      if (this.autoFlowRunning()) {
        const normalize = (p: string) => (p || '').replace(/\\/g, '/');
        (data.files || []).forEach(f => this.appendAutoFlowLog(`Gerando teste unitário para componente: ${this.getFileName(normalize(f))}`));
      }
    });

    this.socketService.onTestGenerationProgress().subscribe(progress => {
      this.testProgress.set(progress);
      this.statusMessage.set(`Gerando testes... ${progress.current}/${progress.total} - ${progress.currentFile}`);
    });

    this.socketService.onTestGenerated().subscribe(result => {
      try { console.log('[socket] test-generated', result); } catch {}
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
      // Não altera a árvore aqui; a inclusão ocorre no evento test-file-created

      // Auto: ao gerar um teste do alvo, executa automaticamente
      if (this.autoFlowRunning() && !this.autoFlowPaused()) {
        const targets = this.autoFlowTargets();
        const normalize = (p: string) => (p || '').replace(/\\/g, '/');
        const isTarget = targets.some(t => normalize(t) === normalize(result.filePath));
        if (isTarget) {
          this.appendAutoFlowLog(`Teste gerado: ${this.getFileName(result.filePath)}`);
          const current = this.testResults().find(r => r.filePath === result.filePath);
          if (current) {
            this.appendAutoFlowLog(`Executando teste: ${this.getFileName(result.filePath)}`);
            try { this.executeTest(current); } catch {}
          }
        }
      }
    });

    this.socketService.onTestGenerationCompleted().subscribe(data => {
      try { console.log('[socket] test-generation-completed', data); } catch {}
      this.isGeneratingTests.set(false);
      this.testProgress.set(null);
      this.statusMessage.set(`Geração concluída: ${data.results.filter(r => r.success).length}/${data.results.length} sucessos`);
      // Não alteramos a lista aqui para evitar recarregar; adicionamos apenas no evento por arquivo
    });

    this.socketService.onTestGenerationError().subscribe(data => {
      this.isGeneratingTests.set(false);
      this.testProgress.set(null);
      this.errorMessage.set(`Erro na geração: ${data.error}`);
    });

    // Criação de arquivo de teste
    this.socketService.onTestFileCreated().subscribe(data => {
      try { console.log('[socket] test-file-created', data); } catch {}
      this.isCreatingTest.set(false);
      if (data.success) {
        this.statusMessage.set(`Arquivo de teste criado: ${data.filePath}`);
        // Converte caminho absoluto para relativo ao diretório escaneado
        const base = (this.directoryPath() || '').replace(/\\/g, '/');
        const abs = (data.filePath || '').replace(/\\/g, '/');
        let rel = abs;
        if (base && (abs === base || abs.startsWith(base + '/'))) {
          rel = abs.slice(base.length).replace(/^\//, '');
        }
        // Se veio conteúdo no evento, já cacheia para preview rápido
        if (data.content) {
          this.inlineFileContents.update(map => ({ ...map, [rel]: data.content || '', [abs]: data.content || '' }));
        }
        // Apenas insere na árvore sem reconstruir lista completa
        const isAbsoluteWin = /:\\/.test(abs) || /:\//.test(abs);
        const isAbsoluteUnix = abs.startsWith('/');
        const safePath = (isAbsoluteWin || isAbsoluteUnix) ? rel : rel;
        this.insertFileIntoTree(safePath);
        // Marca como novo (azul) até interação
        this.newSpecHighlights.update(m => ({ ...m, [rel]: true }));
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
      // Atualiza execuções de specs (quando originalFilePath é o próprio spec)
      this.specExecutions.update(map => {
        if (map[data.originalFilePath]) {
          return {
            ...map,
            [data.originalFilePath]: { status: 'running', output: 'Iniciando execução...\n', startTime: new Date() }
          };
        }
        return map;
      });

      if (this.autoFlowRunning()) {
        const normalize = (p: string) => (p || '').replace(/\\/g, '/');
        const isTarget = this.autoFlowTargets().some(t => normalize(t) === normalize(data.originalFilePath));
        if (isTarget) {
          this.appendAutoFlowLog(`Execução iniciada: ${this.getFileName(data.originalFilePath)}`);
        }
      }
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
      // Append ao log de specs
      this.specExecutions.update(map => {
        const cur = map[data.originalFilePath];
        if (cur) {
          return { ...map, [data.originalFilePath]: { ...cur, status: 'running', output: (cur.output || '') + data.output } };
        }
        return map;
      });

      // Stream execução detalhada para o modal do fluxo automático
      if (this.autoFlowRunning()) {
        const normalize = (p: string) => (p || '').replace(/\\/g, '/');
        const isTarget = this.autoFlowTargets().some(t => normalize(t) === normalize(data.originalFilePath));
        if (isTarget) {
          this.appendAutoFlowRaw(data.output || '');
        }
      }
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
      // Finaliza execução do spec
      this.specExecutions.update(map => {
        const cur = map[data.originalFilePath];
        if (cur) {
          return { ...map, [data.originalFilePath]: { ...cur, status: data.status, output: (cur.output || '') + (data.output || ''), endTime: new Date() } };
        }
        return map;
      });

      // Auto: após execução, se erro → corrigir com IA; contabiliza conclusão
      if (this.autoFlowRunning()) {
        const normalize = (p: string) => (p || '').replace(/\\/g, '/');
        const isTarget = this.autoFlowTargets().some(t => normalize(t) === normalize(data.originalFilePath));
        if (isTarget) {
          if (data.status === 'error') {
            this.appendAutoFlowLog(`O teste teve erros: ${this.getFileName(data.originalFilePath)}. Gerando correção com IA...`);
            if (this.autoFlowPaused()) {
              // Enfileira correção para quando retomar
              const q = new Set(this.autoFlowPausedQueue());
              q.add(data.originalFilePath);
              this.autoFlowPausedQueue.set(Array.from(q));
              this.appendAutoFlowLog('Fluxo pausado: correção pendente adicionada à fila.');
            } else {
              // Mantém o fluxo ativo: agenda nova execução (incrementa antes de decrementar abaixo)
              this.autoFlowPendingExecutions.update(n => n + 1);
              const result = this.testResults().find(r => r.filePath === data.originalFilePath);
              if (result) {
                try { this.regenerateTestFromExecutionError(result); } catch {}
              }
            }
          } else {
            this.appendAutoFlowLog(`Teste passou com sucesso: ${this.getFileName(data.originalFilePath)}`);
          }
          // Resumo com contagem de erros se disponível
          const fails = this.extractFailCount(data.output || '');
          if (fails !== null) {
            if (fails > 0) {
              this.appendAutoFlowLog(`Resumo: O teste teve ${fails} erro(s).`);
            } else {
              this.appendAutoFlowLog('Resumo: Nenhum erro encontrado.');
            }
          }
          // Contabiliza execução concluída
          const remaining = Math.max(0, this.autoFlowPendingExecutions() - 1);
          this.autoFlowPendingExecutions.set(remaining);
          if (remaining === 0 && !this.isFixingTest() && !this.autoFlowPaused() && this.autoFlowPausedQueue().length === 0) {
            this.autoFlowRunning.set(false);
            this.statusMessage.set('Fluxo automático concluído.');
            this.appendAutoFlowLog('Fluxo automático concluído.');
            // limpa alvos após pequeno atraso
            setTimeout(() => this.autoFlowTargets.set([]), 500);
          }
        }
      }
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
      // Erro em execução de spec
      this.specExecutions.update(map => {
        const cur = map[data.originalFilePath];
        if (cur) {
          return { ...map, [data.originalFilePath]: { ...cur, status: 'error', output: (cur.output || '') + `\nErro: ${data.error}`, endTime: new Date() } };
        }
        return map;
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
      if (this.autoFlowRunning()) {
        this.appendAutoFlowLog(`IA iniciou correção do teste: ${data.componentName}`);
      }
    });

    this.socketService.onTestFixed().subscribe(data => {
      
      this.isFixingTest.set(false);
      this.fixingTestFile.set('');
      this.statusMessage.set(`✅ Teste corrigido com sucesso: ${data.componentName}`);
      if (this.autoFlowRunning()) {
        this.appendAutoFlowLog(`Teste corrigido com sucesso: ${data.componentName}`);
      }
      
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

      // Se fluxo automático: reexecuta o teste corrigido para validar
      if (this.autoFlowRunning()) {
        const normalize = (p: string) => (p || '').replace(/\\/g, '/');
        const isTarget = this.autoFlowTargets().some(t => normalize(t) === normalize(data.filePath));
        if (isTarget) {
          // Obtem o resultado atualizado da lista e executa
          const current = this.testResults().find(r => r.filePath === data.filePath);
          if (current && current.success && current.testCode) {
            this.appendAutoFlowLog(`Executando novamente após correção: ${this.getFileName(data.filePath)}`);
            // incrementa pendências para aguardar essa nova execução
            this.autoFlowPendingExecutions.update(n => n + 1);
            try { this.executeTest(current); } catch {}
          }
        }
      }
    });

    this.socketService.onTestFixError().subscribe(data => {
      
      this.isFixingTest.set(false);
      this.fixingTestFile.set('');
      this.errorMessage.set(`Erro ao melhorar teste: ${data.error}`);
      if (this.autoFlowRunning()) {
        this.appendAutoFlowLog(`Erro ao corrigir teste com IA: ${data.error}`);
      }
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
    // Incluir arquivos .spec.ts na estrutura (visíveis), mas não selecionáveis
    // includeTests:true evita que o scanner backend exclua .spec.ts por padrão
    this.socketService.scanDirectory(this.directoryPath(), { includeSpecs: true, includeTests: true });
  }

  isSpecPath(filePath: string): boolean {
    return /\.spec\.ts$/i.test(filePath);
  }

  toggleFileSelection(filePath: string): void {
    // Impede seleção de arquivos .spec.ts
    if (this.isSpecPath(filePath)) {
      return;
    }
    const normalize = (p: string) => (p || '').replace(/\\/g, '/');
    const target = normalize(filePath);
    this.selectedFiles.update(files => {
      const normalizedList = files.map(f => normalize(f));
      if (normalizedList.includes(target)) {
        return normalizedList.filter(f => f !== target);
      } else {
        return [...normalizedList, target];
      }
    });
  }

  selectAllFiles(): void {
    // Seleciona apenas arquivos .ts que não são .spec.ts
    const normalize = (p: string) => (p || '').replace(/\\/g, '/');
    const allFiles = this.scannedComponents()
      .map(c => normalize(c.filePath))
      .filter(p => !this.isSpecPath(p));
    this.selectedFiles.set(allFiles);
    // Garante que os checkboxes fiquem visíveis após selecionar tudo
    this.selectionMode.set(true);
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

  toggleSelectionMode(): void {
    const next = !this.selectionMode();
    this.selectionMode.set(next);
    if (!next) {
      // Ao sair do modo de seleção, não alteramos seleção atual, apenas escondemos os checkboxes
    }
  }

  // ===== Tree helpers para atualizações granulares =====
  private findFolderNodeByPath(nodes: TreeNode[], path: string): TreeNode | null {
    for (const node of nodes) {
      if (!node.isFile) {
        if (node.path === path) return node;
        const child = this.findFolderNodeByPath(node.children || [], path);
        if (child) return child;
      }
    }
    return null;
  }

  // Garante que a hierarquia de pastas exista na árvore e retorna o nó pai
  private ensureFolderPath(folderPath: string): TreeNode | null {
    const normalized = (folderPath || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    if (!normalized) return null;
    const segments = normalized.split('/');
    let currentNodes = this.treeDataSource.data as TreeNode[];
    let parent: TreeNode | null = null;
    let accumulated: string[] = [];

    for (const seg of segments) {
      accumulated.push(seg);
      const currentPath = accumulated.join('/');
      let folderNode = currentNodes.find(n => !n.isFile && n.path === currentPath) || null;
      if (!folderNode) {
        folderNode = { name: seg, path: currentPath, isFile: false, children: [] } as TreeNode;
        currentNodes.push(folderNode);
        // Reordena: pastas primeiro, depois arquivos
        currentNodes.sort((a, b) => (a.isFile !== b.isFile ? (a.isFile ? 1 : -1) : a.name.localeCompare(b.name)));
      }
      parent = folderNode;
      folderNode.children = folderNode.children || [];
      currentNodes = folderNode.children;
    }

    // Atualiza dataNodes após modificações
    this.treeDataSource.data = [...this.treeDataSource.data];
    this.treeControl.dataNodes = this.treeDataSource.data;
    return parent;
  }

  private insertFileIntoTree(filePath: string): void {
    const normalized = filePath.replace(/\\/g, '/');
    const parts = normalized.split('/');
    const fileName = parts.pop() || normalized;
    const parentPath = parts.join('/');

    // Caso arquivo na raiz do projeto escaneado
    if (!parentPath) {
      const existsAtRoot = (this.treeDataSource.data || []).some(c => c.isFile && c.path === normalized);
      if (existsAtRoot) return;
      const newRootNode: TreeNode = {
        name: fileName,
        path: normalized,
        isFile: true,
        isSpec: /\.spec\.ts$/i.test(fileName)
      } as any;
      const foldersFirst = (a: TreeNode, b: TreeNode) => (a.isFile !== b.isFile ? (a.isFile ? 1 : -1) : a.name.localeCompare(b.name));
      this.treeDataSource.data = [...(this.treeDataSource.data || []), newRootNode].sort(foldersFirst);
      this.treeControl.dataNodes = this.treeDataSource.data;
      return;
    }

    let parent = this.findFolderNodeByPath(this.treeDataSource.data, parentPath);
    if (!parent) {
      // Cria hierarquia de pastas que não existirem
      parent = this.ensureFolderPath(parentPath);
    }
    if (!parent) return;

    const exists = (parent.children || []).some(c => c.isFile && c.path === normalized);
    if (exists) return;

    const newNode: TreeNode = {
      name: fileName,
      path: normalized,
      isFile: true,
      isSpec: /\.spec\.ts$/i.test(fileName)
    } as any;

    parent.children = [...(parent.children || []), newNode].sort((a, b) => a.name.localeCompare(b.name));
    // dispara atualização sem reconstruir toda a árvore
    this.treeDataSource.data = [...this.treeDataSource.data];
    this.treeControl.dataNodes = this.treeDataSource.data;
  }

  private buildTreeFromComponents(components: AngularComponent[]): TreeNode[] {
    // Constrói uma árvore de diretórios/arquivos a partir dos caminhos dos componentes
    // Oculta arquivos *.test.ts (mantém .ts e .spec.ts)
    const files = components
      .filter(comp => !/\.test\.ts$/i.test(comp.filePath))
      .map(comp => ({
        path: comp.filePath.replace(/\\/g, '/'),
        comp
      }));

    type DirMap = { [name: string]: { __files: TreeNode[]; __dirs: DirMap } };
    const root: DirMap = {};

    for (const { path, comp } of files) {
      const parts = path.split('/').filter(Boolean);
      let cursor = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        if (isLast) {
          const fileNode: TreeNode = {
            name: part,
            path,
            isFile: true,
            isSpec: /\.spec\.ts$/i.test(part),
            component: comp
          };
          const dirKey = '__files';
          // cria bucket se ainda não existir
          if (!cursor['__files']) {
            (cursor as any)['__files'] = [] as TreeNode[];
          }
          (cursor as any)[dirKey].push(fileNode);
        } else {
          if (!cursor[part]) {
            cursor[part] = { __files: [], __dirs: {} };
          }
          cursor = cursor[part].__dirs;
        }
      }
    }

    const toTree = (map: DirMap, basePath: string[] = []): TreeNode[] => {
      const dirNames = Object.keys(map).filter(k => !k.startsWith('__')).sort((a, b) => a.localeCompare(b));
      const dirNodes: TreeNode[] = dirNames.map(dirName => {
        const sub = map[dirName];
        const fullPath = [...basePath, dirName].join('/');
        const children = [
          ...toTree(sub.__dirs, [...basePath, dirName]),
          ...sub.__files.sort((a, b) => a.name.localeCompare(b.name))
        ];
        return {
          name: dirName,
          path: fullPath,
          isFile: false,
          children
        } as TreeNode;
      });
      // No nível atual, não existem arquivos soltos além dos que pertencem a diretórios
      return dirNodes;
    };

    // Arquivos na raiz (sem diretórios)
    const rootFiles: TreeNode[] = (root as any)['__files']
      ? ((root as any)['__files'] as TreeNode[]).sort((a, b) => a.name.localeCompare(b.name))
      : [];

    const tree = [
      ...toTree(root),
      ...rootFiles
    ];

    // Pastas primeiro, depois arquivos, ambos ordenados
    return tree.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }

  // Verifica se o spec é novo (para destacar em azul)
  isNewSpec(path: string): boolean {
    const key = path.replace(/\\/g, '/');
    return !!this.newSpecHighlights()[key];
  }

  // ===== Preview e inline helpers (agora o inline reflete o preview selecionado) =====
  isFileExpanded(path: string): boolean {
    return this.previewPath() === path;
  }

  toggleInlineFile(node: { path: string; component?: AngularComponent }): void {
    const path = node.path;
    const normalize = (p: string) => (p || '').replace(/\\/g, '/');
    const normalizedRel = normalize(path);
    const fullPath = `${this.directoryPath()}/${normalizedRel}`;
    this.previewPath.set(normalizedRel);

    // Re-render imediatamente para exibir o conteúdo em cache (se existir)
    this.codeRenderKey.update(v => v + 1);

    // Solicita o conteúdo real; o preview será atualizado quando o evento chegar
    this.socketService.getFileContent(fullPath);

    if (this.isSpecPath(path)) {
      this.newSpecHighlights.update(m => {
        const copy: any = { ...m };
        const rel = normalizedRel;
        if (copy[rel]) delete copy[rel];
        return copy;
      });
    }
  }

  

  executeSpecNode(node: { path: string }): void {
    const path = node.path;
    if (!this.isSpecPath(path)) return;
    const fullSpecPath = `${this.directoryPath()}/${path}`;
    this.previewPath.set(path);
    if (!this.inlineFileContents()[fullSpecPath]) {
      this.socketService.getFileContent(fullSpecPath);
    }
    setTimeout(() => { try { Prism && Prism.highlightAll(); } catch {} }, 0);
    // Inicializa estado e dispara execução
    this.specExecutions.update(map => ({
      ...map,
      [fullSpecPath]: { status: 'running', output: 'Iniciando execução...\n', startTime: new Date() }
    }));
    this.socketService.executeTest(fullSpecPath, '', fullSpecPath);
  }

  executeCurrentSpec(): void {
    const current = this.previewPath();
    if (!current || !this.isSpecPath(current)) return;
    const fullSpecPath = `${this.directoryPath()}/${current}`;
    // Garante que temos conteúdo mais recente
    this.socketService.getFileContent(fullSpecPath);
    // Inicializa/atualiza estado de execução
    this.specExecutions.update(map => ({
      ...map,
      [fullSpecPath]: { status: 'running', output: 'Iniciando execução...\n', startTime: new Date() }
    }));
    this.socketService.executeTest(fullSpecPath, '', fullSpecPath);
  }

  // Corrigir teste diretamente do log do spec selecionado
  fixCurrentSpecFromLog(): void {
    const currentRel = this.previewPath();
    if (!currentRel || !this.isSpecPath(currentRel)) return;
    const fullSpecPath = `${this.directoryPath()}/${currentRel}`;
    const exec = this.specExecutions()[fullSpecPath];
    if (!exec || exec.status !== 'error') return;

    // Deduz o arquivo original a partir do .spec.ts atual
    const originalFullPath = fullSpecPath.replace(/\.spec\.ts$/i, '.ts');

    const pseudoResult: TestGenerationResult = {
      filePath: originalFullPath,
      success: false,
      testCode: '',
      explanation: '',
      testCases: [],
      dependencies: [],
      error: 'Erro de execução do teste',
      testExecution: {
        status: 'error',
        output: exec.output,
        startTime: exec.startTime,
        endTime: exec.endTime
      }
    } as any;

    this.regenerateTestFromExecutionError(pseudoResult);
  }

  // ===== Resize handlers =====
  startResize(handle: 'files-code' | 'code-log', event: MouseEvent): void {
    event.preventDefault();
    this.resizeState = {
      handle,
      startX: event.clientX,
      startFiles: this.filesWidthPct(),
      startCode: this.codeWidthPct(),
      startLog: this.logWidthPct()
    };
    const move = (e: MouseEvent) => this.onResizeMove(e);
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      this.resizeState.handle = null;
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.resizeState.handle) return;
    const deltaPx = event.clientX - this.resizeState.startX;
    const viewportW = window.innerWidth || document.documentElement.clientWidth || 1200;
    const deltaPct = (deltaPx / viewportW) * 100;
    const min = 10;
    if (this.resizeState.handle === 'files-code') {
      let newFiles = this.resizeState.startFiles + deltaPct;
      let newCode = this.resizeState.startCode - deltaPct;
      if (newFiles < min) { newCode -= (min - newFiles); newFiles = min; }
      if (newCode < min) { newFiles -= (min - newCode); newCode = min; }
      this.filesWidthPct.set(Math.max(min, newFiles));
      this.codeWidthPct.set(Math.max(min, newCode));
    } else {
      let newCode = this.resizeState.startCode + deltaPct;
      let newLog = this.resizeState.startLog - deltaPct;
      if (newCode < min) { newLog -= (min - newCode); newCode = min; }
      if (newLog < min) { newCode -= (min - newLog); newLog = min; }
      this.codeWidthPct.set(Math.max(min, newCode));
      this.logWidthPct.set(Math.max(min, newLog));
    }
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
  getInlineContent(path: string): string {
    // path recebido pode ser relativo; no cache usamos também a chave relativa
    const normalize = (p: string) => (p || '').replace(/\\/g, '/');
    const rel = normalize(path);
    const full = normalize(path.includes(this.directoryPath()) ? path : `${this.directoryPath()}/${path}`);
    const cache = this.inlineFileContents();
    // Prioriza chave relativa; depois absoluta normalizada; depois absoluta original
    return cache[rel] ?? cache[full] ?? cache[path] ?? '';
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

  // ===== Diretórios Recentes =====
  private tryAutoOpenLastDirectory(directories: string[] | null | undefined): void {
    if (!directories || directories.length === 0) return;
    const last = (directories[0] || '').trim();
    if (!last) return;
    // Evita disparos duplicados se já houver diretório definido
    if (this.directoryPath() && this.directoryPath().trim() === last) return;
    this.directoryPath.set(last);
    // Inicia escaneamento automático
    this.scanDirectory();
  }

  private async loadRecentDirectories(): Promise<void> {
    try {
      const res = await fetch(`${environment.apiBaseUrl}/api/directories`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.directories)) {
          this.recentDirectories.set(data.directories);
          // Tenta abrir automaticamente o último projeto
          this.tryAutoOpenLastDirectory(data.directories);
          return;
        }
      }
    } catch {}
  }


  async addRecentDirectory(path: string): Promise<void> {
    if (!path) return;
    const trimmed = path.trim();
    if (!trimmed) return;
    try {
      const res = await fetch(`${environment.apiBaseUrl}/api/directories`, {
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
  }

  selectRecentDirectory(path: string): void {
    this.directoryPath.set(path);
  }

  async removeRecentDirectory(path: string, event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    try {
      const res = await fetch(`${environment.apiBaseUrl}/api/directories`, {
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

  // Método para gerar teste individual para um componente específico (seleção rápida na árvore)
  generateTestForComponent(component: AngularComponent): void {
    if (this.isCreatingTest()) return;
    if (!component || !component.filePath) return;

    // Feedback de UI
    this.isCreatingTest.set(true);
    this.statusMessage.set(`Gerando teste para ${component.name || this.getFileName(component.filePath)}...`);
    this.errorMessage.set('');

    // Envia caminho completo do arquivo do componente (backend espera full path)
    const fullPath = `${this.directoryPath()}/${component.filePath}`;
    this.socketService.generateTests([fullPath]);
  }

  private isTsNonSpec(path: string | null): boolean {
    if (!path) return false;
    return /\.ts$/i.test(path) && !/\.spec\.ts$/i.test(path);
  }

  generateCurrentTest(): void {
    const current = this.previewPath();
    if (!this.isTsNonSpec(current)) return;
    const fullPath = `${this.directoryPath()}/${current}`;
    this.isCreatingTest.set(true);
    this.statusMessage.set(`Gerando teste para ${this.getFileName(fullPath)}...`);
    this.errorMessage.set('');
    this.socketService.generateTests([fullPath]);
  }

  // ===== Fluxo automático disparado pelo botão "Gerar com IA" no menu superior =====
  openOrRunAiAutoFlow(): void {
    if (this.autoFlowRunning()) {
      // Já em execução: apenas abre o modal de log
      this.showAutoFlowModal.set(true);
      setTimeout(() => this.scrollAutoFlowToBottom(), 0);
      return;
    }
    this.runAiAutoFlow();
  }

  runAiAutoFlow(): void {
    if (this.autoFlowRunning()) return;
    if (!this.directoryPath().trim()) {
      this.errorMessage.set('Selecione/abra um projeto antes de gerar testes');
      return;
    }
    if (!this.hasSelectedFiles()) {
      this.errorMessage.set('Selecione ao menos um arquivo para gerar o teste');
      return;
    }

    const fullPaths = this.selectedFiles().map(file => `${this.directoryPath()}/${file}`);
    this.autoFlowTargets.set(fullPaths);
    this.autoFlowPendingExecutions.set(fullPaths.length);
    this.autoFlowRunning.set(true);
    this.statusMessage.set(`Fluxo automático iniciado para ${fullPaths.length} arquivo(s)`);
    this.errorMessage.set('');
    this.showAutoFlowModal.set(true);
    this.autoFlowLog.set('');
    this.appendAutoFlowLog('Iniciando fluxo: Gerar → Executar → Corrigir com IA');
    setTimeout(() => this.scrollAutoFlowToBottom(), 0);

    // Dispara a geração de testes; execuções ocorrerão quando cada teste for gerado
    this.socketService.generateTests(fullPaths);
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

  private scrollAutoFlowToBottom(): void {
    const container = this.autoFlowOutputContainer?.nativeElement;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 30);
    });
  }

  // ===== Pretty formatting for Auto Flow log =====
  formatAutoFlowLog(text: string): any {
    if (!text) return '';
    const escapeHtml = (s: string) => s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const lines = text.split(/\r?\n/);
    const formatted = lines.map(line => {
      const raw = escapeHtml(line);
      // realce timestamp [HH:MM:SS]
      const withTime = raw.replace(/^(\[[0-9]{2}:[0-9]{2}:[0-9]{2}\])/, '<span class="log-time">$1</span>');
      const lower = raw.toLowerCase();
      let cls = 'log-info';
      if (/erro|falhou|fail\b/.test(lower)) cls = 'log-error';
      else if (/sucesso|passou|corrigido|conclu[ií]do/.test(lower)) cls = 'log-success';
      else if (/warn|aviso/.test(lower)) cls = 'log-warn';
      // marca linhas de jest (FAIL/PASS)
      let content = withTime.replace(/\bFAIL\b/g, '<span class="log-error-kw">FAIL</span>')
                            .replace(/\bPASS\b/g, '<span class="log-success-kw">PASS</span>');
      return `<div class="log-line ${cls}">${content}</div>`;
    }).join('');
    return formatted;
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

    

    // Extrai o caminho relativo do filePath completo (normalizado)
    const normalize = (p: string) => (p || '').replace(/\\/g, '/');
    let relativePath = result.filePath;
    
    // Se o filePath contém o caminho do diretório base, remove-o
    const directoryPath = this.directoryPath();
    if (directoryPath && result.filePath.includes(directoryPath)) {
      relativePath = result.filePath.replace(directoryPath, '').replace(/^[\/\\]+/, '');
      
    }
    
    // Normaliza para comparação consistente
    const relativeNorm = normalize(relativePath);
    // Busca o componente original pelo caminho relativo
    const component = this.scannedComponents().find(c => normalize(c.filePath) === relativeNorm);
    
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

  openProjectFromMenu(): void {
    // Tenta obter caminho via prompt simples
    const current = this.directoryPath();
    const input = window.prompt('Informe o caminho do projeto (pasta raiz):', current || '');
    if (input && input.trim()) {
      this.directoryPath.set(input.trim());
      this.scanDirectory();
    }
  }

  runAllTestsFromMenu(): void {
    if (!this.directoryPath().trim()) {
      this.errorMessage.set('Selecione/abra um projeto antes de executar os testes');
      return;
    }
    // Abre modal e inicia execução
    this.showAllTestsModal.set(true);
    this.executeAllTests();
  }

  closeAllTestsModal(): void {
    this.showAllTestsModal.set(false);
  }

  isPathSelected(path: string): boolean {
    const normalize = (p: string) => (p || '').replace(/\\/g, '/');
    const current = normalize(this.previewPath() || '');
    const target = normalize(path);
    return current === target;
  }
}
