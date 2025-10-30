"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
class OpenAIProvider {
    constructor(apiKey) {
        this.model = 'gpt-3.5-turbo';
        this.temperature = 0.7;
        this.maxTokens = 2000;
        this.openai = new openai_1.default({ apiKey });
    }
    async callChat(request) {
        try {
            const response = await this.openai.chat.completions.create({
                model: request.model || this.model,
                messages: request.messages,
                temperature: request.temperature ?? this.temperature,
                max_tokens: request.max_tokens ?? this.maxTokens,
            });
            return response;
        }
        catch (error) {
            if (error.response?.data) {
                const chatGPTError = error.response.data;
                throw new Error(`Erro da API ChatGPT: ${chatGPTError.error.message}`);
            }
            throw new Error(`Erro na comunicação com ChatGPT: ${error.message}`);
        }
    }
    async testConnection() {
        try {
            await this.callChat({ messages: [{ role: 'user', content: 'Responda apenas com "OK" para testar a conexão.' }], max_tokens: 10 });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=openaiProvider.js.map