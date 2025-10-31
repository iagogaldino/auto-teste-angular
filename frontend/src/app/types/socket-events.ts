export interface SocketEvents {
  // Eventos do cliente para servidor
  'scan-directory': { directoryPath: string; options?: any };
  'select-files': { files: string[] };
  'generate-tests': { files: string[]; options?: any };
  'get-file-content': { filePath: string };
  
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
  'test-generation-completed': { results: any[]; generatedFiles?: { filePath: string; fileName: string; directory: string; content: string }[] };
  'test-generation-error': { error: string };
  
  'execute-test': { filePath: string; testCode: string; originalFilePath: string };
  'test-execution-started': { filePath: string; originalFilePath: string };
  'test-execution-output': { filePath: string; originalFilePath: string; output: string };
  'test-execution-completed': { filePath: string; originalFilePath: string; status: 'success' | 'error'; output: string };
  'test-execution-error': { filePath: string; originalFilePath: string; error: string };
  
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
  testExecution?: TestExecution;
  timestamp?: Date;
}

export interface TestExecution {
  status: 'running' | 'success' | 'error';
  output: string;
  startTime?: Date;
  endTime?: Date;
}

export interface AngularComponent {
  name: string;
  filePath: string;
  selector: string;
  isStandalone: boolean;
  imports: string[];
  templateUrl?: string;
  styleUrl?: string;
  styleUrls?: string[];
  methods: ComponentMethod[];
  properties: ComponentProperty[];
  signals: ComponentSignal[];
  computedSignals: ComponentComputedSignal[];
  interfaces: ComponentInterface[];
  dependencies: string[];
}

export interface ComponentMethod {
  name: string;
  parameters: string[];
  returnType?: string;
  isPrivate: boolean;
  isAsync: boolean;
  lineNumber: number;
}

export interface ComponentProperty {
  name: string;
  type: string;
  isSignal: boolean;
  isComputed: boolean;
  isPrivate: boolean;
  lineNumber: number;
}

export interface ComponentSignal {
  name: string;
  type: string;
  initialValue?: string;
  lineNumber: number;
}

export interface ComponentComputedSignal {
  name: string;
  type: string;
  dependencies: string[];
  lineNumber: number;
}

export interface ComponentInterface {
  name: string;
  properties: InterfaceProperty[];
  lineNumber: number;
}

export interface InterfaceProperty {
  name: string;
  type: string;
  optional: boolean;
}
