import { Router, Request, Response } from 'express';
import { ChatGPTService } from '../services/chatgptService';
import { UnitTestRequest } from '../types/chatgpt';
import { ApiResponse } from '../types/api';

const router = Router();

// Lazy initialization para evitar erro de variáveis de ambiente
let chatGPTService: ChatGPTService | null = null;

const getChatGPTService = (): ChatGPTService => {
  if (!chatGPTService) {
    chatGPTService = new ChatGPTService();
  }
  return chatGPTService;
};

/**
 * POST /api/chatgpt/generate-test
 * Gera um teste unitário usando ChatGPT
 */
router.post('/generate-test', async (req: Request, res: Response) => {
  try {
    const { code, language, framework, testType, additionalInstructions }: UnitTestRequest = req.body;

    // Validação básica
    if (!code || !language) {
      const response: ApiResponse = {
        success: false,
        message: 'Código e linguagem são obrigatórios',
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    const unitTestRequest: UnitTestRequest = {
      code,
      language,
      framework,
      testType,
      additionalInstructions
    };

    const result = await getChatGPTService().generateUnitTest(unitTestRequest);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Teste unitário gerado com sucesso',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao gerar teste unitário:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/chatgpt/test-connection
 * Testa a conectividade com a API do ChatGPT
 */
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    const isConnected = await getChatGPTService().testConnection();
    
    const response: ApiResponse<{ connected: boolean }> = {
      success: true,
      data: { connected: isConnected },
      message: isConnected ? 'Conexão com ChatGPT estabelecida' : 'Falha na conexão com ChatGPT',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao testar conexão:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

export default router;
