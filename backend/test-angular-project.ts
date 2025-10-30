import dotenv from 'dotenv';
import { AngularComponentScanner } from './src/services/angularComponentScanner';
import { ScanOptions } from './src/types/angularComponent';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

async function testAngularProjectScanner() {
  try {
    console.log('🔍 Testando AngularComponentScanner no projeto Angular...\n');

    const scanner = new AngularComponentScanner();
    const projectPath = 'C:\\Users\\iago_\\Desktop\\Projects\\test-angular\\src';

    console.log(`📁 Escaneando diretório: ${projectPath}\n`);

    // Teste com opções padrão
    console.log('1. Escaneamento com opções padrão...');
    const defaultResult = await scanner.scanDirectory(projectPath);

    console.log(`   ✅ Arquivos encontrados: ${defaultResult.totalFiles}`);
    console.log(`   ✅ Arquivos escaneados: ${defaultResult.scannedFiles}`);
    console.log(`   ✅ Componentes encontrados: ${defaultResult.components.length}`);
    console.log(`   ✅ Tempo de escaneamento: ${defaultResult.scanTime}ms`);
    
    if (defaultResult.errors.length > 0) {
      console.log(`   ⚠️  Erros: ${defaultResult.errors.length}`);
      defaultResult.errors.forEach(error => {
        console.log(`      - ${error.filePath}: ${error.error}`);
      });
    }

    // Mostrar detalhes dos componentes encontrados
    if (defaultResult.components.length > 0) {
      console.log('\n📋 Componentes Angular encontrados:');
      defaultResult.components.forEach((component, index) => {
        console.log(`\n   ${index + 1}. ${component.name}`);
        console.log(`      📄 Arquivo: ${component.filePath}`);
        console.log(`      🎯 Seletor: ${component.selector || 'N/A'}`);
        console.log(`      🔧 Standalone: ${component.isStandalone ? 'Sim' : 'Não'}`);
        console.log(`      📝 Template: ${component.templateUrl || 'N/A'}`);
        console.log(`      🎨 Styles: ${component.styleUrl || component.styleUrls?.join(', ') || 'N/A'}`);
        
        console.log(`      📦 Imports: ${component.imports.length > 0 ? component.imports.join(', ') : 'Nenhum'}`);
        
        if (component.methods.length > 0) {
          console.log(`      🔧 Métodos (${component.methods.length}):`);
          component.methods.forEach(method => {
            const visibility = method.isPrivate ? 'private' : 'public';
            const async = method.isAsync ? 'async ' : '';
            const params = method.parameters.join(', ');
            const returnType = method.returnType ? `: ${method.returnType}` : '';
            console.log(`         - ${visibility} ${async}${method.name}(${params})${returnType}`);
          });
        }
        
        if (component.signals.length > 0) {
          console.log(`      📡 Signals (${component.signals.length}):`);
          component.signals.forEach(signal => {
            const initialValue = signal.initialValue ? ` = ${signal.initialValue}` : '';
            console.log(`         - ${signal.name}: signal<${signal.type}>${initialValue}`);
          });
        }
        
        if (component.computedSignals.length > 0) {
          console.log(`      🧮 Computed Signals (${component.computedSignals.length}):`);
          component.computedSignals.forEach(computed => {
            const deps = computed.dependencies.length > 0 ? ` (deps: ${computed.dependencies.join(', ')})` : '';
            console.log(`         - ${computed.name}: computed${deps}`);
          });
        }
        
        if (component.properties.length > 0) {
          console.log(`      🏷️  Propriedades (${component.properties.length}):`);
          component.properties.forEach(prop => {
            const signal = prop.isSignal ? 'signal ' : '';
            const computed = prop.isComputed ? 'computed ' : '';
            const visibility = prop.isPrivate ? 'private ' : '';
            console.log(`         - ${visibility}${signal}${computed}${prop.name}: ${prop.type}`);
          });
        }
        
        if (component.interfaces.length > 0) {
          console.log(`      📋 Interfaces (${component.interfaces.length}):`);
          component.interfaces.forEach(iface => {
            console.log(`         - ${iface.name} (${iface.properties.length} propriedades)`);
          });
        }
        
        console.log(`      🔗 Dependências: ${component.dependencies.length > 0 ? component.dependencies.join(', ') : 'Nenhuma'}`);
      });
    } else {
      console.log('\n❌ Nenhum componente Angular encontrado no diretório especificado.');
    }

    // Teste com opções incluindo testes
    console.log('\n2. Escaneamento incluindo arquivos de teste...');
    const testResult = await scanner.scanDirectory(projectPath, {
      includeTests: true,
      includeSpecs: true
    });

    console.log(`   ✅ Arquivos encontrados (com testes): ${testResult.totalFiles}`);
    console.log(`   ✅ Componentes encontrados: ${testResult.components.length}`);

    // Teste com escaneamento não recursivo
    console.log('\n3. Escaneamento não recursivo...');
    const nonRecursiveResult = await scanner.scanDirectory(projectPath, {
      recursive: false
    });

    console.log(`   ✅ Arquivos encontrados (não recursivo): ${nonRecursiveResult.totalFiles}`);
    console.log(`   ✅ Componentes encontrados: ${nonRecursiveResult.components.length}`);

    console.log('\n✅ Teste do AngularComponentScanner no projeto Angular concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testAngularProjectScanner();
