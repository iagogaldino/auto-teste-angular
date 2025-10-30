import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { join, dirname, basename, resolve } from 'path';
import { existsSync } from 'fs';

export interface JestExecutionOptions {
  projectPath: string;
  testFilePath: string;
  timeout?: number;
}

export interface JestAllTestsOptions {
  projectPath: string;
  timeout?: number;
}

export interface JestExecutionResult {
  success: boolean;
  output: string;
  exitCode?: number;
  error?: string;
}

export class JestExecutionService extends EventEmitter {
  private activeProcesses: Map<string, ChildProcess> = new Map();

  // Função auxiliar para encontrar o diretório que contém package.json
  private findProjectRoot(startPath: string): string {
    let currentPath = resolve(startPath);
    const rootPath = resolve('/');
    
    while (currentPath !== rootPath) {
      const packageJsonPath = join(currentPath, 'package.json');
      if (existsSync(packageJsonPath)) {
        console.log(`📦 package.json encontrado em: ${currentPath}`);
        return currentPath;
      }
      currentPath = dirname(currentPath);
    }
    
    throw new Error(`package.json não encontrado em nenhum diretório pai de: ${startPath}`);
  }

  async executeTest(options: JestExecutionOptions): Promise<JestExecutionResult> {
    const { projectPath, testFilePath, timeout = 30000 } = options;
    
    try {
      // Verificar se o arquivo de teste existe
      if (!existsSync(testFilePath)) {
        throw new Error(`Arquivo de teste não encontrado: ${testFilePath}`);
      }

      // Verificar se o diretório do projeto existe
      if (!existsSync(projectPath)) {
        throw new Error(`Diretório do projeto não encontrado: ${projectPath}`);
      }

      // Encontrar o diretório raiz do projeto (que contém package.json)
      const actualProjectPath = this.findProjectRoot(projectPath);
      console.log(`🧪 Executando teste em: ${actualProjectPath}`);
      console.log(`📄 Arquivo de teste: ${testFilePath}`);

      // Cancelar execução anterior se existir
      const processKey = testFilePath;
      if (this.activeProcesses.has(processKey)) {
        const existingProcess = this.activeProcesses.get(processKey);
        if (existingProcess && !existingProcess.killed) {
          existingProcess.kill('SIGTERM');
        }
        this.activeProcesses.delete(processKey);
      }

      // Executar Jest no diretório do projeto
      const jestProcess = spawn('npx', ['jest', testFilePath, '--verbose', '--no-cache'], {
        cwd: actualProjectPath,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      this.activeProcesses.set(processKey, jestProcess);

      let output = '';
      let errorOutput = '';

      // Emite uma primeira linha para feedback imediato no frontend
      this.emit('output', {
        testFilePath,
        output: `Executando: ${testFilePath} em ${actualProjectPath}\n`
      });

      // Capturar saída padrão
      jestProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        this.emit('output', {
          testFilePath,
          output: chunk
        });
      });

      // Capturar saída de erro
      jestProcess.stderr?.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        this.emit('output', {
          testFilePath,
          output: chunk
        });
      });

      // Configurar timeout
      const timeoutId = setTimeout(() => {
        if (!jestProcess.killed) {
          jestProcess.kill('SIGTERM');
          this.emit('error', {
            testFilePath,
            error: 'Timeout na execução do teste'
          });
        }
      }, timeout);

      // Aguardar conclusão do processo
      return new Promise((resolve) => {
        jestProcess.on('close', (code) => {
          clearTimeout(timeoutId);
          this.activeProcesses.delete(processKey);

          const fullOutput = output + errorOutput;
          const success = code === 0;

          console.log(`✅ Jest finalizado com código: ${code}`);
          console.log(`📊 Saída: ${fullOutput.substring(0, 200)}...`);

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

          console.error(`❌ Erro no processo Jest:`, error);

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

    } catch (error) {
      console.error(`❌ Erro ao executar teste:`, error);
      
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

  // Cancelar execução de um teste específico
  cancelTest(testFilePath: string): boolean {
    const process = this.activeProcesses.get(testFilePath);
    if (process && !process.killed) {
      process.kill('SIGTERM');
      this.activeProcesses.delete(testFilePath);
      return true;
    }
    return false;
  }

  // Cancelar todas as execuções ativas
  cancelAllTests(): void {
    for (const [testFilePath, process] of this.activeProcesses) {
      if (!process.killed) {
        process.kill('SIGTERM');
      }
    }
    this.activeProcesses.clear();
  }

  // Verificar se há execuções ativas
  hasActiveTests(): boolean {
    return this.activeProcesses.size > 0;
  }

  // Obter lista de testes ativos
  getActiveTests(): string[] {
    return Array.from(this.activeProcesses.keys());
  }

  // Executar todos os testes do projeto
  async executeAllTests(options: JestAllTestsOptions): Promise<JestExecutionResult> {
    const { projectPath, timeout = 60000 } = options;
    
    try {
      // Verificar se o diretório do projeto existe
      if (!existsSync(projectPath)) {
        throw new Error(`Diretório do projeto não encontrado: ${projectPath}`);
      }

      // Encontrar o diretório raiz do projeto (que contém package.json)
      const actualProjectPath = this.findProjectRoot(projectPath);
      console.log(`🧪 Executando todos os testes com Jest diretamente em: ${actualProjectPath}`);

      // Cancelar execução anterior se existir
      const processKey = 'all-tests';
      if (this.activeProcesses.has(processKey)) {
        const existingProcess = this.activeProcesses.get(processKey);
        if (existingProcess && !existingProcess.killed) {
          existingProcess.kill('SIGTERM');
        }
        this.activeProcesses.delete(processKey);
      }

      // Executar Jest diretamente para todos os testes no diretório do projeto
      const jestProcess = spawn('jest', ['--verbose', '--no-cache'], {
        cwd: actualProjectPath,
        stdio: 'pipe',
        shell: true,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      this.activeProcesses.set(processKey, jestProcess);

      let output = '';
      let errorOutput = '';

      // Emite uma primeira linha para feedback imediato no frontend
      this.emit('output', {
        testFilePath: 'all-tests',
        output: `Executando todos os testes com Jest diretamente em: ${actualProjectPath}\n`
      });

      // Capturar saída padrão
      jestProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        this.emit('output', {
          testFilePath: 'all-tests',
          output: chunk
        });
      });

      // Capturar saída de erro
      jestProcess.stderr?.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        this.emit('output', {
          testFilePath: 'all-tests',
          output: chunk
        });
      });

      // Configurar timeout
      const timeoutId = setTimeout(() => {
        if (!jestProcess.killed) {
          jestProcess.kill('SIGTERM');
          this.emit('error', {
            testFilePath: 'all-tests',
            error: 'Timeout na execução dos testes'
          });
        }
      }, timeout);

      // Aguardar conclusão do processo
      return new Promise((resolve) => {
        jestProcess.on('close', (code) => {
          clearTimeout(timeoutId);
          this.activeProcesses.delete(processKey);

          const fullOutput = output + errorOutput;
          const success = code === 0;

          console.log(`✅ Jest (todos os testes) finalizado com código: ${code}`);
          console.log(`📊 Saída: ${fullOutput.substring(0, 200)}...`);

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

          console.error(`❌ Erro no processo Jest (todos os testes):`, error);

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

    } catch (error) {
      console.error(`❌ Erro ao executar todos os testes:`, error);
      
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