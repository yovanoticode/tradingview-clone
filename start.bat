@echo off
title TradingView Web App
cd /d "%~dp0"

echo ===================================================
echo   Iniciando TradingView Web App...
echo ===================================================

if not exist "node_modules" (
    echo Instalando dependencias necesarias...
    call npm install
)

echo Abriendo el navegador en http://localhost:5173/ ...
start http://localhost:5173/

echo Iniciando servidor Vite...
call npm run dev
