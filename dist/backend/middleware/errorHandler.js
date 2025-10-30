"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../services/logger");
const errorHandler = (error, req, res, _next) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Erro interno do servidor';
    logger_1.logger.error('unhandled_error', {
        message: error.message,
        url: req.url,
        method: req.method
    });
    res.status(statusCode).json({
        error: {
            message,
            status: statusCode,
            timestamp: new Date().toISOString(),
            path: req.url
        }
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map