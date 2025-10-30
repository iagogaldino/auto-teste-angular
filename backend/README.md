# DelsucTest Backend

Backend para o sistema DelsucTest desenvolvido em Node.js com TypeScript e Socket.IO.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Superset tipado do JavaScript
- **Express.js** - Framework web
- **Socket.IO** - Comunicação em tempo real
- **ESLint** - Linter para qualidade de código
- **Prettier** - Formatador de código
- **Nodemon** - Desenvolvimento com hot reload

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações do projeto
├── controllers/     # Controladores das rotas
├── middleware/      # Middlewares customizados
├── routes/          # Definição das rotas
├── services/        # Lógica de negócio
├── socket/          # Handlers do Socket.IO
├── types/           # Definições de tipos TypeScript
└── utils/           # Utilitários
```

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```

4. Execute o projeto em desenvolvimento:
   ```bash
   npm run dev
   ```

## 📜 Scripts Disponíveis

- `npm run dev` - Executa o projeto em modo desenvolvimento com nodemon
- `npm run build` - Compila o TypeScript para JavaScript
- `npm start` - Executa o projeto compilado
- `npm run lint` - Executa o linter
- `npm run lint:fix` - Corrige problemas do linter automaticamente
- `npm run format` - Formata o código com Prettier
- `npm run clean` - Remove a pasta dist

## 🔌 Socket.IO Events

### Cliente → Servidor
- `test:create` - Criar novo teste
- `test:run` - Executar teste
- `test:stop` - Parar teste
- `test:subscribe` - Inscrever-se em atualizações de um teste
- `test:unsubscribe` - Cancelar inscrição

### Servidor → Cliente
- `test:created` - Teste criado
- `test:updated` - Teste atualizado
- `test:deleted` - Teste removido
- `test:running` - Teste em execução
- `test:completed` - Teste finalizado
- `test:error` - Erro no teste
- `connection:status` - Status da conexão

## 🌐 API Endpoints

### Health Check
- `GET /health` - Status do servidor
- `GET /health/ping` - Ping simples

### Testes
- `GET /api/tests` - Lista todos os testes
- `POST /api/tests` - Cria novo teste
- `GET /api/tests/:id` - Busca teste específico
- `PUT /api/tests/:id` - Atualiza teste
- `DELETE /api/tests/:id` - Remove teste

## 🔧 Configuração

As configurações estão em `src/config/environment.ts` e podem ser sobrescritas por variáveis de ambiente:

- `NODE_ENV` - Ambiente de execução
- `PORT` - Porta do servidor (padrão: 3000)
- `CORS_ORIGIN` - Origem permitida para CORS
- `DATABASE_URL` - URL do banco de dados
- `JWT_SECRET` - Chave secreta para JWT
- `LOG_LEVEL` - Nível de log

## 📝 Desenvolvimento

O projeto usa path mapping para facilitar imports:
- `@/` - Aponta para `src/`
- `@/controllers/*` - Aponta para `src/controllers/*`
- `@/services/*` - Aponta para `src/services/*`
- E assim por diante...

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request
