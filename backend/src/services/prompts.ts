export function buildGenerationSystemPrompt(params: { language: string; framework?: string; testType?: string }): string {
  const framework = params.framework || 'padrão';
  const testType = params.testType || 'unit';

  return `Você é um especialista em testes unitários. Sua tarefa é gerar testes unitários de alta qualidade para o código fornecido.

INSTRUÇÕES:
1. Analise o código fornecido cuidadosamente
2. Identifique todas as funções, métodos e casos de teste necessários
3. Gere testes que cubram casos positivos, negativos e edge cases
4. Use o framework de teste apropriado para ${params.language}
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

Linguagem: ${params.language}
Framework: ${framework}
Tipo de teste: ${testType}`;
}

export function buildGenerationUserPrompt(params: { language: string; code: string; filePath?: string; additionalInstructions?: string }): string {
  let prompt = `Por favor, gere testes unitários para o seguinte código:\n\n`;
  prompt += `\`\`\`${params.language}\n${params.code}\n\`\`\`\n\n`;

  if (params.filePath) {
    const componentFilePath = params.filePath;
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

  if (params.additionalInstructions) {
    prompt += `Instruções adicionais: ${params.additionalInstructions}\n\n`;
  }

  prompt += `NÃO FAÇA:\n`;
  prompt += `- NÃO retorne apenas um trecho parcial (por exemplo, somente um import)\n`;
  prompt += `- NÃO inclua textos explicativos, markdown ou JSON\n\n`;

  prompt += `FAÇA:\n`;
  prompt += `- Gere um arquivo .spec.ts COMPLETO contendo: pelo menos um describe(), beforeEach() e múltiplos it() (≥ 2), com TestBed corretamente configurado\n`;
  prompt += `- Utilize matchers do Jest (por exemplo, .toBe(true)/.toBe(false), .toBeNaN()) e evite matchers do Jasmine (.toBeTrue/.toBeFalse)\n`;
  prompt += `- Se o componente for standalone, inclua-o em imports: [Componente] no TestBed.configureTestingModule\n\n`;

  if (/setA\s*\(|setB\s*\(/.test(params.code)) {
    prompt += `ALINHAMENTO COM O CÓDIGO DO COMPONENTE (IMPORTANTE):\n`;
    prompt += `- As funções setA/setB fazem coerção com Number(value). Portanto:\n`;
    prompt += `  - String vazia ('') vira 0; isso é input VÁLIDO e deve alterar o valor para 0.\n`;
    prompt += `  - null vira 0; portanto, setA(null)/setB(null) alteram o valor para 0.\n`;
    prompt += `  - undefined vira NaN; entradas que resultam em NaN DEVEM ser ignoradas (não alteram o valor).\n`;
    prompt += `  - Strings não numéricas (ex: 'abc'), objetos e arrays resultam em NaN e devem ser ignoradas.\n\n`;
  }

  if (/export\s+const\s+appConfig\s*:\s*ApplicationConfig/.test(params.code) || /app\.config\.ts$/.test(params.filePath || '')) {
    prompt += `REGRAS ESPECÍFICAS PARA ApplicationConfig (app.config.ts):\n`;
    prompt += `- NÃO acesse campos privados que comecem com ɵ (ex.: ɵproviders).\n`;
    prompt += `- Use TestBed.configureTestingModule({ providers: appConfig.providers }) para registrar os providers.\n`;
    prompt += `- Para rotas, injete o token ROUTES (via TestBed.inject(ROUTES)) e valide o conteúdo com expectativas brandas (ex.: arrayContaining das rotas importadas).\n`;
    prompt += `  - SEMPRE achate o valor injetado: const flatRoutes = Array.isArray(r) ? (r.flat ? r.flat(Infinity) : ([] as any[]).concat(...r)) : [];\n`;
    prompt += `  - Se 'routes' importado estiver vazio/indefinido, valide apenas que flatRoutes é um array (não use objectContaining(routes[0])).\n`;
    prompt += `- Evite comparar por igualdade objetos retornados por provide*; prefira verificar existência de tokens públicos ou comportamento esperado.\n`;
    prompt += `- Mantenha testes de sanidade (smoke tests): appConfig é objeto; possui providers (array); TestBed inicializa sem erro.\n\n`;
    prompt += `- NÃO crie InjectionToken manual para ZoneChangeDetectionOptions; se o token não estiver disponível no ambiente de teste, use verificação branda (ex.: apenas que o TestBed inicializa sem erro).\n\n`;
  }

  prompt += `RESPOSTA ESPERADA: Somente o CÓDIGO do arquivo .spec.ts completo, sem markdown, sem JSON, sem explicações.`;

  return prompt;
}

export function buildFixSystemPrompt(): string {
  return `Você é um especialista em testes unitários para Angular com Jest e TypeScript. 
Sua tarefa é analisar e corrigir testes unitários que falharam na execução.

IMPORTANTE:
- Analise cuidadosamente o erro de execução fornecido
- Identifique a CAUSA RAIZ do erro (imports faltando, configurações incorretas, etc.)
- CORRIJA o teste para que ele execute com sucesso
- Use as melhores práticas do Jest e Angular Testing
- Certifique-se de que TODOS os imports necessários estão presentes
- Verifique se o TestBed está configurado corretamente
- Se o componente é standalone, certifique-se de incluí-lo no array imports do TestBed
- Adicione TODOS os mocks necessários

NÃO FAÇA:
- NÃO retorne apenas um trecho parcial (por exemplo, somente um import)
- NÃO inclua textos explicativos, markdown ou JSON

FAÇA:
- Retorne um arquivo .spec.ts COMPLETO contendo: pelo menos um describe(), beforeEach() e múltiplos it() (≥ 2), com TestBed corretamente configurado
- Garanta que o código tenha mais de 120 caracteres e compile em Jest
- Utilize matchers do Jest (por exemplo, .toBe(true)/.toBe(false), .toBeNaN()) e evite matchers do Jasmine (.toBeTrue/.toBeFalse)

RESPOSTA:
Responda SOMENTE com o CÓDIGO DO TESTE corrigido, sem markdown, sem JSON, sem explicações. Não envolva em cercas de código.`;
}

export function buildFixUserPrompt(params: {
  componentCode: string;
  testCode: string;
  errorMessage: string;
  componentName: string;
  filePath: string;
}): string {
  const componentFilePath = params.filePath;
  const pathParts = componentFilePath.split(/[\/\\]/);
  const componentFileName = pathParts[pathParts.length - 1];
  const componentBaseName = componentFileName.replace('.ts', '');
  const testFileName = componentBaseName + '.spec.ts';

  return `Por favor, analise e CORRIJA o seguinte teste unitário que falhou na execução:

COMPONENTE ORIGINAL:
\`\`\`typescript
${params.componentCode}
\`\`\`

TESTE ATUAL (COM ERRO):
\`\`\`typescript
${params.testCode}
\`\`\`

ERRO DE EXECUÇÃO:
${params.errorMessage}

INFORMAÇÕES CRÍTICAS PARA IMPORTS:
- Nome do componente: ${params.componentName}
- Arquivo do componente original: ${componentFilePath}
- Nome do arquivo do componente: ${componentFileName}
- Nome base do arquivo: ${componentBaseName}
- Arquivo de teste esperado: ${testFileName}

REGRA DE OURO PARA IMPORTS (ATENÇÃO - SIGA EXATAMENTE):
O import CORRETO do componente deve ser APENAS:

import { ${params.componentName} } from './${componentBaseName}';

❌ NÃO use: './${componentBaseName}.component'
❌ NÃO use: './${params.componentName.toLowerCase()}.component'  
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
9. O resultado DEVE ser um arquivo inteiro .spec.ts, contendo describe(), beforeEach() e múltiplos it() (≥ 2). NÃO retorne apenas um import ou um pequeno trecho
10. **VERIFIQUE que TODOS os blocos de código estão fechados corretamente (chaves, parênteses)**
11. **Garanta que a função describe(), beforeEach() e it() estão TODAS fechadas com })**

ALINHAMENTO COM O CÓDIGO DO COMPONENTE (IMPORTANTE):
- As funções setA/setB fazem coerção com Number(value). Portanto:
  - String vazia ('') vira 0; não trate '' como input inválido (deve alterar o valor para 0).
  - null vira 0; portanto, chamar setA(null)/setB(null) DEVE alterar o valor para 0.
  - undefined vira NaN; entradas que resultam em NaN DEVEM ser ignoradas (não alteram o valor).
  - Strings não numéricas (ex: 'abc'), objetos e arrays resultam em NaN; devem ser ignoradas.
  - Ajuste as EXPECTATIVAS do teste de acordo com esses comportamentos.

REGRAS ESPECÍFICAS PARA ApplicationConfig (app.config.ts):
- NÃO acesse campos privados que comecem com ɵ (ex.: ɵproviders).
- Use TestBed.configureTestingModule({ providers: appConfig.providers }) para registrar os providers.
- Para rotas, injete o token ROUTES (via TestBed.inject(ROUTES)) e valide o conteúdo com expectativas brandas (ex.: arrayContaining das rotas importadas).
   - SEMPRE achate o valor injetado: const flatRoutes = Array.isArray(r) ? (r.flat ? r.flat(Infinity) : ([] as any[]).concat(...r)) : [];
   - Se 'routes' importado estiver vazio/indefinido, valide apenas que flatRoutes é um array (não use objectContaining(routes[0])).
- Evite comparar por igualdade objetos retornados por provide*; prefira verificar existência de tokens públicos ou comportamento esperado.
- Mantenha testes de sanidade (smoke tests): appConfig é objeto; possui providers (array); TestBed inicializa sem erro.
 - NÃO crie InjectionToken manual para ZoneChangeDetectionOptions; se o token não estiver disponível no ambiente de teste, use verificação branda (ex.: apenas que o TestBed inicializa sem erro).

RESPOSTA ESPERADA: Somente o CÓDIGO do arquivo .spec.ts completo, sem markdown, sem JSON, sem explicações.`;
}

export function buildNormalizeSystemPrompt(): string {
  return `Você é um normalizador estrito. Sua única saída DEVE ser um JSON válido exatamente no formato abaixo. Não escreva nada além do JSON.

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
- Nunca use markdown na resposta, nunca use comentários fora do JSON, nunca use aspas simples.`;
}


