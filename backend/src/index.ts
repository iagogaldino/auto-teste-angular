// Carregar variáveis de ambiente (opcional no executável)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch {}

import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { logger, reqSummary } from '@/services/logger';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Importar configurações
import { config } from '@/config/environment';

// Importar rotas
import { healthRoutes } from '@/routes/health';
import { testRoutes } from '@/routes/tests';
import chatgptRoutes from '@/routes/chatgpt';
import angularRoutes from '@/routes/angular';
import configRoutes from '@/routes/config';
import directoriesRoutes from '@/routes/directories';

// Importar middleware
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';

// Importar Socket.IO handlers
import { setupSocketHandlers } from '@/socket/socketHandlers';
import { TestGenerationSocketService } from '@/services/testGenerationSocketService';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: [config.CORS_ORIGIN, 'http://localhost:4200', 'http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware de segurança e performance
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      // Permite chamadas XHR/fetch e websockets para mesma origem e localhost
      "connect-src": ["'self'", "ws:", "http:", "https:"],
      // Evita bloquear event handlers simples do Angular em alguns navegadores
      "script-src-attr": ["'unsafe-inline'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: [config.CORS_ORIGIN, 'http://localhost:4200', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware de logging (conciso)
app.use(morgan('tiny'));
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    reqSummary(req.method, req.originalUrl || req.url, res.statusCode, ms);
  });
  next();
});

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rotas
app.use('/health', healthRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/chatgpt', chatgptRoutes);
app.use('/api/angular', angularRoutes);
app.use('/api/config', configRoutes);
app.use('/api/directories', directoriesRoutes);

// Servir frontend a partir de backend/public
const baseDir = (process as any).pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '..');
const publicCandidates = [
  path.join(baseDir, 'public', 'index.html'),
  path.join(baseDir, 'public', 'browser', 'index.html'),
  path.join(baseDir, 'public', 'frontend', 'browser', 'index.html')
];
const publicIndex = publicCandidates.find(p => fs.existsSync(p));
if (publicIndex) {
  const publicRoot = path.dirname(publicIndex);
  app.use(express.static(publicRoot));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) return next();
    res.sendFile(path.join(publicRoot, 'index.html'));
  });
}

// Middleware de tratamento de erros
app.use(notFoundHandler);
app.use(errorHandler);

// Configurar Socket.IO
setupSocketHandlers(io);
new TestGenerationSocketService(io);
logger.info('server_started', { port: config.PORT });

// Iniciar servidor
const PORT = config.PORT || 3000;

server.listen(PORT, () => {});

export { app, io };
