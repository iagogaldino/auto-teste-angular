"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
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
//# sourceMappingURL=health.js.map