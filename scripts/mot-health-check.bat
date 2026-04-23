@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM  AutoLog - MOT API Health Check (scheduled task wrapper)
REM  Runs daily via Windows Task Scheduler.
REM
REM  Behavior:
REM    1. If port 3000 isn't listening, start the Next.js dev
REM       server via start-autolog-silent.vbs and wait up to
REM       90s for it to come up.
REM    2. GET /api/vehicles/mot-health and log the JSON result.
REM    3. If status != "ok", also verify /api/vehicles/lookup
REM       for a known plate so we can tell whether lookups still
REM       work after an auto-update or resource discovery.
REM    4. Write a dated Hebrew-friendly log file under logs\mot-health.
REM
REM  Exit codes:
REM    0 - status=ok
REM    1 - status=updated (resource id was auto-updated)
REM    2 - status=discovered (new resource id discovered)
REM    3 - status=error (API down, manual action needed)
REM    4 - server failed to start
REM    5 - unknown/malformed response
REM ============================================================

set "APP_DIR=C:\Users\User\AutoLog\autolog-app"
set "LOG_DIR=%APP_DIR%\logs\mot-health"
set "VBS=%APP_DIR%\start-autolog-silent.vbs"
set "HEALTH_URL=http://localhost:3000/api/vehicles/mot-health"
set "LOOKUP_URL=http://localhost:3000/api/vehicles/lookup?plate=5772637"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM --- timestamp via PowerShell to avoid locale-dependent %DATE% / %TIME% parsing ---
for /f "usebackq delims=" %%s in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd'"`) do set "STAMP_DATE=%%s"
for /f "usebackq delims=" %%s in (`powershell -NoProfile -Command "Get-Date -Format 'HH:mm:ss'"`) do set "STAMP_TIME=%%s"
set "LOG_FILE=%LOG_DIR%\mot-health-%STAMP_DATE%.log"

>> "%LOG_FILE%" echo ============================================================
>> "%LOG_FILE%" echo [%STAMP_DATE% %STAMP_TIME%] MOT health check started
>> "%LOG_FILE%" echo ============================================================

REM --- Step 1: make sure the dev server is up ---
call :is_port_up 3000
if errorlevel 1 (
  >> "%LOG_FILE%" echo [info] port 3000 not listening - starting dev server via VBS
  if not exist "%VBS%" (
    >> "%LOG_FILE%" echo [error] %VBS% not found
    echo MOT health check FAILED: start-autolog-silent.vbs missing
    exit /b 4
  )
  wscript "%VBS%"
  call :wait_for_server
  if errorlevel 1 (
    >> "%LOG_FILE%" echo [error] dev server did not come up within 90s
    echo MOT health check FAILED: dev server did not start
    exit /b 4
  )
  >> "%LOG_FILE%" echo [info] dev server is listening on port 3000 after !WAIT!s
) else (
  >> "%LOG_FILE%" echo [info] dev server already listening on port 3000
)

REM --- Step 2: call the health endpoint ---
set "HEALTH_JSON=%TEMP%\mot-health-%RANDOM%.json"
curl -s -o "%HEALTH_JSON%" -w "HTTP %%{http_code}\n" "%HEALTH_URL%" >> "%LOG_FILE%" 2>&1
>> "%LOG_FILE%" echo --- health response ---
type "%HEALTH_JSON%" >> "%LOG_FILE%" 2>&1
>> "%LOG_FILE%" echo.

REM --- parse the "status" field via PowerShell (robust JSON parse) ---
REM  Avoid using a PS pipe inside the for /f backticks to sidestep cmd escaping pitfalls.
set "STATUS="
for /f "usebackq delims=" %%s in (`powershell -NoProfile -Command "try { (ConvertFrom-Json (Get-Content -Raw '%HEALTH_JSON%')).status } catch { 'parse_error' }"`) do (
  set "STATUS=%%s"
)
if not defined STATUS set "STATUS=parse_error"
>> "%LOG_FILE%" echo [parsed] status=!STATUS!

REM --- Step 3: on non-ok status, also verify a known plate lookup ---
if /I not "!STATUS!"=="ok" (
  >> "%LOG_FILE%" echo [verify] running plate lookup for 5772637
  curl -s -w "HTTP %%{http_code}\n" "%LOOKUP_URL%" >> "%LOG_FILE%" 2>&1
  >> "%LOG_FILE%" echo.
)

REM --- Step 4: report and exit ---
if /I "!STATUS!"=="ok"         ( echo MOT health check: OK                     & set "RC=0" )
if /I "!STATUS!"=="updated"    ( echo MOT health check: UPDATED - new resource id persisted & set "RC=1" )
if /I "!STATUS!"=="discovered" ( echo MOT health check: DISCOVERED - new resource id persisted & set "RC=2" )
if /I "!STATUS!"=="error"      ( echo MOT health check: ERROR - API down, manual action needed & set "RC=3" )
if not defined RC              ( echo MOT health check: UNKNOWN status="!STATUS!" & set "RC=5" )

>> "%LOG_FILE%" echo [done] exit=!RC!
del "%HEALTH_JSON%" 2> nul
endlocal & exit /b %RC%


REM ============================================================
REM  Helpers
REM ============================================================
:is_port_up
REM  returns errorlevel 0 if port %1 has a LISTENING socket
REM  two separate findstr calls are more robust across locales than a single regex
netstat -ano -p tcp | findstr "LISTENING" | findstr ":%~1 " > nul
exit /b %errorlevel%


:wait_for_server
REM  polls port 3000 every 3 seconds, up to 90 seconds
REM  returns errorlevel 0 if the server came up, 1 if we timed out
set "WAIT=0"
:wait_for_server_loop
timeout /t 3 /nobreak > nul
set /a WAIT+=3
call :is_port_up 3000
if not errorlevel 1 exit /b 0
if %WAIT% GEQ 90 exit /b 1
goto :wait_for_server_loop
