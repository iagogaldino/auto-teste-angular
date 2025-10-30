"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.testRoutes = router;
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
//# sourceMappingURL=tests.js.map