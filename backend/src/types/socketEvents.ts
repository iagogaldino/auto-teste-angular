export interface SocketEvents {
  // Eventos do cliente para servidor
  'scan-directory': { directoryPath: string; options?: any };
  'select-files': { files: string[] };
  'generate-tests': { files: string[]; options?: any };
  'get-file-content': { filePath: string };
  'create-test-file': { filePath: string; content: string };
  
  // Eventos do servidor para cliente
  'scan-started': { directoryPath: string };
  'scan-progress': { current: number; total: number; currentFile: string };
  'scan-completed': { result: any };
  'scan-error': { error: string };
  
  'file-content': { filePath: string; content: string };
  'file-content-error': { filePath: string; error: string };
  
  'test-generation-started': { files: string[] };
  'test-generation-progress': { current: number; total: number; currentFile: string };
  'test-generated': { filePath: string; testCode: string; explanation: string };
  'test-generation-completed': { results: any[] };
  'test-generation-error': { error: string };
  
  'test-file-created': { filePath: string; success: boolean };
  'test-file-error': { filePath: string; error: string };
  
  'connection': void;
  'disconnect': void;
}

export interface ScanProgressData {
  current: number;
  total: number;
  currentFile: string;
  percentage: number;
}

export interface TestGenerationProgress {
  current: number;
  total: number;
  currentFile: string;
  percentage: number;
}

export interface TestGenerationResult {
  filePath: string;
  testCode: string;
  explanation: string;
  testCases: string[];
  dependencies: string[];
  setupInstructions?: string;
  success: boolean;
  error?: string;
}
