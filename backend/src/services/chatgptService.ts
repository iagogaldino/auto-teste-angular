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

export class ChatGPTService {
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly provider: 'openai' | 'stackspot';
  private aiProvider: AIProvider;

  constructor() {
    this.provider = env.AI_PROVIDER;
    const apiKey = process.env.OPENAI_API_KEY;

    this.model = 'gpt-3.5-turbo';
    this.temperature = 0.7;
    this.maxTokens = 2000;

    console.log(`[AI] Provider selecionado: ${this.provider}`);
    if (this.provider === 'stackspot') {
      console.log(`[AI] STACKSPOT_COMPLETIONS_URL: ${env.STACKSPOT_COMPLETIONS_URL || '(não definido)'}`);
      console.log(`[AI] STACKSPOT_TOKEN_URL: ${env.STACKSPOT_TOKEN_URL || `(montado via realm: https://idm.stackspot.com/${env.STACKSPOT_REALM || 'stackspot-freemium'}/oidc/oauth/token)`}`);
      this.aiProvider = new StackspotProvider();
    } else {
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY não encontrada nas variáveis de ambiente');
      }
      this.aiProvider = new OpenAIProvider(apiKey);
    }
  }

  /**
   * Gera um teste unitário para o código fornecido
   */
  async generateUnitTest(request: UnitTestRequest): Promise<UnitTestResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(request);
      const userPrompt = this.buildUserPrompt(request);

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

      const response = await this.callChatGPT(chatRequest);
      
      return this.parseUnitTestResponse(response);
    } catch (error) {
      console.error('Erro ao gerar teste unitário:', error);
      throw new Error(`Falha na geração do teste unitário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Faz a chamada para a API do ChatGPT
   */
  private async callChatGPT(request: ChatGPTRequest): Promise<ChatGPTResponse> {
    try {
      return await this.aiProvider.callChat(request);
    } catch (error: any) {
      console.error('Erro na chamada de IA:', error);
      if (error?.response?.data) {
        const chatGPTError: ChatGPTError = error.response.data;
        throw new Error(`Erro da API: ${chatGPTError.error.message}`);
      }
      throw error;
    }
  }

  // Stackspot/OpenAI specifics handled by providers now

  /**
   * Constrói o prompt do sistema para geração de testes unitários
   */
  private buildSystemPrompt(request: UnitTestRequest): string {
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

FORMATO DE RESPOSTA:
Você DEVE responder APENAS com um JSON válido e bem formado. NÃO inclua markdown, texto adicional ou comentários fora do JSON.

IMPORTANTE SOBRE JSON:
- NÃO use quebras de linha dentro de strings JSON, use \\n quando necessário
- NÃO use aspas simples, use apenas aspas duplas
- Escape caracteres especiais: " → \\", \n → \\n, \t → \\t
- O campo testCode deve conter todo o código do teste como uma única string com \\n para quebras de linha

Formato EXATO:
{
  "testCode": "código do teste completo com \\n para quebras de linha",
  "explanation": "explicação detalhada dos testes gerados",
  "testCases": ["caso 1", "caso 2"],
  "dependencies": ["dependency1", "dependency2"],
  "setupInstructions": "instruções se necessário"
}

Linguagem: ${request.language}
Framework: ${framework}
Tipo de teste: ${testType}`;
  }

  /**
   * Constrói o prompt do usuário com o código a ser testado
   */
  private buildUserPrompt(request: UnitTestRequest): string {
    let prompt = `Por favor, gere testes unitários para o seguinte código:\n\n`;
    prompt += `\`\`\`${request.language}\n${request.code}\n\`\`\`\n\n`;
    
    // Adiciona informações sobre o arquivo para imports corretos
    if (request.filePath) {
      const componentFilePath = request.filePath;
      const pathParts = componentFilePath.split(/[\/\\]/);
      const componentFileName = pathParts[pathParts.length - 1]; // Ex: delsuc.ts
      const componentBaseName = componentFileName.replace('.ts', ''); // Ex: delsuc
      
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
    
    prompt += `Por favor, responda APENAS com o JSON conforme especificado nas instruções do sistema.`;
    
    return prompt;
  }

  /**
   * Faz o parse da resposta do ChatGPT para UnitTestResponse
   */
  private parseUnitTestResponse(response: ChatGPTResponse): UnitTestResponse {
    try {
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Resposta vazia do ChatGPT');
      }

      // Salva o conteúdo original para debug
      const originalContent = content;
      console.log('📥 Conteúdo original da resposta:', originalContent.substring(0, 500));

      // Tenta extrair JSON da resposta (pode estar dentro de markdown)
      let jsonContent = content;
      
      // Se a resposta contém ```json, extrai apenas o JSON
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
        console.log('✅ JSON extraído de markdown');
      } else {
        // Se não tem markdown, tenta encontrar o JSON na resposta
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonContent = content.substring(jsonStart, jsonEnd + 1);
          console.log('✅ JSON extraído diretamente da resposta');
        }
      }

      console.log('📄 JSON para parse:', jsonContent.substring(0, 200));

      // Tenta fazer o parse do JSON
      const parsedResponse = JSON.parse(jsonContent);

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
      }

      // Valida se tem os campos obrigatórios
      if (!normalizedResponse.testCode || !normalizedResponse.explanation) {
        throw new Error('Resposta do ChatGPT não contém os campos obrigatórios');
      }

      // Limpa o testCode removendo escape characters duplicados
      let testCode = normalizedResponse.testCode;
      if (typeof testCode === 'string') {
        // Remove escapes duplicados que podem ter sido gerados
        testCode = testCode
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        
        // Corrige blocos não fechados
        testCode = this.fixUnclosedBlocks(testCode);
      }

      console.log('✅ Parse bem-sucedido');

      return {
        testCode: testCode,
        explanation: normalizedResponse.explanation,
        testCases: normalizedResponse.testCases || [],
        dependencies: normalizedResponse.dependencies || [],
        setupInstructions: normalizedResponse.setupInstructions || ''
      };
    } catch (error) {
      console.error('❌ Erro ao fazer parse da resposta:', error);
      console.error('📄 Conteúdo completo da resposta:', response.choices[0]?.message?.content);
      
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
      const systemPrompt = this.buildFixErrorSystemPrompt();
      const userPrompt = this.buildFixErrorUserPrompt(request);

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

      const response = await this.callChatGPT(chatRequest);
      return this.parseFixErrorResponse(response);
    } catch (error) {
      console.error('Erro ao corrigir teste unitário:', error);
      throw new Error(`Erro ao corrigir teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Constrói o prompt do sistema para correção/melhoria de testes
   */
  private buildFixErrorSystemPrompt(): string {
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

FORMATO DE RESPOSTA:
Você DEVE responder APENAS com um JSON válido e bem formado. NÃO inclua markdown, texto adicional ou comentários fora do JSON.

IMPORTANTE SOBRE JSON:
- NÃO use quebras de linha dentro de strings JSON, use \\n quando necessário
- NÃO use aspas simples, use apenas aspas duplas
- Escape caracteres especiais: " → \\", \n → \\n, \t → \\t
- O campo testCode deve conter todo o código do teste como uma única string com \\n para quebras de linha

Formato EXATO:
{
  "testCode": "código do teste melhorado com \\n para quebras de linha",
  "explanation": "explicação detalhada das melhorias realizadas",
  "testCases": ["caso 1", "caso 2"],
  "dependencies": ["dependency1", "dependency2"],
  "setupInstructions": "instruções se necessário"
}`;
  }

  /**
   * Constrói o prompt do usuário para correção/melhoria de testes
   */
  private buildFixErrorUserPrompt(request: {
    componentCode: string;
    testCode: string;
    errorMessage: string;
    componentName: string;
    filePath: string;
  }): string {
    // Extrai informações do caminho do componente
    const componentFilePath = request.filePath;
    const pathParts = componentFilePath.split(/[\/\\]/);
    const componentFileName = pathParts[pathParts.length - 1]; // Ex: delsuc.ts
    
    // Remove a extensão .ts para obter o nome base
    const componentBaseName = componentFileName.replace('.ts', ''); // Ex: delsuc
    
    // O arquivo de teste tem a extensão .spec.ts
    const testFileName = componentBaseName + '.spec.ts'; // Ex: delsuc.spec.ts
    
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
10. **Garanta que a função describe(), beforeEach() e it() estão TODAS fechadas com })`
  }

  /**
   * Faz parse da resposta de correção de erro
   */
  private parseFixErrorResponse(response: any): UnitTestResponse {
    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Resposta vazia do ChatGPT');
      }

      console.log('📥 Conteúdo original (fix):', content.substring(0, 500));

      // Tenta extrair JSON da resposta (pode estar dentro de markdown)
      let jsonContent = content;
      
      // Se a resposta contém ```json, extrai apenas o JSON
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
        console.log('✅ JSON extraído de markdown (fix)');
      } else {
        // Se não tem markdown, tenta encontrar o JSON na resposta
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonContent = content.substring(jsonStart, jsonEnd + 1);
          console.log('✅ JSON extraído diretamente da resposta (fix)');
        }
      }

      console.log('📄 JSON para parse (fix):', jsonContent.substring(0, 200));

      const parsedResponse = JSON.parse(jsonContent);

      if (!parsedResponse.testCode) {
        throw new Error('Resposta não contém testCode');
      }

      // Limpa o testCode removendo escape characters duplicados
      let testCode = parsedResponse.testCode;
      console.log('📝 [DEBUG] TestCode antes do processamento (preview):', testCode.substring(0, 300));
      
      if (typeof testCode === 'string') {
        // Remove escapes duplicados que podem ter sido gerados
        testCode = testCode
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        
        console.log('📝 [DEBUG] TestCode após limpeza de escapes (preview):', testCode.substring(0, 300));
        
        // Corrige blocos não fechados
        testCode = this.fixUnclosedBlocks(testCode);
        
        console.log('📝 [DEBUG] TestCode após fixUnclosedBlocks (preview):', testCode.substring(0, 300));
        console.log('📝 [DEBUG] TestCode final (últimos 100 caracteres):', testCode.substring(testCode.length - 100));
      }

      console.log('✅ Parse bem-sucedido (fix)');

      return {
        testCode: testCode,
        explanation: parsedResponse.explanation || 'Teste corrigido automaticamente',
        testCases: parsedResponse.testCases || [],
        dependencies: parsedResponse.dependencies || [],
        setupInstructions: parsedResponse.setupInstructions || ''
      };
    } catch (error) {
      console.error('❌ Erro ao fazer parse da resposta de correção:', error);
      console.error('📄 Conteúdo da resposta:', response.choices[0]?.message?.content);
      
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
          console.log('🔧 [FIX] Adicionado ); final');
        }
      }
    }
    
    // Se ainda faltam chaves de fechamento, adiciona
    const finalOpenBraces = (fixedCode.match(/\{/g) || []).length;
    const finalCloseBraces = (fixedCode.match(/\}/g) || []).length;
    
    if (finalOpenBraces > finalCloseBraces) {
      const missingBraces = finalOpenBraces - finalCloseBraces;
      fixedCode += '\n' + '}'.repeat(missingBraces);
      console.log(`🔧 [FIX] Adicionadas ${missingBraces} chaves de fechamento`);
      
      // Adiciona o ); final se for necessário
      if (!fixedCode.endsWith(');')) {
        fixedCode += ');';
        console.log('🔧 [FIX] Adicionado ); final após correção de chaves');
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
      return true;
    } catch (error) {
      console.error('Teste de conexão falhou:', error);
      return false;
    }
  }
}
