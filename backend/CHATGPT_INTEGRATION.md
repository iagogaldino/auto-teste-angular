# Integração ChatGPT para Geração de Testes Unitários

Este módulo fornece uma integração completa com a API do ChatGPT para gerar testes unitários automaticamente.

## 📁 Arquivos Criados

- `src/services/chatgptService.ts` - Classe principal de integração
- `src/routes/chatgpt.ts` - Rotas da API para integração
- `src/types/chatgpt.ts` - Tipos TypeScript para a integração
- `test-chatgpt.ts` - Arquivo de exemplo para testes

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` (ou use `env.example` como base) contendo:

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

### 3. Testar a Integração

Execute o arquivo de teste:

```bash
npx ts-node test-chatgpt.ts
```

### 4. Usar via API

#### Testar Conectividade
```bash
GET http://localhost:3000/api/chatgpt/test-connection
```

#### Gerar Teste Unitário
```bash
POST http://localhost:3000/api/chatgpt/generate-test
Content-Type: application/json

{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript",
  "framework": "jest",
  "testType": "unit",
  "additionalInstructions": "Inclua testes para casos de erro"
}
```

## 🔧 Uso Programático

```typescript
import { ChatGPTService } from './src/services/chatgptService';
import { UnitTestRequest } from './src/types/chatgpt';

const chatGPTService = new ChatGPTService();

const request: UnitTestRequest = {
  code: 'seu código aqui',
  language: 'typescript',
  framework: 'jest',
  testType: 'unit'
};

const result = await chatGPTService.generateUnitTest(request);
console.log(result.testCode);
```

## 📋 Funcionalidades

- ✅ Geração automática de testes unitários
- ✅ Suporte a múltiplas linguagens (JavaScript, TypeScript, Python, etc.)
- ✅ Suporte a diferentes frameworks de teste
- ✅ Teste de conectividade com a API
- ✅ Tratamento de erros robusto
- ✅ Validação de entrada
- ✅ Logs detalhados

## 🛠️ Configurações

A classe `ChatGPTService` usa as seguintes configurações padrão:

- **Modelo**: `gpt-3.5-turbo`
- **Temperatura**: `0.7`
- **Max Tokens**: `2000`

Essas configurações podem ser ajustadas no construtor da classe.

## 🔍 Exemplo de Resposta

```json
{
  "success": true,
  "data": {
    "testCode": "describe('calculateSum', () => { ... })",
    "explanation": "Testes gerados para cobrir casos positivos e negativos...",
    "testCases": ["caso positivo", "caso negativo", "edge case"],
    "dependencies": ["jest", "@types/jest"],
    "setupInstructions": "npm install --save-dev jest @types/jest"
  },
  "message": "Teste unitário gerado com sucesso",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## ⚠️ Observações

- A API key está configurada e pronta para uso
- O serviço inclui tratamento de erros completo
- Os testes são gerados seguindo boas práticas
- A integração é totalmente funcional e testada
