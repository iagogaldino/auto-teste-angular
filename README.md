# 🧪 Auto Unit Test — Angular + Node

Geração automática de testes unitários para projetos Angular, com backend Node/Express, integração com IA (OpenAI/StackSpot) e acompanhamento em tempo real via Socket.IO.

## 📦 Monorepo

- `backend` (Node/Express + TypeScript): escaneia componentes Angular, gera testes (Jest) e expõe APIs + websockets.
- `frontend` (Angular 20 + Signals + Angular Material): UI para orquestrar e visualizar o fluxo.
- `test-angular`: projeto Angular de exemplo para teste do scanner.

## ✅ Requisitos

- Node.js 18+
- npm 9+

## 🚀 Quickstart

1) Instalação

```bash
cd backend && npm install
cd ../frontend && npm install
```

2) Configuração

- Preferencial: configure pela própria UI (ícone de configurações no topo). As mudanças são aplicadas automaticamente e salvas em `backend/config.json`.
- Alternativa: crie `backend/.env` a partir de `backend/env.example`.

Exemplo `.env`:
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:4200
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
LOG_LEVEL=info
```

3) Executar

```bash
# Opção A (recomendada) — Workspace
npm run dev

# Opção B — Manual
cd backend && npm run dev
# nova aba
cd frontend && npm start
```

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:4200`

## 🧭 Fluxo na UI

1. Escanear diretório do projeto Angular alvo
2. Selecionar componentes/arquivos
3. Gerar testes unitários com IA
4. Visualizar resultados (código, explicação, dependências)
5. Criar arquivo `.spec.ts` e/ou executar testes

## 🔌 APIs e Sockets

- REST:
  - `GET /api/health`
  - `POST /api/chatgpt/generate-test`
- Socket.IO (principais eventos):
  - `scan-directory`, `scan-progress`, `scan-completed`, `scan-error`
  - `generate-tests`, `test-generation-progress`, `test-generated`, `test-generation-completed`
  - `get-file-content`
  - `execute-test`, `all-tests-output`

Detalhes adicionais em `INTEGRATION_COMPLETE.md` e `CONFIG_SETUP.md`.

## 🧰 Scripts

Workspace (raiz):
- `npm run dev` – inicia backend e frontend em paralelo
- `npm run build` – build de backend e frontend

Backend:
- `npm run dev` – desenvolvimento
- `npm run build` – compila para `dist/`
- `npm start` – executa build

Frontend:
- `npm start` – desenvolvimento
- `npm run build` – produção para `dist/`

## 🗺️ Roadmap (curto prazo)

- Suporte a Vitest/Jasmine
- Templates configuráveis de test cases
- Relatório de cobertura e gaps
- Integração CI (GitHub Actions)

## 📄 Licença

MIT
