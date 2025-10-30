# 🔧 Configuração de Environment via Interface

## Visão Geral

O sistema agora permite configurar todas as variáveis de ambiente através de uma interface web, sem necessidade de editar arquivos `.env` manualmente.

## 📋 Como Funciona

### 1. **Ordem de Prioridade**

O sistema carrega configurações na seguinte ordem:
1. **`config.json`** (se existir) - Gerado pela interface web
2. **`.env`** (fallback) - Arquivo manual tradicional

### 2. **Interface de Configuração**

Acesse através do botão **⚙️ Configurações** no canto superior direito da aplicação.

### 3. **Abas Disponíveis**

#### **Geral**
- **Ambiente**: Development ou Production
- **Porta do Servidor**: Porta onde o backend roda (padrão: 3000)
- **CORS Origin**: Origem permitida para requisições (padrão: http://localhost:4200)
- **Nível de Log**: debug, info, warn, error

#### **Provedor de IA**
- **Provedor**: Escolha entre OpenAI ou StackSpot
- **OpenAI API Key**: Chave da API OpenAI (se usar OpenAI)
- **StackSpot Configurações** (se usar StackSpot):
  - Client ID
  - Client Key
  - Realm (padrão: stackspot-freemium)
  - Token URL
  - Completions URL
  - Agent Chat URL

#### **Avançado**
- **Database URL**: URL de conexão com banco de dados
- **JWT Secret**: Chave secreta para autenticação JWT
- **User Agent**: User-Agent customizado para requisições

## 🚀 Como Usar

### Passo 1: Abrir Configurações
1. Clique no ícone **⚙️ Configurações** no header da aplicação
2. O modal de configuração será aberto

### Passo 2: Editar Valores
1. Navegue pelas abas (Geral, Provedor de IA, Avançado)
2. Preencha os campos necessários
3. Campos com senhas são mascarados automaticamente

### Passo 3: Salvar
1. Clique em **Salvar Configuração**
2. A configuração será salva no arquivo `config.json` na raiz do projeto
3. Uma mensagem de sucesso será exibida

### Passo 4: Configuração Aplicada
✨ **AUTOMÁTICO**: As configurações são **aplicadas imediatamente** após salvar. Não é necessário reiniciar o servidor!

O sistema automaticamente:
- Salva as configurações no `config.json`
- Recarrega a configuração em memória
- Aplica as mudanças instantaneamente

> ℹ️ Apenas mudanças na porta do servidor ou configurações de inicialização do Node.js exigiriam reinício manual.

## 📝 Exemplo de config.json

Após salvar, será gerado um arquivo `config.json` como este:

```json
{
  "NODE_ENV": "development",
  "PORT": 3000,
  "CORS_ORIGIN": "http://localhost:4200",
  "LOG_LEVEL": "info",
  "OPENAI_API_KEY": "sua-chave-aqui",
  "AI_PROVIDER": "openai",
  "STACKSPOT_CLIENT_ID": "",
  "STACKSPOT_CLIENT_KEY": "",
  "STACKSPOT_REALM": "stackspot-freemium",
  "STACKSPOT_TOKEN_URL": "",
  "STACKSPOT_COMPLETIONS_URL": "",
  "STACKSPOT_AGENT_CHAT_URL": "",
  "DATABASE_URL": "",
  "JWT_SECRET": "",
  "STACKSPOT_USER_AGENT": "DelsucTest/1.0 (+backend)"
}
```

## 🔒 Segurança

- ✅ O arquivo `config.json` está no `.gitignore` e **não é commitado** no repositório
- ✅ Campos de senha são mascarados na interface
- ✅ Valores sensíveis não são expostos em logs
- ⚠️ Mantenha sempre suas credenciais em segredo

## 🔄 Fallback para .env

Se `config.json` não existir, o sistema automaticamente usa os valores do arquivo `.env`:

- **Primeira vez**: Carrega valores padrão do `.env`
- **Interface**: Mostra esses valores pré-preenchidos
- **Ao salvar**: Cria o `config.json` com os valores editados

## ⚡ Recarga Automática

O sistema usa um sistema de **cache inteligente**:

- **Cache**: A configuração é carregada uma vez e fica em memória (mais rápido)
- **Recarga**: Após salvar, o cache é limpo e a nova configuração é carregada
- **Instantâneo**: Mudanças são aplicadas imediatamente sem reinício
- **Performance**: Leitura de arquivo apenas quando necessário

```typescript
// Exemplo de como funciona internamente
getConfig()     // Retorna config em cache (rápido)
saveConfig()    // Salva no arquivo
reloadConfig()  // Limpa cache e recarrega (automático após salvar)
```

## 🐛 Troubleshooting

### A configuração não está sendo aplicada
1. Verifique se salvou corretamente (mensagem de sucesso apareceu)
2. Verifique o console do navegador para erros
3. Se ainda não funcionar, reinicie o servidor manualmente (caso raro)

### Erro ao carregar configuração
1. Verifique se o servidor backend está rodando
2. Verifique se há erros no console do backend
3. Verifique se o arquivo `config.json` tem formato JSON válido

### Campos não aparecem
1. Limpe o cache do navegador
2. Recarregue a página (Ctrl+F5)
3. Verifique o console do navegador para erros

## 📚 API Endpoints

### GET /api/config
Retorna a configuração atual (de `config.json` ou `.env`)

**Response:**
```json
{
  "success": true,
  "config": { ... },
  "source": "config.json" // ou "env"
}
```

### POST /api/config
Salva nova configuração no `config.json`

**Body:**
```json
{
  "NODE_ENV": "development",
  "PORT": 3000,
  ...
}
```

### POST /api/config/apply
Recarrega a configuração em memória (aplica automaticamente)

## ✨ Recursos

- ✅ Interface intuitiva com abas organizadas
- ✅ Valores pré-preenchidos do `.env`
- ✅ Validação de campos
- ✅ Mensagens de feedback claras
- ✅ Mascaramento de senhas
- ✅ Suporte a OpenAI e StackSpot
- ✅ Fallback automático para `.env`
- ✅ Configuração persistente em `config.json`

## 🎯 Próximos Passos

- [ ] Validação mais robusta de URLs
- [ ] Teste de conexão com APIs antes de salvar
- [ ] Exportar/Importar configurações
- [ ] Histórico de configurações
- [ ] Preview de mudanças antes de aplicar

