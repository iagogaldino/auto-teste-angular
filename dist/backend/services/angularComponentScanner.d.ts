import { ScanOptions, ScanResult } from '../types/angularComponent';
export declare class AngularComponentScanner {
    private readonly defaultOptions;
    scanDirectory(directoryPath: string, options?: Partial<ScanOptions>): Promise<ScanResult>;
    private findTypeScriptFiles;
    private analyzeFile;
    private isAngularComponent;
    private extractComponentName;
    private extractSelector;
    private isStandaloneComponent;
    private extractImports;
    private extractTemplateUrl;
    private extractStyleUrl;
    private extractStyleUrls;
    private extractMethods;
    private extractProperties;
    private extractSignals;
    private extractComputedSignals;
    private extractInterfaces;
    private extractDependencies;
    private isUiLibraryComponent;
    private isMethodLine;
    private isGetterSetter;
    private isPropertyLine;
    private isSignalLine;
    private isComputedSignalLine;
    private isInterfaceLine;
    private parseMethod;
    private parseProperty;
    private parseSignal;
    private parseComputedSignal;
    private parseInterface;
    private extractComputedDependencies;
}
//# sourceMappingURL=angularComponentScanner.d.ts.map