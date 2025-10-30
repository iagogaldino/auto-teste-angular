import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGIN: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  LOG_LEVEL: string;
  OPENAI_API_KEY: string;
  AI_PROVIDER: 'openai' | 'stackspot';
  STACKSPOT_CLIENT_ID?: string;
  STACKSPOT_CLIENT_KEY?: string;
  STACKSPOT_REALM?: string;
  STACKSPOT_TOKEN_URL?: string;
  STACKSPOT_USER_AGENT?: string;
  STACKSPOT_COMPLETIONS_URL?: string;
  STACKSPOT_AGENT_CHAT_URL?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly apiUrl = (() => {
    // Prefer environment if set
    const base = environment.apiBaseUrl ?? '';
    if (base) {
      return `${base}/api/config`;
    }
    // Fallback to same-origin in production builds
    const isBrowser = typeof window !== 'undefined' && !!window.location;
    return (isBrowser ? window.location.origin : 'http://localhost:3000') + '/api/config';
  })();

  constructor(private http: HttpClient) {}

  // Obter configuração atual
  getConfig(): Observable<{ success: boolean; config: EnvironmentConfig | null }> {
    return this.http.get<{ success: boolean; config: EnvironmentConfig | null }>(this.apiUrl);
  }

  // Salvar configuração
  saveConfig(config: Partial<EnvironmentConfig>): Observable<{ success: boolean; message: string; config: EnvironmentConfig }> {
    return this.http.post<{ success: boolean; message: string; config: EnvironmentConfig }>(this.apiUrl, config);
  }

  // Aplicar configuração (geralmente requer reiniciar o servidor)
  applyConfig(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/apply`, {});
  }
}

