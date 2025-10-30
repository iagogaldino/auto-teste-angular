# Auto Unit Test — Angular + Node

Geração automática de testes unitários para projetos Angular, com backend Node/Express e integração com IA.

## Visão geral

Este repositório contém:

- `backend` (Node/Express + TypeScript): APIs para escanear componentes Angular, conversar com o agente de geração e produzir testes (Jest). Inclui sockets para streaming e progresso.
- `frontend` (Angular): UI para acompanhar a geração de testes em tempo real.
- `test-angular`: mini projeto Angular de exemplo usado nos testes do scanner.

> Importante: nenhuma chave secreta é commitada. Configure `.env` (exemplo abaixo).

## Requisitos

- Node.js 18+
- npm 9+
- Angular CLI (opcional)

## Como começar

### 1) Instalação

```bash
# Backend
cd backend
npm install

# Frontend (opcional)
cd ../frontend
npm install
```

### 2) Variáveis de ambiente

Crie `backend/.env` a partir de `backend/env.example`:

```env
# backend/.env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:4200
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
LOG_LEVEL=info
```

### 3) Executar

```bash
# Backend
cd backend
npm run dev

# Frontend (nova aba)
cd frontend
npm start
```

- Backend: http://localhost:3000
- Frontend: http://localhost:4200

## Endpoints úteis

- GET `/api/health`
- POST `/api/chatgpt/generate-test`
- POST `/api/tests/generate` (se aplicável)

Para um guia completo, veja `INTEGRATION_COMPLETE.md`.

## cURL (Postman)

1) Token (StackSpot):

```bash
curl --location --request POST 'https://idm.stackspot.com/stackspot-freemium/oidc/oauth/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --header 'User-Agent: DelsucTest/1.0' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=SEU_CLIENT_ID' \
  --data-urlencode 'client_secret=SEU_CLIENT_KEY'
```

2) Chat (SSE):

```bash
curl --location 'https://genai-inference-app.stackspot.com/v1/agent/01K8SGYPB02EWM9V4CWSEYWAWN/chat' \
  --header 'Content-Type: application/json' \
  --header 'User-Agent: DelsucTest/1.0' \
  --header 'Authorization: Bearer {{jwt}}' \
  --data '{
    "streaming": true,
    "user_prompt": "",
    "stackspot_knowledge": false,
    "return_ks_in_response": true
  }'
```

## Scripts (backend)

- `npm run dev`: desenvolvimento
- `npm run build`: compila para `dist/`
- `npm start`: roda build

## Roadmap

- Suporte a Vitest/Jasmine
- Templates configuráveis
- Relatórios de cobertura e gaps
- CI (GitHub Actions)

## Licença

MIT


