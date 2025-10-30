import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    message: 'API de testes funcionando',
    endpoints: [
      'GET /api/tests - Lista todos os testes',
      'POST /api/tests - Cria um novo teste',
      'GET /api/tests/:id - Busca um teste específico',
      'PUT /api/tests/:id - Atualiza um teste',
      'DELETE /api/tests/:id - Remove um teste'
    ]
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    message: `Teste ${id} encontrado`,
    id,
    status: 'active'
  });
});

router.post('/', (req, res) => {
  const testData = req.body;
  res.status(201).json({
    message: 'Teste criado com sucesso',
    id: Math.random().toString(36).substr(2, 9),
    ...testData
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  res.json({
    message: `Teste ${id} atualizado`,
    id,
    ...updateData
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    message: `Teste ${id} removido com sucesso`
  });
});

export { router as testRoutes };
