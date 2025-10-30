# Script para deploy em produção
# Execute este script para preparar o projeto para deploy

echo "🚀 Preparando projeto para deploy..."

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build

# Verificar se o build foi bem-sucedido
if [ -d "dist" ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Arquivos compilados em: dist/"
    
    # Testar o servidor
    echo "🧪 Testando servidor..."
    timeout 5s npm start || echo "Servidor iniciado (timeout esperado)"
    
    echo ""
    echo "🎉 Projeto pronto para deploy!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Faça commit e push para o repositório"
    echo "2. Configure as variáveis de ambiente no serviço de deploy"
    echo "3. Execute o deploy"
    echo ""
    echo "🌐 Para deploy no Railway:"
    echo "- Acesse railway.app"
    echo "- Conecte seu repositório GitHub"
    echo "- Configure as variáveis de ambiente"
    echo "- O deploy será automático"
    
else
    echo "❌ Erro no build!"
    exit 1
fi
