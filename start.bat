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

echo Abriendo Google Chrome en http://localhost:5173/ ...
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" http://localhost:5173/
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" http://localhost:5173/
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" http://localhost:5173/
) else (
    start chrome http://localhost:5173/ || start http://localhost:5173/
)

echo Iniciando servidor Vite...
call npm run dev
