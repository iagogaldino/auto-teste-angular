"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const testCaseService_1 = require("../services/testCaseService");
const setupSocketHandlers = (io) => {
    const testCaseService = new testCaseService_1.TestCaseService();
    io.on('connection', (socket) => {
        console.log(`🔌 Cliente conectado: ${socket.id}`);
        socket.emit('connection:status', {
            status: 'connected',
            message: 'Conectado ao servidor de testes'
        });
        socket.on('test:create', async (data) => {
            try {
                const newTest = await testCaseService.createTest(data);
                socket.emit('test:created', newTest);
                io.emit('test:created', newTest);
                console.log(`✅ Teste criado: ${newTest.id}`);
            }
            catch (error) {
                socket.emit('test:error', {
                    testId: 'unknown',
                    error: 'Erro ao criar teste'
                });
            }
        });
        socket.on('test:run', async (data) => {
            try {
                const { testId } = data;
                const test = await testCaseService.getTestById(testId);
                if (!test) {
                    socket.emit('test:error', {
                        testId,
                        error: 'Teste não encontrado'
                    });
                    return;
                }
                socket.emit('test:running', {
                    testId,
                    status: 'running'
                });
                const updatedTest = await testCaseService.runTest(testId);
                if (updatedTest) {
                    setTimeout(() => {
                        socket.emit('test:completed', {
                            testId,
                            result: updatedTest
                        });
                        io.emit('test:updated', updatedTest);
                    }, 2000);
                }
                console.log(`▶️ Teste executando: ${testId}`);
            }
            catch (error) {
                socket.emit('test:error', {
                    testId: data.testId,
                    error: 'Erro ao executar teste'
                });
            }
        });
        socket.on('test:stop', async (data) => {
            try {
                const { testId } = data;
                const test = await testCaseService.getTestById(testId);
                if (test) {
                    await testCaseService.updateTest(testId, { status: 'pending' });
                    socket.emit('test:updated', test);
                    console.log(`⏹️ Teste parado: ${testId}`);
                }
            }
            catch (error) {
                socket.emit('test:error', {
                    testId: data.testId,
                    error: 'Erro ao parar teste'
                });
            }
        });
        socket.on('test:subscribe', (data) => {
            const { testId } = data;
            socket.join(`test:${testId}`);
            console.log(`👂 Cliente ${socket.id} inscrito no teste ${testId}`);
        });
        socket.on('test:unsubscribe', (data) => {
            const { testId } = data;
            socket.leave(`test:${testId}`);
            console.log(`🔇 Cliente ${socket.id} cancelou inscrição no teste ${testId}`);
        });
        socket.on('disconnect', (reason) => {
            console.log(`🔌 Cliente desconectado: ${socket.id} - Motivo: ${reason}`);
        });
        socket.on('error', (error) => {
            console.error(`❌ Erro no socket ${socket.id}:`, error);
        });
    });
    console.log('🔌 Socket.IO handlers configurados');
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=socketHandlers.js.map