@echo off
echo 🚀 Preparando projeto para deploy...

echo 📦 Instalando dependências...
npm install

echo 🔨 Fazendo build do projeto...
npm run build

if exist "dist" (
    echo ✅ Build concluído com sucesso!
    echo 📁 Arquivos compilados em: dist/
    
    echo 🧪 Testando servidor...
    timeout 5 npm start
    
    echo.
    echo 🎉 Projeto pronto para deploy!
    echo.
    echo 📋 Próximos passos:
    echo 1. Faça commit e push para o repositório
    echo 2. Configure as variáveis de ambiente no serviço de deploy
    echo 3. Execute o deploy
    echo.
    echo 🌐 Para deploy no Railway:
    echo - Acesse railway.app
    echo - Conecte seu repositório GitHub
    echo - Configure as variáveis de ambiente
    echo - O deploy será automático
) else (
    echo ❌ Erro no build!
    exit /b 1
)
