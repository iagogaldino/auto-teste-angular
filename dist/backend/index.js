"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
try {
    require('dotenv').config();
}
catch { }
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = require("./services/logger");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const environment_1 = require("./config/environment");
const health_1 = require("./routes/health");
const tests_1 = require("./routes/tests");
const chatgpt_1 = __importDefault(require("./routes/chatgpt"));
const angular_1 = __importDefault(require("./routes/angular"));
const config_1 = __importDefault(require("./routes/config"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const socketHandlers_1 = require("./socket/socketHandlers");
const testGenerationSocketService_1 = require("./services/testGenerationSocketService");
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: [environment_1.config.CORS_ORIGIN, 'http://localhost:4200', 'http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});
exports.io = io;
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: [environment_1.config.CORS_ORIGIN, 'http://localhost:4200', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, morgan_1.default)('tiny'));
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        (0, logger_1.reqSummary)(req.method, req.originalUrl || req.url, res.statusCode, ms);
    });
    next();
});
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/health', health_1.healthRoutes);
app.use('/api/tests', tests_1.testRoutes);
app.use('/api/chatgpt', chatgpt_1.default);
app.use('/api/angular', angular_1.default);
app.use('/api/config', config_1.default);
const baseDir = process.pkg ? path_1.default.dirname(process.execPath) : path_1.default.resolve(__dirname, '..');
const publicCandidates = [
    path_1.default.join(baseDir, 'public', 'index.html'),
    path_1.default.join(baseDir, 'public', 'browser', 'index.html'),
    path_1.default.join(baseDir, 'public', 'frontend', 'browser', 'index.html')
];
const publicIndex = publicCandidates.find(p => fs_1.default.existsSync(p));
if (publicIndex) {
    const publicRoot = path_1.default.dirname(publicIndex);
    app.use(express_1.default.static(publicRoot));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health'))
            return next();
        res.sendFile(path_1.default.join(publicRoot, 'index.html'));
    });
}
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
(0, socketHandlers_1.setupSocketHandlers)(io);
new testGenerationSocketService_1.TestGenerationSocketService(io);
logger_1.logger.info('server_started', { port: environment_1.config.PORT });
const PORT = environment_1.config.PORT || 3000;
server.listen(PORT, () => { });
//# sourceMappingURL=index.js.map