import { ChatGPTRequest, ChatGPTResponse } from '../../types/chatgpt';
export declare class StackspotProvider {
    private accessToken?;
    private tokenExpiresAt?;
    private sessionToken?;
    private readonly model;
    private readonly temperature;
    private readonly maxTokens;
    private ensureToken;
    callChat(request: ChatGPTRequest): Promise<ChatGPTResponse>;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=stackspotProvider.d.ts.map