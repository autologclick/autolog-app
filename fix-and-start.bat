@echo off
echo ========================================
echo    AutoLog - Clean Start
echo ========================================
echo.
echo Stopping ALL Node servers...
taskkill /f /im node.exe 2>nul
timeout /t 3 /nobreak >nul
echo.
echo Cleaning old cache...
rmdir /s /q .next 2>nul
echo.
echo Starting fresh server on port 3000...
npm run dev
pause
