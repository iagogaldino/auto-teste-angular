import { ChatGPTRequest, ChatGPTResponse } from '../../types/chatgpt';

export interface AIProvider {
  testConnection(): Promise<boolean>;
  callChat(request: ChatGPTRequest): Promise<ChatGPTResponse>;
}


