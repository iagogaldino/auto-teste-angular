import { Router, Request, Response } from 'express';
import { AngularComponentScanner } from '../services/angularComponentScanner';
import { ScanOptions } from '../types/angularComponent';
import { ApiResponse } from '../types/api';

const router = Router();

/**
 * POST /api/angular/scan
 * Escaneia um diretório em busca de componentes Angular
 */
router.post('/scan', async (req: Request, res: Response) => {
  try {
    const { directoryPath, options }: { directoryPath: string; options?: Partial<ScanOptions> } = req.body;

    // Validação básica
    if (!directoryPath) {
      const response: ApiResponse = {
        success: false,
        message: 'Caminho do diretório é obrigatório',
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    const scanner = new AngularComponentScanner();
    const result = await scanner.scanDirectory(directoryPath, options);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: `Escaneamento concluído. ${result.components.length} componentes encontrados em ${result.scannedFiles} arquivos`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao escanear diretório:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/angular/scan/:path(*)
 * Escaneia um diretório via GET (path como parâmetro)
 */
router.get('/scan/*', async (req: Request, res: Response) => {
  try {
    const directoryPath = req.params[0]; // Captura todo o path após /scan/
    
    if (!directoryPath) {
      const response: ApiResponse = {
        success: false,
        message: 'Caminho do diretório é obrigatório',
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    const scanner = new AngularComponentScanner();
    const result = await scanner.scanDirectory(directoryPath);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: `Escaneamento concluído. ${result.components.length} componentes encontrados`,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao escanear diretório:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/angular/scan-options
 * Retorna as opções disponíveis para escaneamento
 */
router.get('/scan-options', (req: Request, res: Response) => {
  const options = {
    includeTests: {
      type: 'boolean',
      default: false,
      description: 'Incluir arquivos de teste (.test.ts)'
    },
    includeSpecs: {
      type: 'boolean', 
      default: false,
      description: 'Incluir arquivos de spec (.spec.ts)'
    },
    recursive: {
      type: 'boolean',
      default: true,
      description: 'Escanear subdiretórios recursivamente'
    },
    fileExtensions: {
      type: 'string[]',
      default: ['.ts'],
      description: 'Extensões de arquivo para escanear'
    },
    excludePatterns: {
      type: 'string[]',
      default: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      description: 'Padrões de arquivos para excluir'
    }
  };

  const response: ApiResponse<typeof options> = {
    success: true,
    data: options,
    message: 'Opções disponíveis para escaneamento',
    timestamp: new Date().toISOString()
  };

  res.json(response);
});

export default router;
