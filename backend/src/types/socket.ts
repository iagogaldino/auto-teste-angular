export interface SocketMessage {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  data?: any;
}

export interface TestExecutionLog {
  testId: string;
  step: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  message: string;
  timestamp: string;
  duration?: number;
}

export interface TestResult {
  testId: string;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  executionTime: number;
  timestamp: string;
  details?: {
    expected?: any;
    actual?: any;
    diff?: any;
  };
}

export interface ClientInfo {
  socketId: string;
  connectedAt: string;
  lastActivity: string;
  subscribedTests: string[];
}
