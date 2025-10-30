import OpenAI from 'openai';
import { ChatGPTRequest, ChatGPTResponse, ChatGPTError } from '../../types/chatgpt';

export class OpenAIProvider {
  private openai: OpenAI;
  private readonly model = 'gpt-3.5-turbo';
  private readonly temperature = 0.7;
  private readonly maxTokens = 2000;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async callChat(request: ChatGPTRequest): Promise<ChatGPTResponse> {
    try {
      const response = await this.openai.chat.completions.create({
        model: request.model || this.model,
        messages: request.messages,
        temperature: request.temperature ?? this.temperature,
        max_tokens: request.max_tokens ?? this.maxTokens,
      });
      return response as ChatGPTResponse;
    } catch (error: any) {
      if (error.response?.data) {
        const chatGPTError: ChatGPTError = error.response.data;
        throw new Error(`Erro da API ChatGPT: ${chatGPTError.error.message}`);
      }
      throw new Error(`Erro na comunicação com ChatGPT: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.callChat({ messages: [{ role: 'user', content: 'Responda apenas com "OK" para testar a conexão.' }], max_tokens: 10 });
      return true;
    } catch {
      return false;
    }
  }

}


