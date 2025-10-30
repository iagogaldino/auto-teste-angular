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

// Componente Angular mais complexo para testar
const complexAngularComponent = `import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-manager.component.html',
  styleUrl: './user-manager.component.scss'
})
export class UserManagerComponent {
  users = signal<User[]>([
    { id: 1, name: 'João Silva', email: 'joao@email.com', active: true },
    { id: 2, name: 'Maria Santos', email: 'maria@email.com', active: false }
  ]);

  newUserName = signal<string>('');
  newUserEmail = signal<string>('');

  // Computed signal para usuários ativos
  activeUsers = computed(() => 
    this.users().filter(user => user.active)
  );

  // Computed signal para contagem de usuários
  totalUsers = computed(() => this.users().length);

  addUser(): void {
    if (this.newUserName() && this.newUserEmail()) {
      const newUser: User = {
        id: this.getNextId(),
        name: this.newUserName(),
        email: this.newUserEmail(),
        active: true
      };
      
      this.users.update(currentUsers => [...currentUsers, newUser]);
      this.clearForm();
    }
  }

  removeUser(userId: number): void {
    this.users.update(currentUsers => 
      currentUsers.filter(user => user.id !== userId)
    );
  }

  toggleUserStatus(userId: number): void {
    this.users.update(currentUsers =>
      currentUsers.map(user =>
        user.id === userId ? { ...user, active: !user.active } : user
      )
    );
  }

  private getNextId(): number {
    const maxId = Math.max(...this.users().map(user => user.id));
    return maxId + 1;
  }

  private clearForm(): void {
    this.newUserName.set('');
    this.newUserEmail.set('');
  }

  // Método utilitário para validação de email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}`;

async function testComplexAngularComponent() {
  try {
    console.log('🧪 Testando geração de teste para componente Angular complexo...\n');

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
      code: complexAngularComponent,
      language: 'typescript',
      framework: 'jest',
      testType: 'unit',
      additionalInstructions: 'Este é um componente Angular complexo com signals, computed signals, arrays e métodos. Gere testes abrangentes que cubram todos os métodos, signals e computed signals. Teste casos positivos e negativos.'
    };

    console.log('2. Gerando teste unitário para componente Angular complexo...');
    console.log('   Componente: UserManagerComponent');
    console.log('   Funcionalidades: signals, computed signals, CRUD de usuários');
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
testComplexAngularComponent();
