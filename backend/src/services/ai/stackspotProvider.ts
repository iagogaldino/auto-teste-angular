import { ChatGPTRequest, ChatGPTResponse } from '../../types/chatgpt';
import { config as env } from '../../config/environment';

export class StackspotProvider {
  private accessToken?: string;
  private tokenExpiresAt?: number;
  private sessionToken?: string;

  private readonly model = 'gpt-3.5-turbo';
  private readonly temperature = 0.7;
  private readonly maxTokens = 2000;

  private async ensureToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.tokenExpiresAt && now < this.tokenExpiresAt - 30_000) return this.accessToken;

    const clientId = env.STACKSPOT_CLIENT_ID;
    const clientSecret = env.STACKSPOT_CLIENT_KEY;
    const realm = env.STACKSPOT_REALM || 'stackspot-freemium';
    const tokenUrl = env.STACKSPOT_TOKEN_URL || `https://idm.stackspot.com/${realm}/oidc/oauth/token`;
    if (!clientId || !clientSecret) throw new Error('STACKSPOT_CLIENT_ID/STACKSPOT_CLIENT_KEY não configurados');

    const form = new URLSearchParams();
    form.append('client_id', clientId);
    form.append('grant_type', 'client_credentials');
    form.append('client_secret', clientSecret);

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': env.STACKSPOT_USER_AGENT || 'AutoUnitTest/1.0 (+backend)'
    };

    const resp = await fetch(tokenUrl, { method: 'POST', headers, body: form as unknown as any });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Falha no token Stackspot: ${resp.status} ${txt}`);
    }
    const tokenJson = await resp.json() as { access_token: string; expires_in?: number; session_state?: string; session_token?: string };
    this.accessToken = tokenJson.access_token;
    this.tokenExpiresAt = Date.now() + (tokenJson.expires_in || 3600) * 1000;
    this.sessionToken = tokenJson.session_token || tokenJson.session_state || undefined;
    return this.accessToken;
  }

  async callChat(request: ChatGPTRequest): Promise<ChatGPTResponse> {
    const url = env.STACKSPOT_AGENT_CHAT_URL || env.STACKSPOT_COMPLETIONS_URL;
    if (!url) throw new Error('Nenhuma URL do Stackspot configurada. Defina STACKSPOT_AGENT_CHAT_URL ou STACKSPOT_COMPLETIONS_URL.');

    const token = await this.ensureToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': env.STACKSPOT_USER_AGENT || 'AutoUnitTest/1.0 (+backend)'
    };
    if (this.sessionToken) headers['session_token'] = this.sessionToken;

    const isAgentChat = !!env.STACKSPOT_AGENT_CHAT_URL || /\/v1\/agent\/.+\/chat$/i.test(url);

    const lastUserMsg = [...request.messages].reverse().find(m => m.role === 'user')?.content;
    const concatenated = request.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    const body = isAgentChat
      ? { streaming: false, user_prompt: lastUserMsg || concatenated || 'Generate unit tests', stackspot_knowledge: false, return_ks_in_response: true }
      : { model: request.model || this.model, messages: request.messages, temperature: request.temperature || this.temperature, max_tokens: request.max_tokens || this.maxTokens };

    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Erro na chamada ao Stackspot (${url}): ${resp.status} ${txt}`);
    }
    const data: any = await resp.json();

    if (isAgentChat) {
      if (Array.isArray(data)) {
        const first = data[0] || {};
        const code: string = first.code || '';
        const normalized = { testCode: code, explanation: 'Gerado via Stackspot Agent Chat', testCases: [], dependencies: [], setupInstructions: '' };
        return { id: 'stackspot-agent-files', object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: request.model || this.model, choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(normalized) }, finish_reason: 'stop' }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } } as ChatGPTResponse;
      }
      const text: string = (data && (data.output || data.message || data.content || data.response || '')) as string;
      return { id: (data && data.id) || 'stackspot-agent-response', object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: request.model || this.model, choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } } as ChatGPTResponse;
    }

    return data as ChatGPTResponse;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.callChat({ messages: [{ role: 'user', content: 'OK?' }], max_tokens: 10 });
      return true;
    } catch {
      return false;
    }
  }
}


