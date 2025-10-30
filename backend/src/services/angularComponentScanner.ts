import { readFileSync, existsSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { glob } from 'glob';
import {
  AngularComponent,
  ComponentMethod,
  ComponentProperty,
  ComponentSignal,
  ComponentComputedSignal,
  ComponentInterface,
  InterfaceProperty,
  ScanOptions,
  ScanResult,
  ScanError
} from '../types/angularComponent';

export class AngularComponentScanner {
  private readonly defaultOptions: Required<ScanOptions> = {
    includeTests: false,
    includeSpecs: false,
    recursive: true,
    fileExtensions: ['.ts'],
    excludePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/e2e/**'
    ]
  };

  /**
   * Escaneia um diretório em busca de componentes Angular
   */
  async scanDirectory(directoryPath: string, options: Partial<ScanOptions> = {}): Promise<ScanResult> {
    const startTime = Date.now();
    const finalOptions = { ...this.defaultOptions, ...options };
    
    try {
      // Verificar se o diretório existe
      if (!existsSync(directoryPath)) {
        throw new Error(`Diretório não encontrado: ${directoryPath}`);
      }

      if (!statSync(directoryPath).isDirectory()) {
        throw new Error(`Caminho não é um diretório: ${directoryPath}`);
      }

      // Encontrar arquivos TypeScript
      const files = await this.findTypeScriptFiles(directoryPath, finalOptions);
      
      const components: AngularComponent[] = [];
      const errors: ScanError[] = [];
      let scannedFiles = 0;

      // Processar cada arquivo
      for (const filePath of files) {
        try {
          const component = await this.analyzeFile(filePath, directoryPath);
          if (component) {
            components.push(component);
          }
          scannedFiles++;
        } catch (error) {
          errors.push({
            filePath,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      const scanTime = Date.now() - startTime;

      return {
        components,
        totalFiles: files.length,
        scannedFiles,
        errors,
        scanTime
      };
    } catch (error) {
      return {
        components: [],
        totalFiles: 0,
        scannedFiles: 0,
        errors: [{
          filePath: directoryPath,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }],
        scanTime: Date.now() - startTime
      };
    }
  }

  /**
   * Encontra arquivos TypeScript no diretório
   */
  private async findTypeScriptFiles(directoryPath: string, options: Required<ScanOptions>): Promise<string[]> {
    const patterns = options.fileExtensions.map(ext => 
      options.recursive ? `**/*${ext}` : `*${ext}`
    );

    const excludePatterns = options.excludePatterns;
    if (!options.includeTests) {
      excludePatterns.push('**/*.spec.ts', '**/*.test.ts');
    }
    if (!options.includeSpecs) {
      excludePatterns.push('**/*.spec.ts');
    }

    const allFiles: string[] = [];
    
    for (const pattern of patterns) {
      const files = await glob(pattern, {
        cwd: directoryPath,
        ignore: excludePatterns,
        absolute: true
      });
      allFiles.push(...files);
    }

    // Remover duplicatas
    return [...new Set(allFiles)];
  }

  /**
   * Analisa um arquivo TypeScript em busca de componentes Angular
   */
  private async analyzeFile(filePath: string, baseDirectory: string): Promise<AngularComponent | null> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Verificar se é um componente Angular
      if (!this.isAngularComponent(content)) {
        return null;
      }

      const relativePath = relative(baseDirectory, filePath);
      // Extrair dados essenciais primeiro para permitir filtros
      const name = this.extractComponentName(content);
      const selector = this.extractSelector(content);
      const imports = this.extractImports(content);
      const dependencies = this.extractDependencies(content);

      // Remover componentes de bibliotecas de UI para evitar poluição (ex.: Angular Material)
      if (this.isUiLibraryComponent(name, selector, imports, dependencies)) {
        return null;
      }

      return {
        name,
        filePath: relativePath,
        selector,
        isStandalone: this.isStandaloneComponent(content),
        imports,
        templateUrl: this.extractTemplateUrl(content),
        styleUrl: this.extractStyleUrl(content),
        styleUrls: this.extractStyleUrls(content),
        methods: this.extractMethods(content),
        properties: this.extractProperties(content),
        signals: this.extractSignals(content),
        computedSignals: this.extractComputedSignals(content),
        interfaces: this.extractInterfaces(content),
        dependencies
      };
    } catch (error) {
      throw new Error(`Erro ao analisar arquivo ${filePath}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Verifica se o arquivo contém um componente Angular
   */
  private isAngularComponent(content: string): boolean {
    // Verificar se tem o decorator @Component e uma classe exportada
    const hasComponent = content.includes('@Component');
    const hasExportClass = content.includes('export class');
    
    if (!hasComponent || !hasExportClass) {
      return false;
    }
    
    // Verificar se a classe está associada ao decorator @Component
    // Isso garante que é realmente um componente, não apenas uma classe com "Component" no nome
    const decoratorBoundClassMatch = content.match(/@Component[\s\S]*?export class\s+(\w+)/);
    
    return decoratorBoundClassMatch !== null;
  }

  /**
   * Extrai o nome do componente
   */
  private extractComponentName(content: string): string {
    // Primeiro, tentar encontrar a classe associada ao decorator @Component
    const decoratorBoundClassMatch = content.match(/@Component[\s\S]*?export class\s+(\w+)/);
    if (decoratorBoundClassMatch) {
      return decoratorBoundClassMatch[1];
    }

    // Em seguida, tentar a forma tradicional com sufixo Component
    const classWithSuffixMatch = content.match(/export class\s+(\w+Component)\b/);
    if (classWithSuffixMatch) {
      return classWithSuffixMatch[1];
    }

    // Como fallback, derivar um nome a partir do selector (ex: app-user-card -> AppUserCardComponent)
    const selector = this.extractSelector(content);
    if (selector) {
      const pascal = selector
        .split('-')
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
      if (pascal) {
        return `${pascal}Component`;
      }
    }

    return 'UnknownComponent';
  }

  /**
   * Extrai o seletor do componente
   */
  private extractSelector(content: string): string {
    const selectorMatch = content.match(/selector:\s*['"`]([^'"`]+)['"`]/);
    return selectorMatch ? selectorMatch[1] : '';
  }

  /**
   * Verifica se é um componente standalone
   */
  private isStandaloneComponent(content: string): boolean {
    return content.includes('standalone: true');
  }

  /**
   * Extrai imports do componente
   */
  private extractImports(content: string): string[] {
    const importsMatch = content.match(/imports:\s*\[([^\]]+)\]/);
    if (!importsMatch) return [];

    return importsMatch[1]
      .split(',')
      .map(imp => imp.trim())
      .filter(imp => imp.length > 0);
  }

  /**
   * Extrai templateUrl
   */
  private extractTemplateUrl(content: string): string | undefined {
    const templateUrlMatch = content.match(/templateUrl:\s*['"`]([^'"`]+)['"`]/);
    return templateUrlMatch ? templateUrlMatch[1] : undefined;
  }

  /**
   * Extrai styleUrl
   */
  private extractStyleUrl(content: string): string | undefined {
    const styleUrlMatch = content.match(/styleUrl:\s*['"`]([^'"`]+)['"`]/);
    return styleUrlMatch ? styleUrlMatch[1] : undefined;
  }

  /**
   * Extrai styleUrls
   */
  private extractStyleUrls(content: string): string[] {
    const styleUrlsMatch = content.match(/styleUrls:\s*\[([^\]]+)\]/);
    if (!styleUrlsMatch) return [];

    return styleUrlsMatch[1]
      .split(',')
      .map(url => url.trim().replace(/['"`]/g, ''))
      .filter(url => url.length > 0);
  }

  /**
   * Extrai métodos do componente
   */
  private extractMethods(content: string): ComponentMethod[] {
    const methods: ComponentMethod[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detectar métodos (não getters/setters)
      if (this.isMethodLine(line) && !this.isGetterSetter(line)) {
        const method = this.parseMethod(line, i + 1);
        if (method) {
          methods.push(method);
        }
      }
    }
    
    return methods;
  }

  /**
   * Extrai propriedades do componente
   */
  private extractProperties(content: string): ComponentProperty[] {
    const properties: ComponentProperty[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (this.isPropertyLine(line)) {
        const property = this.parseProperty(line, i + 1);
        if (property) {
          properties.push(property);
        }
      }
    }
    
    return properties;
  }

  /**
   * Extrai signals do componente
   */
  private extractSignals(content: string): ComponentSignal[] {
    const signals: ComponentSignal[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (this.isSignalLine(line)) {
        const signal = this.parseSignal(line, i + 1);
        if (signal) {
          signals.push(signal);
        }
      }
    }
    
    return signals;
  }

  /**
   * Extrai computed signals do componente
   */
  private extractComputedSignals(content: string): ComponentComputedSignal[] {
    const computedSignals: ComponentComputedSignal[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (this.isComputedSignalLine(line)) {
        const computedSignal = this.parseComputedSignal(line, i + 1);
        if (computedSignal) {
          computedSignals.push(computedSignal);
        }
      }
    }
    
    return computedSignals;
  }

  /**
   * Extrai interfaces do componente
   */
  private extractInterfaces(content: string): ComponentInterface[] {
    const interfaces: ComponentInterface[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (this.isInterfaceLine(line)) {
        const interfaceDef = this.parseInterface(content, i);
        if (interfaceDef) {
          interfaces.push(interfaceDef);
        }
      }
    }
    
    return interfaces;
  }

  /**
   * Extrai dependências do componente
   */
  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g);
    
    for (const match of importMatches) {
      dependencies.push(match[1]);
    }
    
    return [...new Set(dependencies)];
  }

  /**
   * Detecta componentes de bibliotecas de UI (ex.: Angular Material/CDK)
   * para que não apareçam na lista do usuário.
   */
  private isUiLibraryComponent(
    name: string,
    selector: string,
    imports: string[],
    dependencies: string[]
  ): boolean {
    const selectorIsMaterial = selector?.startsWith('mat-') || selector?.startsWith('cdk-');
    
    // Apenas considerar como Material se o nome começa com "Mat" E tem outro caractere maiúsculo
    // (ex: MatButton, MatCard - mas NÃO MathSuite, MathTest)
    const nameIsMaterial = name?.startsWith('Mat') && name?.match(/^Mat[A-Z]/);
    
    // Verificar se importa módulos do Material (não componentes locais)
    // Apenas marcar como Material se for um módulo/diretiva/componente do Material UI
    const importsMaterial = imports?.some(i => 
      (i.startsWith('Mat') || i.startsWith('Cdk')) && 
      (i.endsWith('Module') || i.endsWith('Directive') || i.match(/^Mat[A-Z]/))
    );
    
    // Verificar dependências de pacotes npm
    const depsMaterial = dependencies?.some(d => 
      d.includes('@angular/material') || d.includes('@angular/cdk')
    );

    return Boolean(selectorIsMaterial || nameIsMaterial || importsMaterial || depsMaterial);
  }

  // Métodos auxiliares para parsing
  private isMethodLine(line: string): boolean {
    return /^\w+\s*\([^)]*\)\s*(:\s*\w+)?\s*{?\s*$/.test(line) ||
           /^\w+\s*\([^)]*\)\s*:\s*\w+\s*{?\s*$/.test(line) ||
           /^\w+\s*\([^)]*\)\s*{?\s*$/.test(line);
  }

  private isGetterSetter(line: string): boolean {
    return line.includes('get ') || line.includes('set ');
  }

  private isPropertyLine(line: string): boolean {
    return /^\w+\s*(:\s*\w+)?\s*[=;]/.test(line) && !this.isMethodLine(line);
  }

  private isSignalLine(line: string): boolean {
    return line.includes('signal<') || line.includes('signal(');
  }

  private isComputedSignalLine(line: string): boolean {
    return line.includes('computed(');
  }

  private isInterfaceLine(line: string): boolean {
    return line.includes('interface ') && line.includes('{');
  }

  private parseMethod(line: string, lineNumber: number): ComponentMethod | null {
    const methodMatch = line.match(/(\w+)\s*\(([^)]*)\)\s*(:\s*(\w+))?/);
    if (!methodMatch) return null;

    const parameters = methodMatch[2] 
      ? methodMatch[2].split(',').map(p => p.trim()).filter(p => p.length > 0)
      : [];

    return {
      name: methodMatch[1],
      parameters,
      returnType: methodMatch[4],
      isPrivate: line.includes('private'),
      isAsync: line.includes('async'),
      lineNumber
    };
  }

  private parseProperty(line: string, lineNumber: number): ComponentProperty | null {
    const propertyMatch = line.match(/(\w+)\s*(:\s*(\w+))?\s*[=;]/);
    if (!propertyMatch) return null;

    return {
      name: propertyMatch[1],
      type: propertyMatch[3] || 'any',
      isSignal: line.includes('signal'),
      isComputed: line.includes('computed'),
      isPrivate: line.includes('private'),
      lineNumber
    };
  }

  private parseSignal(line: string, lineNumber: number): ComponentSignal | null {
    const signalMatch = line.match(/(\w+)\s*=\s*signal<(\w+)>\(([^)]*)\)/);
    if (!signalMatch) return null;

    return {
      name: signalMatch[1],
      type: signalMatch[2],
      initialValue: signalMatch[3].trim(),
      lineNumber
    };
  }

  private parseComputedSignal(line: string, lineNumber: number): ComponentComputedSignal | null {
    const computedMatch = line.match(/(\w+)\s*=\s*computed\(\(\)\s*=>\s*[^)]+\)/);
    if (!computedMatch) return null;

    // Extrair dependências básicas (simplificado)
    const dependencies = this.extractComputedDependencies(line);

    return {
      name: computedMatch[1],
      type: 'computed',
      dependencies,
      lineNumber
    };
  }

  private parseInterface(content: string, startLine: number): ComponentInterface | null {
    const lines = content.split('\n');
    const interfaceLine = lines[startLine];
    const interfaceMatch = interfaceLine.match(/interface\s+(\w+)/);
    
    if (!interfaceMatch) return null;

    const properties: InterfaceProperty[] = [];
    let currentLine = startLine + 1;
    
    // Encontrar o fechamento da interface
    while (currentLine < lines.length) {
      const line = lines[currentLine].trim();
      if (line === '}') break;
      
      if (line.includes(':') && !line.includes('interface')) {
        const propMatch = line.match(/(\w+)\??\s*:\s*(\w+)/);
        if (propMatch) {
          properties.push({
            name: propMatch[1],
            type: propMatch[2],
            optional: line.includes('?')
          });
        }
      }
      currentLine++;
    }

    return {
      name: interfaceMatch[1],
      properties,
      lineNumber: startLine + 1
    };
  }

  private extractComputedDependencies(line: string): string[] {
    // Extração simplificada de dependências de computed signals
    const dependencies: string[] = [];
    const signalMatches = line.matchAll(/(\w+)\(\)/g);
    
    for (const match of signalMatches) {
      dependencies.push(match[1]);
    }
    
    return [...new Set(dependencies)];
  }
}
