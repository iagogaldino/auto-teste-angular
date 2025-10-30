"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const angularComponentScanner_1 = require("../services/angularComponentScanner");
const router = (0, express_1.Router)();
router.post('/scan', async (req, res) => {
    try {
        const { directoryPath, options } = req.body;
        if (!directoryPath) {
            const response = {
                success: false,
                message: 'Caminho do diretório é obrigatório',
                timestamp: new Date().toISOString()
            };
            return res.status(400).json(response);
        }
        const scanner = new angularComponentScanner_1.AngularComponentScanner();
        const result = await scanner.scanDirectory(directoryPath, options);
        const response = {
            success: true,
            data: result,
            message: `Escaneamento concluído. ${result.components.length} componentes encontrados em ${result.scannedFiles} arquivos`,
            timestamp: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao escanear diretório:', error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        };
        res.status(500).json(response);
    }
});
router.get('/scan/*', async (req, res) => {
    try {
        const directoryPath = req.params[0];
        if (!directoryPath) {
            const response = {
                success: false,
                message: 'Caminho do diretório é obrigatório',
                timestamp: new Date().toISOString()
            };
            return res.status(400).json(response);
        }
        const scanner = new angularComponentScanner_1.AngularComponentScanner();
        const result = await scanner.scanDirectory(directoryPath);
        const response = {
            success: true,
            data: result,
            message: `Escaneamento concluído. ${result.components.length} componentes encontrados`,
            timestamp: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        console.error('Erro ao escanear diretório:', error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno do servidor',
            timestamp: new Date().toISOString()
        };
        res.status(500).json(response);
    }
});
router.get('/scan-options', (req, res) => {
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
    const response = {
        success: true,
        data: options,
        message: 'Opções disponíveis para escaneamento',
        timestamp: new Date().toISOString()
    };
    res.json(response);
});
exports.default = router;
//# sourceMappingURL=angular.js.map