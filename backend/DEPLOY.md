# Deploy para Railway

## 🚀 Deploy Automático no Railway

### Passo 1: Preparar o projeto
```bash
# Instalar dependências
npm install

# Testar localmente
npm run dev
```

### Passo 2: Conectar com Railway
1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha seu repositório

### Passo 3: Configurar variáveis de ambiente
No Railway dashboard, vá em Variables e adicione:
```
NODE_ENV=production
CORS_ORIGIN=https://seu-projeto.railway.app
PORT=3000
```

### Passo 4: Deploy
O Railway fará o deploy automaticamente quando você fizer push para o repositório.

---

## 🌐 Deploy Manual (Alternativo)

### Usando PM2 para produção:
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Build do projeto
npm run build

# Iniciar com PM2
pm2 start dist/index.js --name "autounittest-backend"

# Salvar configuração do PM2
pm2 save
pm2 startup
```

### Usando Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 🔧 Scripts de Deploy

Execute estes comandos para preparar o deploy:

```bash
# 1. Instalar dependências
npm install

# 2. Build do projeto
npm run build

# 3. Testar build
npm start
```

---

## 📋 Checklist de Deploy

- [ ] Dependências instaladas
- [ ] Build executado com sucesso
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado para o domínio de produção
- [ ] Porta configurada corretamente
- [ ] Logs configurados
- [ ] Teste de conectividade realizado
