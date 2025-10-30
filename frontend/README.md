# 🎨 Frontend (Angular)

UI para acompanhar escaneamento de componentes, geração e execução de testes, com progresso em tempo real.

## ⚙️ Desenvolvimento

```bash
npm install
npm start
# ou pela raiz do workspace: npm run dev
```

Acesse `http://localhost:4200/`.

## 🏗️ Build de produção

```bash
npm run build
```

Artefatos em `dist/`.

## 🔗 Integração

- Consome a API do backend local (`http://localhost:3000`).
- Variáveis e credenciais são configuradas pela UI no botão `Configurações` (aplica e persiste automaticamente no backend).
