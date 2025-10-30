import { ChatGPTRequest, ChatGPTResponse } from '../../types/chatgpt';
export declare class OpenAIProvider {
    private openai;
    private readonly model;
    private readonly temperature;
    private readonly maxTokens;
    constructor(apiKey: string);
    callChat(request: ChatGPTRequest): Promise<ChatGPTResponse>;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=openaiProvider.d.ts.map