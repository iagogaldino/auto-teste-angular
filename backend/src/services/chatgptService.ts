import { config as env } from '../config/environment';
import { 
  ChatGPTRequest, 
  ChatGPTResponse, 
  UnitTestRequest, 
  UnitTestResponse, 
  ChatGPTError 
} from '../types/chatgpt';
import { AIProvider } from './ai/aiProvider';
import { OpenAIProvider } from './ai/openaiProvider';
import { StackspotProvider } from './ai/stackspotProvider';
import { logger, writeRaw } from './logger';
import {
  buildGenerationSystemPrompt,
  buildGenerationUserPrompt,
  buildFixSystemPrompt,
  buildFixUserPrompt,
  buildNormalizeSystemPrompt
} from './prompts';

export class ChatGPTService {
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly provider: 'openai' | 'stackspot';
  private aiProvider: AIProvider;

  constructor() {
    this.provider = env.AI_PROVIDER;
    const apiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY;

    this.model = 'gpt-3.5-turbo';
    this.temperature = 0.7;
    this.maxTokens = 2000;

    this.aiProvider = this.provider === 'stackspot' ? new StackspotProvider() : (() => {
      // OpenAI provider requires API key
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY não encontrada nas variáveis de ambiente');
      }
      return new OpenAIProvider(apiKey);
    })();
  }

  /**
   * Gera um teste unitário para o código fornecido
   */
  async generateUnitTest(request: UnitTestRequest): Promise<UnitTestResponse> {
    try {
      const t0 = Date.now();
      logger.info('ai_generate_start', { provider: this.provider, model: this.model, language: request.language });
      const systemPrompt = buildGenerationSystemPrompt({ language: request.language, framework: request.framework, testType: request.testType });
      const userPrompt = buildGenerationUserPrompt({ language: request.language, code: request.code, filePath: request.filePath, additionalInstructions: request.additionalInstructions });

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt }
      ];

      const chatRequest: ChatGPTRequest = {
        messages,
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens
      };

      // Registrar o payload completo enviado para a IA
      try {
        const payload = JSON.stringify(chatRequest, null, 2);
        logger.debug('ai_request_built', { length: payload.length });
        writeRaw('ai-request', payload, 'json');
      } catch {}

      const response = await this.callChatGPT(chatRequest);
      const parsed = await this.parseUnitTestResponse(response);
      logger.info('ai_generate_done', { ms: Date.now() - t0, hasCode: Boolean(parsed.testCode) });
      return parsed;
    } catch (error) {
      logger.error('ai_generate_fail', { error: error instanceof Error ? error.message : 'unknown' });
      throw new Error(`Falha na geração do teste unitário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Faz a chamada para a API do ChatGPT
   */
  private async callChatGPT(request: ChatGPTRequest): Promise<ChatGPTResponse> {
    try {
      const t = Date.now();
      const res = await this.aiProvider.callChat(request);
      logger.debug('ai_call_ok', { ms: Date.now() - t });
      return res;
    } catch (error: any) {
      logger.error('ai_call_error', { 
        error: error?.response?.data?.error?.message || (error instanceof Error ? error.message : 'unknown')
      });
      if (error?.response?.data) {
        const chatGPTError: ChatGPTError = error.response.data;
        throw new Error(`Erro da API: ${chatGPTError.error.message}`);
      }
      throw error;
    }
  }

  // Stackspot/OpenAI specifics handled by providers now

  // prompts de geração movidos para './prompts'

  /**
   * Faz o parse da resposta do ChatGPT para UnitTestResponse
   */
  private async parseUnitTestResponse(response: ChatGPTResponse): Promise<UnitTestResponse> {
    try {
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Resposta vazia do ChatGPT');
      }

      // Registrar conteúdo bruto para diagnóstico (preview e arquivo completo)
      logger.debug('ai_response_raw', { length: content.length, preview: content.substring(0, 500) });
      writeRaw('ai-response', content, 'txt');

      // 0) Caminho rápido: extrair código puro se houver cercas ou se parecer código
      const fencedRegex = /```(?:typescript|ts|javascript|js)?\s*([\s\S]*?)\s*```/g;
      const testPattern = /(describe\(|\bit\(|\btest\(|TestBed\.)/;
      let bestBlock: string | null = null;
      let m: RegExpExecArray | null;
      while ((m = fencedRegex.exec(content)) !== null) {
        const block = (m[1] || '').trim();
        if (!block) continue;
        if (!bestBlock) {
          bestBlock = block;
        } else {
          const currentScore = (bestBlock.match(/\n/g) || []).length + (testPattern.test(bestBlock) ? 50 : 0);
          const newScore = (block.match(/\n/g) || []).length + (testPattern.test(block) ? 50 : 0);
          if (newScore > currentScore) bestBlock = block;
        }
      }
      if (bestBlock) {
        const codeOnly = this.sanitizeForJest(bestBlock.trim());
        return {
          testCode: this.fixUnclosedBlocks(codeOnly),
          explanation: 'Código retornado diretamente pela IA (bloco selecionado)',
          testCases: [],
          dependencies: [],
          setupInstructions: ''
        };
      }
      const looksLikeCode = /describe\(|import\s+|TestBed\.|expect\(/.test(content);
      if (looksLikeCode) {
        const codeOnly = this.sanitizeForJest(content.trim());
        return {
          testCode: this.fixUnclosedBlocks(codeOnly),
          explanation: 'Código retornado diretamente pela IA',
          testCases: [],
          dependencies: [],
          setupInstructions: ''
        };
      }

      // Tenta extrair JSON da resposta (pode estar dentro de markdown)
      let jsonContent = content;
      
      // Se a resposta contém ```json, extrai apenas o JSON
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
        // json extraído de markdown
      } else {
        // Se não tem markdown, tenta encontrar o JSON na resposta
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonContent = content.substring(jsonStart, jsonEnd + 1);
          // json extraído diretamente da resposta
        }
      }

      // Registrar tentativa de JSON extraído
      logger.debug('ai_response_json_attempt', { length: jsonContent.length, preview: jsonContent.substring(0, 500) });
      writeRaw('ai-response-json', jsonContent, 'json');

      // Tenta fazer o parse do JSON
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(jsonContent);
      } catch (e) {
        // Se o JSON estiver inválido, tentar normalização via IA
        logger.warn('ai_response_json_invalid', { reason: e instanceof Error ? e.message : 'unknown' });
        const normalized = await this.normalizeAiResponse(content);
        parsedResponse = normalized;
      }

      // Aceita formatos alternativos vindos do Stackspot Agent Chat
      let normalizedResponse: any = parsedResponse;
      if (Array.isArray(parsedResponse)) {
        const first = parsedResponse[0] || {};
        if (first && typeof first === 'object' && first.code) {
          normalizedResponse = {
            testCode: first.code,
            explanation: 'Gerado via Stackspot Agent Chat',
            testCases: [],
            dependencies: [],
            setupInstructions: ''
          };
        }
      } else if (parsedResponse && parsedResponse.code && !parsedResponse.testCode) {
        normalizedResponse = {
          ...parsedResponse,
          testCode: parsedResponse.code,
          explanation: parsedResponse.explanation || 'Gerado via Stackspot Agent Chat'
        };
      } else if (parsedResponse && parsedResponse.contents && !parsedResponse.testCode) {
        // Heurística para respostas com { contents: "<código>" }
        normalizedResponse = {
          testCode: parsedResponse.contents,
          explanation: parsedResponse.explanation || 'Conteúdo convertido automaticamente',
          testCases: parsedResponse.testCases || [],
          dependencies: parsedResponse.dependencies || [],
          setupInstructions: parsedResponse.setupInstructions || ''
        };
      } else if (parsedResponse && Array.isArray(parsedResponse.tests)) {
        const tests = parsedResponse.tests || [];
        const codes = tests
          .map((t: any) => (t && typeof t.code === 'string' ? t.code : ''))
          .filter((c: string) => c.length > 0);
        const descriptions = tests
          .map((t: any) => (t && typeof t.description === 'string' ? t.description : ''))
          .filter((d: string) => d.length > 0);
        const mergedCode = codes.length > 0 ? codes.join('\n\n') : '';
        normalizedResponse = {
          testCode: mergedCode,
          explanation: parsedResponse.explanation || 'Normalizado de coleção de testes',
          testCases: parsedResponse.testCases || descriptions,
          dependencies: parsedResponse.dependencies || [],
          setupInstructions: parsedResponse.setupInstructions || ''
        };
      }

      // Valida se tem os campos obrigatórios; se não tiver, tentar normalização via IA
      if (!normalizedResponse.testCode || !normalizedResponse.explanation) {
        logger.warn('ai_response_missing_fields');
        const normalized = await this.normalizeAiResponse(jsonContent);
        normalizedResponse = normalized;
        if (!normalizedResponse.testCode || !normalizedResponse.explanation) {
          // último fallback: trate a resposta inteira como código
          return {
            testCode: this.fixUnclosedBlocks(this.sanitizeForJest(content.trim())),
            explanation: 'Fallback: resposta tratada como código',
            testCases: [],
            dependencies: [],
            setupInstructions: ''
          };
        }
      }

      // Limpa o testCode removendo escape characters duplicados
      let testCode = normalizedResponse.testCode;
      if (typeof testCode === 'string') {
        // Remove escapes duplicados que podem ter sido gerados
        testCode = testCode
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\"/g, '"')
          .replace(/\\\\/g, '\\');
        
        // Corrige blocos não fechados
        testCode = this.fixUnclosedBlocks(testCode);
      }

      return {
        testCode: testCode,
        explanation: normalizedResponse.explanation,
        testCases: normalizedResponse.testCases || [],
        dependencies: normalizedResponse.dependencies || [],
        setupInstructions: normalizedResponse.setupInstructions || ''
      };
    } catch (error) {
      logger.error('ai_response_parse_error', { error: error instanceof Error ? error.message : 'unknown' });
      
      // Tenta extrair informações úteis do erro
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Se for erro de JSON, fornece informações mais detalhadas
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          errorMessage += '. A resposta do ChatGPT pode ter contido JSON malformado.';
        }
      }
      
      throw new Error(`Erro ao processar resposta do ChatGPT: ${errorMessage}`);
    }
  }

  /**
   * Pede para a IA normalizar qualquer conteúdo em um JSON no formato esperado
   */
  private async normalizeAiResponse(content: string): Promise<{ testCode: string; explanation: string; testCases?: string[]; dependencies?: string[]; setupInstructions?: string }>{
    const system = buildNormalizeSystemPrompt();
    const messages = [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: `Conteúdo a normalizar:\n\n${content}` }
    ];
    const req: ChatGPTRequest = { messages, model: this.model, temperature: 0, max_tokens: this.maxTokens };
    try {
      const payload = JSON.stringify(req, null, 2);
      writeRaw('ai-normalize-request', payload, 'json');
    } catch {}
    const res = await this.callChatGPT(req);
    const raw = res.choices[0]?.message?.content || '';
    writeRaw('ai-normalize-response', raw, 'txt');
    // 1) JSON direto ou dentro de cercas ```json
    let json = raw;
    const jsonFence = raw.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonFence) json = jsonFence[1].trim();
    let start = json.indexOf('{');
    let end = json.lastIndexOf('}');
    if (start !== -1 && end > start) {
      const slice = json.substring(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch {}
    }
    try {
      return JSON.parse(json);
    } catch {}
    // 2) Se não veio JSON válido, mas veio bloco de código
    const codeFence = raw.match(/```(typescript|ts|javascript|js)?\s*([\s\S]*?)\s*```/);
    if (codeFence) {
      const code = codeFence[2].trim();
      return {
        testCode: code,
        explanation: 'Normalizado de bloco de código',
        testCases: [],
        dependencies: [],
        setupInstructions: ''
      };
    }
    // 3) Heurística para campos alternativos em JSON simples
    try {
      const maybe = JSON.parse(raw);
      const candidate = (maybe && (maybe.contents || maybe.content || maybe.code)) as string | undefined;
      if (candidate) {
        return {
          testCode: String(candidate),
          explanation: 'Normalizado de campos alternativos',
          testCases: maybe.testCases || [],
          dependencies: maybe.dependencies || [],
          setupInstructions: maybe.setupInstructions || ''
        };
      }
    } catch {}
    // 4) Último recurso: tratar tudo como código (usa o texto bruto)
    return {
      testCode: this.fixUnclosedBlocks(this.sanitizeForJest(String(raw || '')).trim()),
      explanation: 'Normalizado de texto livre',
      testCases: [],
      dependencies: [],
      setupInstructions: ''
    };
  }

  /**
   * Corrige um teste unitário que falhou
   */
  async fixUnitTestError(request: {
    componentCode: string;
    testCode: string;
    errorMessage: string;
    componentName: string;
    filePath: string;
  }): Promise<UnitTestResponse> {
    try {
      const t0 = Date.now();
      logger.info('ai_fix_start', { component: request.componentName });
      const systemPrompt = buildFixSystemPrompt();
      const userPrompt = buildFixUserPrompt(request);

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt }
      ];

      const chatRequest: ChatGPTRequest = {
        messages,
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens
      };

      // Registrar o payload completo enviado para a IA (fix)
      try {
        const payload = JSON.stringify(chatRequest, null, 2);
        logger.debug('ai_fix_request_built', { length: payload.length });
        writeRaw('ai-fix-request', payload, 'json');
      } catch {}

      const response = await this.callChatGPT(chatRequest);
      let parsed = this.parseFixErrorResponse(response);

      // Validação básica: precisa parecer um arquivo de teste Jest/Angular
      const isValid = this.isValidTestCode(parsed.testCode || '');
      if (!isValid) {
        // Segundo intento com instruções mais fortes
        const retryMessages = [
          { role: 'system' as const, content: systemPrompt + '\n\nREQUISITOS RÍGIDOS: gere um teste COMPLETO para Jest + Angular, com imports necessários, configuração do TestBed e pelo menos 2 casos (it). Apenas código puro.' },
          { role: 'user' as const, content: `${userPrompt}\n\nSua resposta anterior foi insuficiente. Gere um arquivo de teste completo (.spec.ts).` }
        ];
        const retryReq: ChatGPTRequest = { ...chatRequest, messages: retryMessages };
        const retryRes = await this.callChatGPT(retryReq);
        parsed = this.parseFixErrorResponse(retryRes);
      }

      logger.info('ai_fix_done', { ms: Date.now() - t0, hasCode: Boolean(parsed.testCode) });
      return parsed;
    } catch (error) {
      logger.error('ai_fix_fail', { error: error instanceof Error ? error.message : 'unknown' });
      throw new Error(`Erro ao corrigir teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private isValidTestCode(code: string): boolean {
    const src = (code || '').trim();
    if (src.length < 80) return false; // evita respostas triviais
    const hasDescribe = /\bdescribe\s*\(/.test(src);
    const hasIt = /\bit\s*\(/.test(src) || /\btest\s*\(/.test(src);
    const hasImport = /\bimport\s+.*from\s+['"].+['"];?/.test(src);
    return hasDescribe && hasIt && hasImport;
  }

  // Normalizações para Jest (substitui matchers Jasmine e melhora comparações de NaN)
  private sanitizeForJest(code: string): string {
    let out = String(code || '');
    // Jasmine -> Jest
    out = out.replace(/\.toBeTrue\(\)/g, '.toBe(true)');
    out = out.replace(/\.toBeFalse\(\)/g, '.toBe(false)');
    // NaN matcher
    out = out.replace(/\.toEqual\(\s*NaN\s*\)/g, '.toBeNaN()');
    // jasmine.* matchers -> Jest expect.* utilities
    out = out.replace(/jasmine\.arrayContaining\s*\(/g, 'expect.arrayContaining(');
    out = out.replace(/jasmine\.objectContaining\s*\(/g, 'expect.objectContaining(');
    // Corrigir import incorreto de ROUTES
    if (/\bROUTES\b/.test(out)) {
      // Remove import errado de ROUTES de '@angular/core'
      out = out.replace(/import\s*\{[^}]*ROUTES[^}]*\}\s*from\s*'@angular\/core';?\n?/g, '');
      // Garante import correto de ROUTES de '@angular/router'
      const hasRouterImport = /from\s*'@angular\/router'/.test(out);
      if (hasRouterImport) {
        // Acrescenta ROUTES no import existente de @angular/router
        out = out.replace(/import\s*\{([^}]*)\}\s*from\s*'@angular\/router';/g, (m, g1) => {
          const names = g1.split(',').map(s => s.trim());
          if (!names.includes('ROUTES')) names.push('ROUTES');
          return `import { ${names.join(', ')} } from '@angular/router';`;
        });
      } else {
        out = `import { ROUTES } from '@angular/router';\n` + out;
      }
    }
    // Garantir import de ErrorHandler quando usado
    if (/\bErrorHandler\b/.test(out)) {
      const hasCoreImport = /from\s*'@angular\/core'/.test(out);
      if (hasCoreImport) {
        out = out.replace(/import\s*\{([^}]*)\}\s*from\s*'@angular\/core';/g, (m, g1) => {
          const names = g1.split(',').map(s => s.trim()).filter(Boolean);
          if (!names.includes('ErrorHandler')) names.push('ErrorHandler');
          return `import { ${names.join(', ')} } from '@angular/core';`;
        });
      } else {
        out = `import { ErrorHandler } from '@angular/core';\n` + out;
      }
    }
    // Evitar criação manual de InjectionToken para ZoneChangeDetectionOptions
    if (/new\s+InjectionToken\s*<.*?>?\s*\(\s*['"]ZoneChangeDetectionOptions['"]\s*\)/.test(out)) {
      out = out.replace(/.*new\s+InjectionToken[\s\S]*?\);\n?/g, '');
    }
    // Prefer expect(...).toBeNaN() where appropriate
    return out;
  }

  // prompts de correção movidos para './prompts'

  /**
   * Faz parse da resposta de correção de erro
   */
  private parseFixErrorResponse(response: any): UnitTestResponse {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Resposta vazia do ChatGPT');
      }

      // Registrar conteúdo bruto para diagnóstico
      logger.debug('ai_fix_response_raw', { length: content.length, preview: content.substring(0, 500) });
      writeRaw('ai-fix-response', content, 'txt');

      // Caminho rápido: extrair código puro
      // Preferir o MAIOR bloco cercado ou aquele que contenha trechos típicos de teste (describe/it/TestBed)
      const fencedRegex = /```(?:typescript|ts|javascript|js)?\s*([\s\S]*?)\s*```/g;
      const testPattern = /(describe\(|\bit\(|\btest\(|TestBed\.)/;
      let bestBlock: string | null = null;
      let match: RegExpExecArray | null;
      while ((match = fencedRegex.exec(content)) !== null) {
        const block = (match[1] || '').trim();
        if (!block) continue;
        const looksLikeTest = testPattern.test(block);
        if (!bestBlock) {
          bestBlock = block;
        } else {
          const currentScore = (bestBlock.match(/\n/g) || []).length + (testPattern.test(bestBlock) ? 50 : 0);
          const newScore = (block.match(/\n/g) || []).length + (looksLikeTest ? 50 : 0);
          if (newScore > currentScore) bestBlock = block;
        }
        // Se encontramos um bloco que claramente parece um teste, podemos continuar procurando, mas ele já é forte candidato
      }
      if (bestBlock) {
        const codeOnly = this.sanitizeForJest(bestBlock.trim());
        return {
          testCode: this.fixUnclosedBlocks(codeOnly),
          explanation: 'Código corrigido retornado diretamente pela IA (bloco selecionado)',
          testCases: [],
          dependencies: [],
          setupInstructions: ''
        };
      }
      const looksLikeCode = /describe\(|import\s+|TestBed\.|expect\(/.test(content);
      if (looksLikeCode) {
        const codeOnly = this.sanitizeForJest(content.trim());
        return {
          testCode: this.fixUnclosedBlocks(codeOnly),
          explanation: 'Código corrigido retornado diretamente pela IA',
          testCases: [],
          dependencies: [],
          setupInstructions: ''
        };
      }

      // Tenta extrair JSON da resposta (pode estar dentro de markdown)
      let jsonContent = content;
      
      // Se a resposta contém ```json, extrai apenas o JSON
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
        
      } else {
        // Se não tem markdown, tenta encontrar o JSON na resposta
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonContent = content.substring(jsonStart, jsonEnd + 1);
          
        }
      }

      logger.debug('ai_fix_response_json_attempt', { length: jsonContent.length, preview: jsonContent.substring(0, 500) });
      writeRaw('ai-fix-response-json', jsonContent, 'json');

      const parsedResponse = JSON.parse(jsonContent);

      if (!parsedResponse.testCode) {
        throw new Error('Resposta não contém testCode');
      }

      // Limpa o testCode removendo escape characters duplicados
      let testCode = this.sanitizeForJest(parsedResponse.testCode || '');
      
      
      if (typeof testCode === 'string') {
        // Remove escapes duplicados que podem ter sido gerados
        testCode = testCode
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\"/g, '"')
          .replace(/\\\\/g, '\\');
        
        
        
        // Corrige blocos não fechados
        testCode = this.fixUnclosedBlocks(testCode);
        
        
      }

      

      return {
        testCode: testCode,
        explanation: parsedResponse.explanation || 'Teste corrigido automaticamente',
        testCases: parsedResponse.testCases || [],
        dependencies: parsedResponse.dependencies || [],
        setupInstructions: parsedResponse.setupInstructions || ''
      };
    } catch (error) {
      logger.error('ai_fix_response_parse_error', { error: error instanceof Error ? error.message : 'unknown' });
      
      // Tenta extrair informações úteis do erro
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Se for erro de JSON, fornece informações mais detalhadas
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          errorMessage += '. A resposta do ChatGPT pode ter contido JSON malformado.';
        }
      }
      
      throw new Error(`Erro ao processar resposta de correção: ${errorMessage}`);
    }
  }

  /**
   * Corrige blocos de código não fechados automaticamente
   */
  private fixUnclosedBlocks(code: string): string {
    let fixedCode = code.trim();
    
    // Verifica se o código termina corretamente (}); ou pelo menos })
    const endsWithSemicolon = fixedCode.endsWith(');');
    const endsWithBrace = fixedCode.endsWith('}');
    
    // Conta chaves abertas e fechadas
    const openBraces = (fixedCode.match(/\{/g) || []).length;
    const closeBraces = (fixedCode.match(/\}/g) || []).length;
    
    // Se o código termina com } mas não com });, verifica se precisa do );
    if (endsWithBrace && !endsWithSemicolon) {
      // Verifica se deve terminar com }); (último } fechando uma função)
      // Procura pelo último describe/describe/it que não foi fechado
      const lastDescribe = fixedCode.lastIndexOf('describe(');
      const lastIt = fixedCode.lastIndexOf('it(');
      const lastBeforeEach = fixedCode.lastIndexOf('beforeEach(');
      
      const lastFunctionCall = Math.max(lastDescribe, lastIt, lastBeforeEach);
      
      if (lastFunctionCall !== -1) {
        // Conta quantos ) existem após o último } para ver se falta o ;
        const afterLastBrace = fixedCode.substring(fixedCode.lastIndexOf('}'));
        const closingParens = (afterLastBrace.match(/\)/g) || []).length;
        
        // Se falta o ); final
        if (closingParens === 0) {
          fixedCode += ');';
          
        }
      }
    }
    
    // Se ainda faltam chaves de fechamento, adiciona
    const finalOpenBraces = (fixedCode.match(/\{/g) || []).length;
    const finalCloseBraces = (fixedCode.match(/\}/g) || []).length;
    
    if (finalOpenBraces > finalCloseBraces) {
      const missingBraces = finalOpenBraces - finalCloseBraces;
      fixedCode += '\n' + '}'.repeat(missingBraces);
      
      
      // Adiciona o ); final se for necessário
      if (!fixedCode.endsWith(');')) {
        fixedCode += ');';
        
      }
    }
    
    return fixedCode;
  }

  /**
   * Testa a conectividade com a API do ChatGPT
   */
  async testConnection(): Promise<boolean> {
    try {
      const testRequest: ChatGPTRequest = {
        messages: [
          { role: 'user', content: 'Responda apenas com "OK" para testar a conexão.' }
        ],
        max_tokens: 10
      };

      await this.callChatGPT(testRequest);
      logger.info('ai_test_connection_ok');
      return true;
    } catch (error) {
      logger.warn('ai_test_connection_fail', { error: error instanceof Error ? error.message : 'unknown' });
      return false;
    }
  }
}
