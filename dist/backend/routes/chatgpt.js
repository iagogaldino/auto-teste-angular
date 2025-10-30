"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatgptService_1 = require("../services/chatgptService");
const router = (0, express_1.Router)();
let chatGPTService = null;
const getChatGPTService = () => {
    if (!chatGPTService) {
        chatGPTService = new chatgptService_1.ChatGPTService();
    }
    return chatGPTService;
};
router.post('/generate-test', async (req, res) => {
    try {
        const { code, language, framework, testType, additionalInstructions } = req.body;
        if (!code || !language) {
            const response = {
                success: false,
                message: 'Código e linguagem são obrigatórios',
                timestamp: new Date().toISOString()
            };
            return res.status(400).json(response);
        }
        const unitTestRequest = {
            code,
            language,
            framework,
            testType,
            additionalInstructions
        };
        const result = await getChatGPTService().generateUnitTest(unitTestRequest);
        const response = {
            success: true,
            data: result,
            message: 'Teste unitário gerado com sucesso',
            timestamp: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao gerar teste unitário:', error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        };
        res.status(500).json(response);
    }
});
router.get('/test-connection', async (req, res) => {
    try {
        const isConnected = await getChatGPTService().testConnection();
        const response = {
            success: true,
            data: { connected: isConnected },
            message: isConnected ? 'Conexão com ChatGPT estabelecida' : 'Falha na conexão com ChatGPT',
            timestamp: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao testar conexão:', error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        };
        res.status(500).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=chatgpt.js.map