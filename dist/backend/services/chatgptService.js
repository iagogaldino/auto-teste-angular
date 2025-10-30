"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGPTService = void 0;
const environment_1 = require("../config/environment");
const openaiProvider_1 = require("./ai/openaiProvider");
const stackspotProvider_1 = require("./ai/stackspotProvider");
const logger_1 = require("./logger");
class ChatGPTService {
    constructor() {
        this.provider = environment_1.config.AI_PROVIDER;
        const apiKey = process.env.OPENAI_API_KEY;
        this.model = 'gpt-3.5-turbo';
        this.temperature = 0.7;
        this.maxTokens = 2000;
        this.aiProvider = this.provider === 'stackspot' ? new stackspotProvider_1.StackspotProvider() : (() => {
            if (!apiKey) {
                throw new Error('OPENAI_API_KEY não encontrada nas variáveis de ambiente');
            }
            return new openaiProvider_1.OpenAIProvider(apiKey);
        })();
    }
    async generateUnitTest(request) {
        try {
            const t0 = Date.now();
            logger_1.logger.info('ai_generate_start', { provider: this.provider, model: this.model, language: request.language });
            const systemPrompt = this.buildSystemPrompt(request);
            const userPrompt = this.buildUserPrompt(request);
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];
            const chatRequest = {
                messages,
                model: this.model,
                temperature: this.temperature,
                max_tokens: this.maxTokens
            };
            try {
                const payload = JSON.stringify(chatRequest, null, 2);
                logger_1.logger.debug('ai_request_built', { length: payload.length });
                (0, logger_1.writeRaw)('ai-request', payload, 'json');
            }
            catch { }
            const response = await this.callChatGPT(chatRequest);
            const parsed = await this.parseUnitTestResponse(response);
            logger_1.logger.info('ai_generate_done', { ms: Date.now() - t0, hasCode: Boolean(parsed.testCode) });
            return parsed;
        }
        catch (error) {
            logger_1.logger.error('ai_generate_fail', { error: error instanceof Error ? error.message : 'unknown' });
            throw new Error(`Falha na geração do teste unitário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }
    async callChatGPT(request) {
        try {
            const t = Date.now();
            const res = await this.aiProvider.callChat(request);
            logger_1.logger.debug('ai_call_ok', { ms: Date.now() - t });
            return res;
        }
        catch (error) {
            logger_1.logger.error('ai_call_error', {
                error: error?.response?.data?.error?.message || (error instanceof Error ? error.message : 'unknown')
            });
            if (error?.response?.data) {
                const chatGPTError = error.response.data;
                throw new Error(`Erro da API: ${chatGPTError.error.message}`);
            }
            throw error;
        }
    }
    buildSystemPrompt(request) {
        const framework = request.framework || 'padrão';
        const testType = request.testType || 'unit';
        return `Você é um especialista em testes unitários. Sua tarefa é gerar testes unitários de alta qualidade para o código fornecido.

INSTRUÇÕES:
1. Analise o código fornecido cuidadosamente
2. Identifique todas as funções, métodos e casos de teste necessários
3. Gere testes que cubram casos positivos, negativos e edge cases
4. Use o framework de teste apropriado para ${request.language}
5. Inclua comentários explicativos nos testes
6. Certifique-se de que os testes são independentes e podem ser executados isoladamente

INFORMAÇÕES IMPORTANTES SOBRE ANGULAR SIGNALS:
- Para acessar o valor de um signal, use signal() não signal.value
- Signals são funções, então para obter o valor: signal() 
- Para atualizar um signal: signal.set(novoValor)
- Para ler um signal em testes: expect(component.signal()).toBe(valor)

INFORMAÇÕES IMPORTANTES SOBRE COMPONENTES STANDALONE:
- Componentes standalone NÃO podem ser declarados em declarations
- Componentes standalone devem ser IMPORTADOS no array imports
- Para testar componente standalone: TestBed.configureTestingModule({ imports: [ComponentName] })
- NÃO use declarations para componentes standalone
- Para obter instância: TestBed.createComponent(ComponentName) não TestBed.inject()
- REGRA OBRIGATÓRIA: Se o componente é standalone, ele DEVE estar no array imports
- Exemplo correto: 
  TestBed.configureTestingModule({ imports: [CalculatorComponent] });
  const fixture = TestBed.createComponent(CalculatorComponent);
  const component = fixture.componentInstance;
- Exemplo INCORRETO: 
  TestBed.configureTestingModule({ imports: [CommonModule] }); // FALTANDO o componente standalone
  TestBed.configureTestingModule({ declarations: [CalculatorComponent] }); // ERRADO para standalone

RESPOSTA:
Responda SOMENTE com o CÓDIGO DO TESTE, sem markdown, sem JSON, sem explicações. Não envolva em cercas de código.

Linguagem: ${request.language}
Framework: ${framework}
Tipo de teste: ${testType}`;
    }
    buildUserPrompt(request) {
        let prompt = `Por favor, gere testes unitários para o seguinte código:\n\n`;
        prompt += `\`\`\`${request.language}\n${request.code}\n\`\`\`\n\n`;
        if (request.filePath) {
            const componentFilePath = request.filePath;
            const pathParts = componentFilePath.split(/[\/\\]/);
            const componentFileName = pathParts[pathParts.length - 1];
            const componentBaseName = componentFileName.replace('.ts', '');
            prompt += `INFORMAÇÕES CRÍTICAS PARA IMPORTS:\n`;
            prompt += `- Arquivo do componente: ${componentFilePath}\n`;
            prompt += `- Nome do arquivo do componente: ${componentFileName}\n`;
            prompt += `- Nome base do arquivo: ${componentBaseName}\n\n`;
            prompt += `REGRA DE OURO PARA IMPORTS (ATENÇÃO - SIGA EXATAMENTE):\n`;
            prompt += `O import CORRETO do componente deve ser APENAS:\n\n`;
            prompt += `import { ComponentName } from './${componentBaseName}';\n\n`;
            prompt += `❌ NÃO use: './${componentBaseName}.component'\n`;
            prompt += `❌ NÃO adicione '.component' no caminho do import\n`;
            prompt += `✅ USE APENAS: './${componentBaseName}'\n\n`;
            prompt += `EXEMPLO:\n`;
            prompt += `Se o arquivo é ${componentFileName}, o import correto é:\n`;
            prompt += `import { ComponentName } from './${componentBaseName}';\n\n`;
            if (componentBaseName.includes('component')) {
                prompt += `Se o arquivo é ${componentFileName}, o import correto é:\n`;
                prompt += `import { ComponentName } from './${componentBaseName}';\n\n`;
            }
            prompt += `**IMPORTANTE: Use APENAS o nome base do arquivo no import, SEM adicionar '.component'!**\n\n`;
        }
        if (request.additionalInstructions) {
            prompt += `Instruções adicionais: ${request.additionalInstructions}\n\n`;
        }
        prompt += `Responda SOMENTE com o CÓDIGO DO TESTE (sem markdown, sem JSON).`;
        return prompt;
    }
    async parseUnitTestResponse(response) {
        try {
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Resposta vazia do ChatGPT');
            }
            logger_1.logger.debug('ai_response_raw', { length: content.length, preview: content.substring(0, 500) });
            (0, logger_1.writeRaw)('ai-response', content, 'txt');
            const fenced = content.match(/```(typescript|ts|javascript|js)?\s*([\s\S]*?)\s*```/);
            if (fenced && fenced[2]) {
                const codeOnly = fenced[2].trim();
                return {
                    testCode: this.fixUnclosedBlocks(codeOnly),
                    explanation: 'Código retornado diretamente pela IA',
                    testCases: [],
                    dependencies: [],
                    setupInstructions: ''
                };
            }
            const looksLikeCode = /describe\(|import\s+|TestBed\.|expect\(/.test(content);
            if (looksLikeCode) {
                const codeOnly = content.trim();
                return {
                    testCode: this.fixUnclosedBlocks(codeOnly),
                    explanation: 'Código retornado diretamente pela IA',
                    testCases: [],
                    dependencies: [],
                    setupInstructions: ''
                };
            }
            let jsonContent = content;
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonContent = jsonMatch[1].trim();
            }
            else {
                const jsonStart = content.indexOf('{');
                const jsonEnd = content.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                    jsonContent = content.substring(jsonStart, jsonEnd + 1);
                }
            }
            logger_1.logger.debug('ai_response_json_attempt', { length: jsonContent.length, preview: jsonContent.substring(0, 500) });
            (0, logger_1.writeRaw)('ai-response-json', jsonContent, 'json');
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(jsonContent);
            }
            catch (e) {
                logger_1.logger.warn('ai_response_json_invalid', { reason: e instanceof Error ? e.message : 'unknown' });
                const normalized = await this.normalizeAiResponse(content);
                parsedResponse = normalized;
            }
            let normalizedResponse = parsedResponse;
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
            }
            else if (parsedResponse && parsedResponse.code && !parsedResponse.testCode) {
                normalizedResponse = {
                    ...parsedResponse,
                    testCode: parsedResponse.code,
                    explanation: parsedResponse.explanation || 'Gerado via Stackspot Agent Chat'
                };
            }
            else if (parsedResponse && parsedResponse.contents && !parsedResponse.testCode) {
                normalizedResponse = {
                    testCode: parsedResponse.contents,
                    explanation: parsedResponse.explanation || 'Conteúdo convertido automaticamente',
                    testCases: parsedResponse.testCases || [],
                    dependencies: parsedResponse.dependencies || [],
                    setupInstructions: parsedResponse.setupInstructions || ''
                };
            }
            else if (parsedResponse && Array.isArray(parsedResponse.tests)) {
                const tests = parsedResponse.tests || [];
                const codes = tests
                    .map((t) => (t && typeof t.code === 'string' ? t.code : ''))
                    .filter((c) => c.length > 0);
                const descriptions = tests
                    .map((t) => (t && typeof t.description === 'string' ? t.description : ''))
                    .filter((d) => d.length > 0);
                const mergedCode = codes.length > 0 ? codes.join('\n\n') : '';
                normalizedResponse = {
                    testCode: mergedCode,
                    explanation: parsedResponse.explanation || 'Normalizado de coleção de testes',
                    testCases: parsedResponse.testCases || descriptions,
                    dependencies: parsedResponse.dependencies || [],
                    setupInstructions: parsedResponse.setupInstructions || ''
                };
            }
            if (!normalizedResponse.testCode || !normalizedResponse.explanation) {
                logger_1.logger.warn('ai_response_missing_fields');
                const normalized = await this.normalizeAiResponse(jsonContent);
                normalizedResponse = normalized;
                if (!normalizedResponse.testCode || !normalizedResponse.explanation) {
                    return {
                        testCode: this.fixUnclosedBlocks(content.trim()),
                        explanation: 'Fallback: resposta tratada como código',
                        testCases: [],
                        dependencies: [],
                        setupInstructions: ''
                    };
                }
            }
            let testCode = normalizedResponse.testCode;
            if (typeof testCode === 'string') {
                testCode = testCode
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\t/g, '\t')
                    .replace(/\\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                testCode = this.fixUnclosedBlocks(testCode);
            }
            return {
                testCode: testCode,
                explanation: normalizedResponse.explanation,
                testCases: normalizedResponse.testCases || [],
                dependencies: normalizedResponse.dependencies || [],
                setupInstructions: normalizedResponse.setupInstructions || ''
            };
        }
        catch (error) {
            logger_1.logger.error('ai_response_parse_error', { error: error instanceof Error ? error.message : 'unknown' });
            let errorMessage = 'Erro desconhecido';
            if (error instanceof Error) {
                errorMessage = error.message;
                if (error instanceof SyntaxError && error.message.includes('JSON')) {
                    errorMessage += '. A resposta do ChatGPT pode ter contido JSON malformado.';
                }
            }
            throw new Error(`Erro ao processar resposta do ChatGPT: ${errorMessage}`);
        }
    }
    async normalizeAiResponse(content) {
        const system = `Você é um normalizador estrito. Sua única saída DEVE ser um JSON válido exatamente no formato abaixo. Não escreva nada além do JSON.

FORMATO EXATO:
{
  "testCode": "código do teste completo com \\n para quebras de linha",
  "explanation": "explicação do que foi gerado",
  "testCases": ["caso 1"],
  "dependencies": ["dep1"],
  "setupInstructions": "instruções se necessário"
}

REGRAS:
- Se o conteúdo já estiver em JSON, corrija quebras/aspas e normalize os campos para o formato acima.
- Se vier texto/markdown com bloco de código (ex.: \`\`\`typescript ...\`\`\`), extraia SOMENTE o código e coloque em testCode como string única com \\n.
- Nunca use markdown na resposta, nunca use comentários fora do JSON, nunca use aspas simples.
`;
        const messages = [
            { role: 'system', content: system },
            { role: 'user', content: `Conteúdo a normalizar:\n\n${content}` }
        ];
        const req = { messages, model: this.model, temperature: 0, max_tokens: this.maxTokens };
        try {
            const payload = JSON.stringify(req, null, 2);
            (0, logger_1.writeRaw)('ai-normalize-request', payload, 'json');
        }
        catch { }
        const res = await this.callChatGPT(req);
        const raw = res.choices[0]?.message?.content || '';
        (0, logger_1.writeRaw)('ai-normalize-response', raw, 'txt');
        let json = raw;
        const jsonFence = raw.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonFence)
            json = jsonFence[1].trim();
        let start = json.indexOf('{');
        let end = json.lastIndexOf('}');
        if (start !== -1 && end > start) {
            const slice = json.substring(start, end + 1);
            try {
                return JSON.parse(slice);
            }
            catch { }
        }
        try {
            return JSON.parse(json);
        }
        catch { }
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
        try {
            const maybe = JSON.parse(raw);
            const candidate = (maybe && (maybe.contents || maybe.content || maybe.code));
            if (candidate) {
                return {
                    testCode: String(candidate),
                    explanation: 'Normalizado de campos alternativos',
                    testCases: maybe.testCases || [],
                    dependencies: maybe.dependencies || [],
                    setupInstructions: maybe.setupInstructions || ''
                };
            }
        }
        catch { }
        return {
            testCode: raw.trim(),
            explanation: 'Normalizado de texto livre',
            testCases: [],
            dependencies: [],
            setupInstructions: ''
        };
    }
    async fixUnitTestError(request) {
        try {
            const t0 = Date.now();
            logger_1.logger.info('ai_fix_start', { component: request.componentName });
            const systemPrompt = this.buildFixErrorSystemPrompt();
            const userPrompt = this.buildFixErrorUserPrompt(request);
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];
            const chatRequest = {
                messages,
                model: this.model,
                temperature: this.temperature,
                max_tokens: this.maxTokens
            };
            try {
                const payload = JSON.stringify(chatRequest, null, 2);
                logger_1.logger.debug('ai_fix_request_built', { length: payload.length });
                (0, logger_1.writeRaw)('ai-fix-request', payload, 'json');
            }
            catch { }
            const response = await this.callChatGPT(chatRequest);
            const parsed = this.parseFixErrorResponse(response);
            logger_1.logger.info('ai_fix_done', { ms: Date.now() - t0, hasCode: Boolean(parsed.testCode) });
            return parsed;
        }
        catch (error) {
            logger_1.logger.error('ai_fix_fail', { error: error instanceof Error ? error.message : 'unknown' });
            throw new Error(`Erro ao corrigir teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }
    buildFixErrorSystemPrompt() {
        return `Você é um especialista em testes unitários para Angular com Jest e TypeScript. 
Sua tarefa é analisar e corrigir testes unitários que falharam na execução.

IMPORTANTE:
- Analise cuidadosamente o erro de execução fornecido
- Identifique a CAUSA RAIZ do erro (imports faltando, configurações incorretas, etc.)
- CORRIJA o teste para que ele execute com sucesso
- Use as melhores práticas do Jest e Angular Testing
- Certifique-se de que TODOS os imports necessários estão presentes
- Verifique se o TestBed está configurado corretamente
- Se o componente é standalone, certifique-se de incluir no array imports do TestBed
- Adicione TODOS os mocks necessários

RESPOSTA:
Responda SOMENTE com o CÓDIGO DO TESTE corrigido, sem markdown, sem JSON, sem explicações. Não envolva em cercas de código.`;
    }
    buildFixErrorUserPrompt(request) {
        const componentFilePath = request.filePath;
        const pathParts = componentFilePath.split(/[\/\\]/);
        const componentFileName = pathParts[pathParts.length - 1];
        const componentBaseName = componentFileName.replace('.ts', '');
        const testFileName = componentBaseName + '.spec.ts';
        return `Por favor, analise e CORRIJA o seguinte teste unitário que falhou na execução:

COMPONENTE ORIGINAL:
\`\`\`typescript
${request.componentCode}
\`\`\`

TESTE ATUAL (COM ERRO):
\`\`\`typescript
${request.testCode}
\`\`\`

ERRO DE EXECUÇÃO:
${request.errorMessage}

INFORMAÇÕES CRÍTICAS PARA IMPORTS:
- Nome do componente: ${request.componentName}
- Arquivo do componente original: ${componentFilePath}
- Nome do arquivo do componente: ${componentFileName}
- Nome base do arquivo: ${componentBaseName}
- Arquivo de teste esperado: ${testFileName}

REGRA DE OURO PARA IMPORTS (ATENÇÃO - SIGA EXATAMENTE):
O import CORRETO do componente deve ser APENAS:

import { ${request.componentName} } from './${componentBaseName}';

❌ NÃO use: './${componentBaseName}.component'
❌ NÃO use: './${request.componentName.toLowerCase()}.component'  
❌ NÃO use: './${componentBaseName}.component'
✅ USE APENAS: './${componentBaseName}'

EXEMPLO:
Se o arquivo é delsuc.ts, o import correto é:
import { Delsuc } from './delsuc';

Se o arquivo é calculator.component.ts, o import correto é:
import { CalculatorComponent } from './calculator.component';

INSTRUÇÕES:
1. Analise o erro de execução fornecido acima
2. Identifique a CAUSA RAIZ do problema
3. CORRIJA o import do componente para usar APENAS o nome base do arquivo
4. Se o erro for "Cannot find module", substitua o import errado pelo import correto mostrado acima
5. Se o erro for relacionado a TestBed, configure corretamente os imports
6. Se o componente é standalone, certifique-se de incluí-lo no array imports do TestBed.configureTestingModule
7. Adicione todos os mocks e providers necessários
8. Gere um teste COMPLETO, EXECUTÁVEL e CORRETO com o import CORRETO
9. **VERIFIQUE que TODOS os blocos de código estão fechados corretamente (chaves, parênteses)**
10. **Garanta que a função describe(), beforeEach() e it() estão TODAS fechadas com })`;
    }
    parseFixErrorResponse(response) {
        try {
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Resposta vazia do ChatGPT');
            }
            logger_1.logger.debug('ai_fix_response_raw', { length: content.length, preview: content.substring(0, 500) });
            (0, logger_1.writeRaw)('ai-fix-response', content, 'txt');
            const fenced = content.match(/```(typescript|ts|javascript|js)?\s*([\s\S]*?)\s*```/);
            if (fenced && fenced[2]) {
                const codeOnly = fenced[2].trim();
                return {
                    testCode: this.fixUnclosedBlocks(codeOnly),
                    explanation: 'Código corrigido retornado diretamente pela IA',
                    testCases: [],
                    dependencies: [],
                    setupInstructions: ''
                };
            }
            const looksLikeCode = /describe\(|import\s+|TestBed\.|expect\(/.test(content);
            if (looksLikeCode) {
                const codeOnly = content.trim();
                return {
                    testCode: this.fixUnclosedBlocks(codeOnly),
                    explanation: 'Código corrigido retornado diretamente pela IA',
                    testCases: [],
                    dependencies: [],
                    setupInstructions: ''
                };
            }
            let jsonContent = content;
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonContent = jsonMatch[1].trim();
            }
            else {
                const jsonStart = content.indexOf('{');
                const jsonEnd = content.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                    jsonContent = content.substring(jsonStart, jsonEnd + 1);
                }
            }
            logger_1.logger.debug('ai_fix_response_json_attempt', { length: jsonContent.length, preview: jsonContent.substring(0, 500) });
            (0, logger_1.writeRaw)('ai-fix-response-json', jsonContent, 'json');
            const parsedResponse = JSON.parse(jsonContent);
            if (!parsedResponse.testCode) {
                throw new Error('Resposta não contém testCode');
            }
            let testCode = parsedResponse.testCode;
            if (typeof testCode === 'string') {
                testCode = testCode
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\t/g, '\t')
                    .replace(/\\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                testCode = this.fixUnclosedBlocks(testCode);
            }
            return {
                testCode: testCode,
                explanation: parsedResponse.explanation || 'Teste corrigido automaticamente',
                testCases: parsedResponse.testCases || [],
                dependencies: parsedResponse.dependencies || [],
                setupInstructions: parsedResponse.setupInstructions || ''
            };
        }
        catch (error) {
            logger_1.logger.error('ai_fix_response_parse_error', { error: error instanceof Error ? error.message : 'unknown' });
            let errorMessage = 'Erro desconhecido';
            if (error instanceof Error) {
                errorMessage = error.message;
                if (error instanceof SyntaxError && error.message.includes('JSON')) {
                    errorMessage += '. A resposta do ChatGPT pode ter contido JSON malformado.';
                }
            }
            throw new Error(`Erro ao processar resposta de correção: ${errorMessage}`);
        }
    }
    fixUnclosedBlocks(code) {
        let fixedCode = code.trim();
        const endsWithSemicolon = fixedCode.endsWith(');');
        const endsWithBrace = fixedCode.endsWith('}');
        const openBraces = (fixedCode.match(/\{/g) || []).length;
        const closeBraces = (fixedCode.match(/\}/g) || []).length;
        if (endsWithBrace && !endsWithSemicolon) {
            const lastDescribe = fixedCode.lastIndexOf('describe(');
            const lastIt = fixedCode.lastIndexOf('it(');
            const lastBeforeEach = fixedCode.lastIndexOf('beforeEach(');
            const lastFunctionCall = Math.max(lastDescribe, lastIt, lastBeforeEach);
            if (lastFunctionCall !== -1) {
                const afterLastBrace = fixedCode.substring(fixedCode.lastIndexOf('}'));
                const closingParens = (afterLastBrace.match(/\)/g) || []).length;
                if (closingParens === 0) {
                    fixedCode += ');';
                }
            }
        }
        const finalOpenBraces = (fixedCode.match(/\{/g) || []).length;
        const finalCloseBraces = (fixedCode.match(/\}/g) || []).length;
        if (finalOpenBraces > finalCloseBraces) {
            const missingBraces = finalOpenBraces - finalCloseBraces;
            fixedCode += '\n' + '}'.repeat(missingBraces);
            if (!fixedCode.endsWith(');')) {
                fixedCode += ');';
            }
        }
        return fixedCode;
    }
    async testConnection() {
        try {
            const testRequest = {
                messages: [
                    { role: 'user', content: 'Responda apenas com "OK" para testar a conexão.' }
                ],
                max_tokens: 10
            };
            await this.callChatGPT(testRequest);
            logger_1.logger.info('ai_test_connection_ok');
            return true;
        }
        catch (error) {
            logger_1.logger.warn('ai_test_connection_fail', { error: error instanceof Error ? error.message : 'unknown' });
            return false;
        }
    }
}
exports.ChatGPTService = ChatGPTService;
//# sourceMappingURL=chatgptService.js.map