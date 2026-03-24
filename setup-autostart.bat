@echo off
echo.
echo  ==========================================
echo    AutoLog - Setup Auto-Start on Login
echo  ==========================================
echo.

set "SCRIPT_DIR=%~dp0"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP_FOLDER%\AutoLog Server.lnk"

:: Create a shortcut in the Windows Startup folder
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%SHORTCUT%'); $sc.TargetPath = '%SCRIPT_DIR%start-autolog-silent.vbs'; $sc.WorkingDirectory = '%SCRIPT_DIR%'; $sc.Description = 'AutoLog Dev Server'; $sc.Save()"

if exist "%SHORTCUT%" (
    echo [OK] AutoLog will now start automatically when you log in!
    echo.
    echo Shortcut created at:
    echo %SHORTCUT%
    echo.
    echo To remove auto-start, delete the shortcut from:
    echo %STARTUP_FOLDER%
) else (
    echo [ERROR] Failed to create startup shortcut.
)

echo.
pause
