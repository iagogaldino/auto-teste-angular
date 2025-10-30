import dotenv from 'dotenv';
import { AngularComponentScanner } from './src/services/angularComponentScanner';
import { ScanOptions } from './src/types/angularComponent';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

async function testAngularComponentScanner() {
  try {
    console.log('🔍 Testando AngularComponentScanner...\n');

    const scanner = new AngularComponentScanner();

    // Teste 1: Escanear o diretório atual (backend)
    console.log('1. Escaneando diretório backend...');
    const backendResult = await scanner.scanDirectory('./src', {
      includeTests: false,
      includeSpecs: false,
      recursive: true
    });

    console.log(`   ✅ Arquivos encontrados: ${backendResult.totalFiles}`);
    console.log(`   ✅ Arquivos escaneados: ${backendResult.scannedFiles}`);
    console.log(`   ✅ Componentes encontrados: ${backendResult.components.length}`);
    console.log(`   ✅ Tempo de escaneamento: ${backendResult.scanTime}ms`);
    
    if (backendResult.errors.length > 0) {
      console.log(`   ⚠️  Erros: ${backendResult.errors.length}`);
      backendResult.errors.forEach(error => {
        console.log(`      - ${error.filePath}: ${error.error}`);
      });
    }

    // Mostrar componentes encontrados
    if (backendResult.components.length > 0) {
      console.log('\n📋 Componentes encontrados:');
      backendResult.components.forEach((component, index) => {
        console.log(`\n   ${index + 1}. ${component.name}`);
        console.log(`      Arquivo: ${component.filePath}`);
        console.log(`      Seletor: ${component.selector}`);
        console.log(`      Standalone: ${component.isStandalone ? 'Sim' : 'Não'}`);
        console.log(`      Métodos: ${component.methods.length}`);
        console.log(`      Propriedades: ${component.properties.length}`);
        console.log(`      Signals: ${component.signals.length}`);
        console.log(`      Computed Signals: ${component.computedSignals.length}`);
        console.log(`      Interfaces: ${component.interfaces.length}`);
        
        if (component.methods.length > 0) {
          console.log(`      Métodos: ${component.methods.map(m => m.name).join(', ')}`);
        }
        
        if (component.signals.length > 0) {
          console.log(`      Signals: ${component.signals.map(s => s.name).join(', ')}`);
        }
      });
    }

    // Teste 2: Escanear com opções diferentes
    console.log('\n2. Testando com opções diferentes...');
    const testResult = await scanner.scanDirectory('./src', {
      includeTests: true,
      includeSpecs: true,
      recursive: false
    });

    console.log(`   ✅ Arquivos encontrados (com testes): ${testResult.totalFiles}`);
    console.log(`   ✅ Componentes encontrados: ${testResult.components.length}`);

    // Teste 3: Tentar escanear diretório inexistente
    console.log('\n3. Testando diretório inexistente...');
    const errorResult = await scanner.scanDirectory('./diretorio-inexistente');
    
    if (errorResult.errors.length > 0) {
      console.log(`   ❌ Erro esperado: ${errorResult.errors[0].error}`);
    }

    console.log('\n✅ Teste do AngularComponentScanner concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testAngularComponentScanner();
