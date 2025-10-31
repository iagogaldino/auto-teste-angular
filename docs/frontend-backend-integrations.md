# Integrações Frontend ↔ Backend

Este documento lista todas as funções do frontend que integram com o backend, explicando o propósito de cada uma e o canal utilizado (HTTP ou WebSocket).

## Visão geral
- **HTTP (REST)**: usado para gerenciar e aplicar configurações de ambiente.
- **WebSocket (Socket.IO)**: usado para operações em tempo real: escaneamento de projeto, leitura de arquivos, geração/criação de testes, execução de testes e correção assistida por IA.

Canais e URLs padrão:
- Base HTTP: `environment.apiBaseUrl` ou a mesma origem (`window.location.origin`), com prefixo ` /api/config`.
- Socket: `environment.socketUrl` ou a mesma origem (`window.location.origin`).

## HTTP (ConfigService)
Arquivo: `frontend/src/app/services/config.service.ts`

- `getConfig()`
  - Método: GET ` /api/config`
  - Objetivo: obter a configuração atual do backend (variáveis de ambiente da aplicação).
  - Retorno: `{ success: boolean; config: EnvironmentConfig | null }`.

- `saveConfig(config)`
  - Método: POST ` /api/config`
  - Objetivo: persistir novas configurações no backend (sem reinício imediato).
  - Corpo: `Partial<EnvironmentConfig>`.
  - Retorno: `{ success: boolean; message: string; config: EnvironmentConfig }`.

- `applyConfig()`
  - Método: POST ` /api/config/apply`
  - Objetivo: aplicar as configurações no backend (pode requerer reinício do servidor do backend).
  - Retorno: `{ success: boolean; message: string }`.

Uso principal no frontend: `AppComponent.loadConfig`, `AppComponent.saveConfig`, `AppComponent.applyConfig`.

## WebSocket (SocketService)
Arquivo: `frontend/src/app/services/socket.service.ts`

Conexão e estado:
- `connect()` / `disconnect()` / `isConnected()`
  - Objetivo: gerenciar a sessão com o servidor via Socket.IO.
- Listeners: `onConnection()`, `onDisconnection()`
  - Objetivo: reagir às mudanças de conectividade.

Ações (emitidas do cliente para o servidor):
- `scanDirectory(directoryPath, options?)`
  - Evento emitido: `scan-directory`
  - Objetivo: iniciar escaneamento do projeto para descobrir componentes Angular.

- `getFileContent(filePath)`
  - Evento emitido: `get-file-content`
  - Objetivo: solicitar o conteúdo de um arquivo específico (exibição inline, correção de testes, etc.).

- `generateTests(files, options?)`
  - Evento emitido: `generate-tests`
  - Objetivo: gerar código de testes para arquivos/componentes informados.

- `createTestFile(filePath, content)`
  - Evento emitido: `create-test-file`
  - Objetivo: criar um arquivo de teste no disco com o conteúdo gerado.

- `executeTest(filePath, testCode, originalFilePath)`
  - Evento emitido: `execute-test`
  - Objetivo: executar um teste único (geralmente o arquivo `.spec.ts` gerado/aberto).

- `executeAllTests(projectPath)`
  - Evento emitido: `execute-all-tests`
  - Objetivo: executar toda a suíte de testes do projeto alvo.

- `fixTestError(data)`
  - Evento emitido: `fix-test-error`
  - Objetivo: enviar o código do componente, teste e mensagem de erro para a IA no backend propor correções.

Eventos (do servidor para o cliente):
- Escaneamento
  - `onScanStarted()` → `scan-started`
  - `onScanProgress()` → `scan-progress`
  - `onScanCompleted()` → `scan-completed`
  - `onScanError()` → `scan-error`
  - Objetivo: acompanhar status e resultado do escaneamento.

- Conteúdo de arquivo
  - `onFileContent()` → `file-content`
  - `onFileContentError()` → `file-content-error`
  - Objetivo: receber o conteúdo do arquivo solicitado ou tratar erros.

- Geração de testes
  - `onTestGenerationStarted()` → `test-generation-started`
  - `onTestGenerationProgress()` → `test-generation-progress`
  - `onTestGenerated()` → `test-generated`
  - `onTestGenerationCompleted()` → `test-generation-completed`
  - `onTestGenerationError()` → `test-generation-error`
  - Objetivo: acompanhar a geração de testes e coletar resultados.

- Criação de arquivo de teste
  - `onTestFileCreated()` → `test-file-created`
  - `onTestFileError()` → `test-file-error`
  - Objetivo: confirmar criação do arquivo `.spec.ts` ou reportar falha.

- Execução de testes (individuais)
  - `onTestExecutionStarted()` → `test-execution-started`
  - `onTestExecutionOutput()` → `test-execution-output`
  - `onTestExecutionCompleted()` → `test-execution-completed`
  - `onTestExecutionError()` → `test-execution-error`
  - Objetivo: acompanhar logs e status da execução de um teste.

- Execução de todos os testes
  - `onAllTestsOutput()` → `all-tests-output`
  - `onAllTestsCompleted()` → `all-tests-completed`
  - `onAllTestsError()` → `all-tests-execution-error`
  - Objetivo: acompanhar a execução da suíte completa.

- Correção assistida por IA
  - `onTestFixStarted()` → `test-fix-started`
  - `onTestFixed()` → `test-fixed`
  - `onTestFixError()` → `test-fix-error`
  - Objetivo: receber a correção proposta (código de teste ajustado, explicação, dependências e passos de setup).

## Onde são usadas no frontend
Arquivo: `frontend/src/app/app.component.ts`
- Conexão: `socketService.connect()`/`disconnect()` em `ngOnInit`/`ngOnDestroy` e listeners em `setupSocketListeners()`.
- Escaneamento: `startScan()` → `socketService.scanDirectory(...)`.
- Visualização de arquivo: `viewFileContent(...)`/expansão inline → `socketService.getFileContent(...)`.
- Geração de testes: `generateSelectedTests()`/`generateSingleTest(...)`/`regenerateTest(...)` → `socketService.generateTests(...)`.
- Criação de arquivo de teste: `createTestFile(...)` → `socketService.createTestFile(...)`.
- Execução de testes: `runSingleTest(...)` → `socketService.executeTest(...)`.
- Execução de todos os testes: `runAllTests()` → `socketService.executeAllTests(...)`.
- Correção por IA: `openFixTestDialog(...)`/`confirmFixTestWithExistingSpec(...)`/`sendToFixAI(...)` → `socketService.fixTestError(...)`.
- Configurações: `loadConfig()`/`saveConfig()`/`applyConfig()` → `configService.getConfig`/`saveConfig`/`applyConfig`.

## Observações
- As URLs/hosts são autodetectadas pelo frontend a partir de `environment.*` e, na ausência, caem no `window.location.origin`. Em desenvolvimento padrão, espera-se backend em `http://localhost:3000` e frontend em `http://localhost:4200`.
- Todos os eventos Socket.IO listados correspondem a rotas e handlers no backend sob `backend/src/socket/socketHandlers.ts` e serviços relacionados.
