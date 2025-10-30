import dotenv from 'dotenv';
import { ChatGPTService } from './src/services/chatgptService';
import { UnitTestRequest } from './src/types/chatgpt';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

// Exigir a variável de ambiente OPENAI_API_KEY (não hardcodear chaves)
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY não definida. Configure no arquivo .env');
  process.exit(1);
}


// Exemplo de uso da classe ChatGPTService
async function testChatGPTIntegration() {
  try {
    console.log('🧪 Testando integração com ChatGPT...\n');

    const chatGPTService = new ChatGPTService();

    // Teste de conectividade
    console.log('1. Testando conectividade...');
    const isConnected = await chatGPTService.testConnection();
    console.log(`   Conexão: ${isConnected ? '✅ OK' : '❌ Falhou'}\n`);

    if (!isConnected) {
      console.log('❌ Não foi possível conectar com ChatGPT. Verifique a API key.');
      return;
    }

    // Exemplo de código para gerar teste
    const sampleCode = `
function calculateSum(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Parâmetros devem ser números');
  }
  return a + b;
}

function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Divisão por zero não é permitida');
  }
  return a / b;
}
`;

    const unitTestRequest: UnitTestRequest = {
      code: sampleCode,
      language: 'typescript',
      framework: 'jest',
      testType: 'unit',
      additionalInstructions: 'Inclua testes para casos de erro e edge cases'
    };

    console.log('2. Gerando teste unitário...');
    console.log('   Código de exemplo:', sampleCode.trim());
    console.log('   Aguardando resposta do ChatGPT...\n');

    const result = await chatGPTService.generateUnitTest(unitTestRequest);

    console.log('✅ Teste unitário gerado com sucesso!\n');
    console.log('📝 Explicação:', result.explanation);
    console.log('\n🧪 Casos de teste:', result.testCases);
    console.log('\n📦 Dependências:', result.dependencies);
    
    if (result.setupInstructions) {
      console.log('\n⚙️ Instruções de configuração:', result.setupInstructions);
    }

    console.log('\n📄 Código do teste gerado:');
    console.log('```typescript');
    console.log(result.testCode);
    console.log('```');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste se este arquivo for executado diretamente
if (require.main === module) {
  testChatGPTIntegration();
}

export { testChatGPTIntegration };
