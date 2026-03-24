@echo off
echo ========================================
echo    AutoLog - Restarting Dev Server
echo ========================================
echo.
echo Stopping old server...
taskkill /f /im node.exe 2>nul
echo.
echo Cleaning cache...
rmdir /s /q .next 2>nul
echo.
echo Starting server...
echo (Wait until you see "Ready" then go back to Chrome)
echo.
npm run dev
pause
