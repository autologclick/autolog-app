@echo off
title AutoLog Server
color 0A

echo.
echo  ==============================
echo    AutoLog - Starting Server
echo  ==============================
echo.

cd /d "%~dp0"

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting AutoLog on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo.

call npx next dev -H 0.0.0.0 --port 3000
pause
