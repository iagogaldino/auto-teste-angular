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

export interface ScanOptions {
  includeTests?: boolean;
  includeSpecs?: boolean;
  recursive?: boolean;
  fileExtensions?: string[];
  excludePatterns?: string[];
}

export interface ScanResult {
  components: AngularComponent[];
  totalFiles: number;
  scannedFiles: number;
  errors: ScanError[];
  scanTime: number;
  fileTree?: FileTreeNode[];
}

export interface ScanError {
  filePath: string;
  error: string;
  lineNumber?: number;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children?: FileTreeNode[];
}
