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

// Código do componente Angular para testar
const angularComponentCode = `import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss'
})
export class CalculatorComponent {
  result = signal<number>(0);

  calculate(): void {
    this.result.set(10 + 10);
  }

  // Função utilitária para testes
  addTenPlusTen(): number {
    return 10 + 10;
  }
}`;

async function testAngularComponent() {
  try {
    console.log('🧪 Testando geração de teste para componente Angular...\n');

    const chatGPTService = new ChatGPTService();

    // Teste de conectividade
    console.log('1. Testando conectividade...');
    const isConnected = await chatGPTService.testConnection();
    console.log(`   Conexão: ${isConnected ? '✅ OK' : '❌ Falhou'}\n`);

    if (!isConnected) {
      console.log('❌ Não foi possível conectar com ChatGPT.');
      return;
    }

    const unitTestRequest: UnitTestRequest = {
      code: angularComponentCode,
      language: 'typescript',
      framework: 'jest',
      testType: 'unit',
      additionalInstructions: 'Gere testes para um componente Angular usando signals. Teste tanto os métodos quanto o signal result. Use TestBed para configurar o componente.'
    };

    console.log('2. Gerando teste unitário para componente Angular...');
    console.log('   Código do componente:');
    console.log('   ```typescript');
    console.log(angularComponentCode);
    console.log('   ```\n');
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

// Executar o teste
testAngularComponent();
