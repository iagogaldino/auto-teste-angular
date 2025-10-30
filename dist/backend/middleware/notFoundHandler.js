"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        error: {
            message: `Rota não encontrada: ${req.method} ${req.url}`,
            status: 404,
            timestamp: new Date().toISOString(),
            path: req.url
        }
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=notFoundHandler.js.map