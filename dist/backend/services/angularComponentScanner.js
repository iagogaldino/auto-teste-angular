"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AngularComponentScanner = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const glob_1 = require("glob");
const logger_1 = require("./logger");
class AngularComponentScanner {
    constructor() {
        this.defaultOptions = {
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
                '**/e2e/**',
                '**/*.json',
                '**/.prettierrc*',
                '**/.eslintrc*',
                '**/out-tsc/**',
                '.angular/**'
            ]
        };
    }
    async scanDirectory(directoryPath, options = {}) {
        const startTime = Date.now();
        const finalOptions = { ...this.defaultOptions, ...options };
        try {
            logger_1.logger.info('scan_start', { directoryPath });
            if (!(0, fs_1.existsSync)(directoryPath)) {
                throw new Error(`Diretório não encontrado: ${directoryPath}`);
            }
            if (!(0, fs_1.statSync)(directoryPath).isDirectory()) {
                throw new Error(`Caminho não é um diretório: ${directoryPath}`);
            }
            const files = await this.findTypeScriptFiles(directoryPath, finalOptions);
            const components = [];
            const errors = [];
            let scannedFiles = 0;
            for (const filePath of files) {
                try {
                    const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
                    const relativePath = (0, path_1.relative)(directoryPath, filePath);
                    const fileName = relativePath.split(/[/\\]/).pop() || relativePath;
                    const componentName = fileName.replace('.ts', '');
                    const component = {
                        name: componentName,
                        filePath: relativePath,
                        selector: '',
                        isStandalone: true,
                        imports: this.extractImports(content),
                        methods: this.extractMethods(content),
                        properties: this.extractProperties(content),
                        signals: this.extractSignals(content),
                        computedSignals: this.extractComputedSignals(content),
                        interfaces: this.extractInterfaces(content),
                        dependencies: this.extractDependencies(content)
                    };
                    components.push(component);
                    scannedFiles++;
                }
                catch (error) {
                    errors.push({
                        filePath,
                        error: error instanceof Error ? error.message : 'Erro desconhecido'
                    });
                }
            }
            const scanTime = Date.now() - startTime;
            const res = {
                components,
                totalFiles: files.length,
                scannedFiles,
                errors,
                scanTime
            };
            logger_1.logger.info('scan_done', { directoryPath, components: components.length, files: files.length, ms: scanTime, errors: errors.length });
            return res;
        }
        catch (error) {
            logger_1.logger.error('scan_fail', { directoryPath, error: error instanceof Error ? error.message : 'unknown' });
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
    async findTypeScriptFiles(directoryPath, options) {
        const patterns = options.fileExtensions.map(ext => options.recursive ? `**/*${ext}` : `*${ext}`);
        const excludePatterns = options.excludePatterns;
        if (!options.includeTests) {
            excludePatterns.push('**/*.spec.ts', '**/*.test.ts');
        }
        if (!options.includeSpecs) {
            excludePatterns.push('**/*.spec.ts');
        }
        const allFiles = [];
        for (const pattern of patterns) {
            const files = await (0, glob_1.glob)(pattern, {
                cwd: directoryPath,
                ignore: excludePatterns,
                absolute: true
            });
            allFiles.push(...files);
        }
        const uniqueFiles = [...new Set(allFiles)];
        return uniqueFiles;
    }
    async analyzeFile(filePath, baseDirectory) {
        try {
            const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
            const relativePath = (0, path_1.relative)(baseDirectory, filePath);
            const name = this.extractComponentName(content);
            const selector = this.extractSelector(content);
            const imports = this.extractImports(content);
            const dependencies = this.extractDependencies(content);
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
        }
        catch (error) {
            throw new Error(`Erro ao analisar arquivo ${filePath}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }
    isAngularComponent(content) {
        const hasComponent = content.includes('@Component');
        const hasExportClass = content.includes('export class');
        if (!hasComponent || !hasExportClass) {
            return false;
        }
        const decoratorBoundClassMatch = content.match(/@Component[\s\S]*?export class\s+(\w+)/);
        return decoratorBoundClassMatch !== null;
    }
    extractComponentName(content) {
        const decoratorBoundClassMatch = content.match(/@Component[\s\S]*?export class\s+(\w+)/);
        if (decoratorBoundClassMatch) {
            return decoratorBoundClassMatch[1];
        }
        const classWithSuffixMatch = content.match(/export class\s+(\w+Component)\b/);
        if (classWithSuffixMatch) {
            return classWithSuffixMatch[1];
        }
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
    extractSelector(content) {
        const selectorMatch = content.match(/selector:\s*['"`]([^'"`]+)['"`]/);
        return selectorMatch ? selectorMatch[1] : '';
    }
    isStandaloneComponent(content) {
        return content.includes('standalone: true');
    }
    extractImports(content) {
        const importsMatch = content.match(/imports:\s*\[([^\]]+)\]/);
        if (!importsMatch)
            return [];
        return importsMatch[1]
            .split(',')
            .map(imp => imp.trim())
            .filter(imp => imp.length > 0);
    }
    extractTemplateUrl(content) {
        const templateUrlMatch = content.match(/templateUrl:\s*['"`]([^'"`]+)['"`]/);
        return templateUrlMatch ? templateUrlMatch[1] : undefined;
    }
    extractStyleUrl(content) {
        const styleUrlMatch = content.match(/styleUrl:\s*['"`]([^'"`]+)['"`]/);
        return styleUrlMatch ? styleUrlMatch[1] : undefined;
    }
    extractStyleUrls(content) {
        const styleUrlsMatch = content.match(/styleUrls:\s*\[([^\]]+)\]/);
        if (!styleUrlsMatch)
            return [];
        return styleUrlsMatch[1]
            .split(',')
            .map(url => url.trim().replace(/['"`]/g, ''))
            .filter(url => url.length > 0);
    }
    extractMethods(content) {
        const methods = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (this.isMethodLine(line) && !this.isGetterSetter(line)) {
                const method = this.parseMethod(line, i + 1);
                if (method) {
                    methods.push(method);
                }
            }
        }
        return methods;
    }
    extractProperties(content) {
        const properties = [];
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
    extractSignals(content) {
        const signals = [];
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
    extractComputedSignals(content) {
        const computedSignals = [];
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
    extractInterfaces(content) {
        const interfaces = [];
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
    extractDependencies(content) {
        const dependencies = [];
        const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g);
        for (const match of importMatches) {
            dependencies.push(match[1]);
        }
        return [...new Set(dependencies)];
    }
    isUiLibraryComponent(name, selector, imports, dependencies) {
        const selectorIsMaterial = selector?.startsWith('mat-') || selector?.startsWith('cdk-');
        const nameIsMaterial = name?.startsWith('Mat') && name?.match(/^Mat[A-Z]/);
        const importsMaterial = imports?.some(i => (i.startsWith('Mat') || i.startsWith('Cdk')) &&
            (i.endsWith('Module') || i.endsWith('Directive') || i.match(/^Mat[A-Z]/)));
        const depsMaterial = dependencies?.some(d => d.includes('@angular/material') || d.includes('@angular/cdk'));
        return Boolean(selectorIsMaterial || nameIsMaterial || importsMaterial || depsMaterial);
    }
    isMethodLine(line) {
        return /^\w+\s*\([^)]*\)\s*(:\s*\w+)?\s*{?\s*$/.test(line) ||
            /^\w+\s*\([^)]*\)\s*:\s*\w+\s*{?\s*$/.test(line) ||
            /^\w+\s*\([^)]*\)\s*{?\s*$/.test(line);
    }
    isGetterSetter(line) {
        return line.includes('get ') || line.includes('set ');
    }
    isPropertyLine(line) {
        return /^\w+\s*(:\s*\w+)?\s*[=;]/.test(line) && !this.isMethodLine(line);
    }
    isSignalLine(line) {
        return line.includes('signal<') || line.includes('signal(');
    }
    isComputedSignalLine(line) {
        return line.includes('computed(');
    }
    isInterfaceLine(line) {
        return line.includes('interface ') && line.includes('{');
    }
    parseMethod(line, lineNumber) {
        const methodMatch = line.match(/(\w+)\s*\(([^)]*)\)\s*(:\s*(\w+))?/);
        if (!methodMatch)
            return null;
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
    parseProperty(line, lineNumber) {
        const propertyMatch = line.match(/(\w+)\s*(:\s*(\w+))?\s*[=;]/);
        if (!propertyMatch)
            return null;
        return {
            name: propertyMatch[1],
            type: propertyMatch[3] || 'any',
            isSignal: line.includes('signal'),
            isComputed: line.includes('computed'),
            isPrivate: line.includes('private'),
            lineNumber
        };
    }
    parseSignal(line, lineNumber) {
        const signalMatch = line.match(/(\w+)\s*=\s*signal<(\w+)>\(([^)]*)\)/);
        if (!signalMatch)
            return null;
        return {
            name: signalMatch[1],
            type: signalMatch[2],
            initialValue: signalMatch[3].trim(),
            lineNumber
        };
    }
    parseComputedSignal(line, lineNumber) {
        const computedMatch = line.match(/(\w+)\s*=\s*computed\(\(\)\s*=>\s*[^)]+\)/);
        if (!computedMatch)
            return null;
        const dependencies = this.extractComputedDependencies(line);
        return {
            name: computedMatch[1],
            type: 'computed',
            dependencies,
            lineNumber
        };
    }
    parseInterface(content, startLine) {
        const lines = content.split('\n');
        const interfaceLine = lines[startLine];
        const interfaceMatch = interfaceLine.match(/interface\s+(\w+)/);
        if (!interfaceMatch)
            return null;
        const properties = [];
        let currentLine = startLine + 1;
        while (currentLine < lines.length) {
            const line = lines[currentLine].trim();
            if (line === '}')
                break;
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
    extractComputedDependencies(line) {
        const dependencies = [];
        const signalMatches = line.matchAll(/(\w+)\(\)/g);
        for (const match of signalMatches) {
            dependencies.push(match[1]);
        }
        return [...new Set(dependencies)];
    }
}
exports.AngularComponentScanner = AngularComponentScanner;
//# sourceMappingURL=angularComponentScanner.js.map