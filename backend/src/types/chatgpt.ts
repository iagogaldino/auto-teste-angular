export interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatGPTRequest {
  messages: ChatGPTMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatGPTResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatGPTMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface UnitTestRequest {
  code: string;
  language: string;
  framework?: string;
  testType?: 'unit' | 'integration' | 'e2e';
  additionalInstructions?: string;
  filePath?: string;
}

export interface UnitTestResponse {
  testCode: string;
  explanation: string;
  testCases: string[];
  dependencies?: string[];
  setupInstructions?: string;
}

export interface ChatGPTError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}
