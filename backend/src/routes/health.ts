import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando corretamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.get('/ping', (_req, res) => {
  res.json({ message: 'pong' });
});

export { router as healthRoutes };
