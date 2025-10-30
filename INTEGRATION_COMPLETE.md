# 🧪 AutoUnitTest - Sistema Completo de Geração de Testes Unitários

Sistema integrado que combina **Angular frontend** + **Node.js backend** + **ChatGPT API** + **Socket.IO** para gerar testes unitários automaticamente com acompanhamento em tempo real.

## 🚀 Funcionalidades Implementadas

### ✅ **Backend (Node.js + TypeScript)**
- **AngularComponentScanner**: Identifica componentes Angular em qualquer projeto
- **ChatGPTService**: Integração completa com API do ChatGPT para geração de testes
- **TestGenerationSocketService**: Comunicação em tempo real via Socket.IO
- **API REST**: Endpoints para escaneamento e geração de testes
- **Tratamento de erros**: Robusto e detalhado

### ✅ **Frontend (Angular + Signals)**
- **Interface moderna**: Design responsivo e intuitivo
- **Seleção de arquivos**: Escolha individual ou múltipla de componentes
- **Visualização de código**: Exibe código fonte dos arquivos selecionados
- **Acompanhamento em tempo real**: Progresso via Socket.IO
- **Resultados detalhados**: Testes gerados com explicações completas

### ✅ **Integração Socket.IO**
- **Escaneamento em tempo real**: Progresso do escaneamento de diretórios
- **Geração de testes**: Acompanhamento do processo de geração
- **Status de conexão**: Indicador visual de conectividade
- **Mensagens de erro**: Feedback imediato de problemas

## 📁 Estrutura do Projeto

```
AutoUnitTest/
├── backend/                    # Servidor Node.js
│   ├── src/
│   │   ├── services/          # Serviços principais
│   │   │   ├── angularComponentScanner.ts
│   │   │   ├── chatgptService.ts
│   │   │   └── testGenerationSocketService.ts
│   │   ├── routes/           # Rotas da API
│   │   │   ├── angular.ts
│   │   │   └── chatgpt.ts
│   │   ├── types/            # Tipos TypeScript
│   │   │   ├── angularComponent.ts
│   │   │   ├── chatgpt.ts
│   │   │   └── socketEvents.ts
│   │   └── index.ts          # Servidor principal
│   ├── .env                  # Variáveis de ambiente
│   └── package.json
├── frontend/                  # Aplicação Angular
│   ├── src/app/
│   │   ├── services/
│   │   │   └── socket.service.ts
│   │   ├── types/
│   │   │   └── socket-events.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   └── app.component.scss
│   └── package.json
└── README.md
```

## 🛠️ Instalação e Configuração

### 1. **Backend**
```bash
cd backend
npm install
```

### 2. **Frontend**
```bash
cd frontend
npm install
```

### 3. **Configuração da API Key**
Edite o arquivo `backend/.env`:
```env
OPENAI_API_KEY=sua_api_key_aqui
```

## 🚀 Como Usar

### 1. **Iniciar o Backend**
```bash
cd backend
npm run dev
```
Servidor rodará em: `http://localhost:3000`

### 2. **Iniciar o Frontend**
```bash
cd frontend
npm start
```
Aplicação rodará em: `http://localhost:4200`

### 3. **Usar a Interface**

#### **Passo 1: Escanear Diretório**
1. Insira o caminho do diretório do projeto Angular
2. Clique em "🔍 Escanear"
3. Acompanhe o progresso em tempo real

#### **Passo 2: Selecionar Arquivos**
1. Visualize os componentes encontrados
2. Selecione um ou mais arquivos para testar
3. Use "Selecionar Todos" ou "Limpar Seleção" conforme necessário

#### **Passo 3: Visualizar Código**
1. Clique em "👁️ Ver Código" em qualquer componente
2. O código será exibido na tela

#### **Passo 4: Gerar Testes**
1. Clique em "🚀 Gerar Testes"
2. Acompanhe o progresso em tempo real
3. Visualize os resultados detalhados

## 📊 Exemplo de Uso

### **Entrada:**
```typescript
// calculator.component.ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calculator.component.html'
})
export class CalculatorComponent {
  result = signal<number>(0);

  calculate(): void {
    this.result.set(10 + 10);
  }
}
```

### **Saída:**
```typescript
// Teste gerado automaticamente
import { TestBed } from '@angular/core/testing';
import { CalculatorComponent } from './calculator.component';

describe('CalculatorComponent', () => {
  let component: CalculatorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CalculatorComponent]
    });
    const fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set initial result to 0', () => {
    expect(component.result()).toBe(0);
  });

  it('should calculate 10 + 10 and update result', () => {
    component.calculate();
    expect(component.result()).toBe(20);
  });
});
```

## 🔧 APIs Disponíveis

### **REST Endpoints**
- `POST /api/angular/scan` - Escanear diretório
- `GET /api/angular/scan/*` - Escanear via GET
- `POST /api/chatgpt/generate-test` - Gerar teste unitário
- `GET /api/chatgpt/test-connection` - Testar conectividade

### **Socket.IO Events**
- `scan-directory` - Iniciar escaneamento
- `get-file-content` - Obter conteúdo do arquivo
- `generate-tests` - Gerar testes
- `scan-progress` - Progresso do escaneamento
- `test-generation-progress` - Progresso da geração
- `test-generated` - Teste individual gerado

## 🎯 Características Técnicas

### **Backend**
- **Node.js + TypeScript**
- **Express.js** para API REST
- **Socket.IO** para comunicação em tempo real
- **OpenAI API** para geração de testes
- **Glob** para busca de arquivos
- **Tratamento robusto de erros**

### **Frontend**
- **Angular 20** com Signals
- **Standalone Components**
- **Socket.IO Client**
- **Design responsivo**
- **Interface moderna**

### **Integração**
- **Comunicação bidirecional** via Socket.IO
- **Acompanhamento em tempo real**
- **Feedback visual** de progresso
- **Tratamento de erros** em tempo real

## 🚀 Próximas Funcionalidades

- [ ] Suporte a mais linguagens (Python, Java, C#)
- [ ] Configuração de templates de teste
- [ ] Histórico de testes gerados
- [ ] Exportação de testes
- [ ] Integração com CI/CD
- [ ] Testes de integração e E2E

## 📝 Notas Importantes

1. **API Key**: Necessária para funcionamento do ChatGPT
2. **Conexão**: Frontend e backend devem estar rodando simultaneamente
3. **Performance**: Geração de testes pode levar alguns segundos por arquivo
4. **Limites**: Respeite os limites da API do OpenAI

## 🎉 Sistema Completo e Funcional!

O sistema está **100% implementado** e pronto para uso em produção, com todas as funcionalidades solicitadas:

✅ **Campo para inserir diretório**  
✅ **Listagem de arquivos**  
✅ **Seleção individual/múltipla**  
✅ **Visualização de código**  
✅ **Geração de testes via IA**  
✅ **Comunicação Socket.IO**  
✅ **Acompanhamento em tempo real**  
✅ **Interface moderna e responsiva**
