@echo off
pushd "%~dp0"
setlocal EnableExtensions

REM run_uno_pnp.bat 1  -> start server + open browser
REM run_uno_pnp.bat 0  -> stop server

set "PORT=8000"
set "URL=http://localhost:%PORT%/uno_pass_and_play/uno_pass_and_play.html"
set "PIDFILE=%~dp0uno_pnp_server.pid"
set "error=0"

if "%~1"=="" goto :MENU
if "%~1"=="1" goto :START
if "%~1"=="2" goto :STOP

echo Usage:
echo   %~nx0 1   ^(start^)
echo   %~nx0 2   ^(stop^)
echo   %~nx0     ^(menu^)
set "error=0"
goto :EXIT

:MENU
cls
ECHO --------------------------
ECHO 1. Start Uno Pass and Play
ECHO 2. Stop Server/Game
ECHO 3. Exit
ECHO --------------------------
set choice=
set /p choice=Please select (1/2/3):
if '%choice%'=='' goto :MENU
if '%choice%'=='1' goto :START
if '%choice%'=='2' goto :STOP
if '%choice%'=='3' goto :EXIT
Goto :MENU

:START
where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo Python was not found on PATH.
  echo Install Python 3 from https://www.python.org/ and try again.
  set "error=1"
  goto :EXIT
)

REM If something is already on that port, don't start a second server.
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
  echo.
  echo Port %PORT% is already in use.
  echo If this is an old UNO server, run:
  echo   %~nx0 0
  set "error=1"
  goto :EXIT
)

echo.
echo Starting server on port %PORT% ...
REM Start server via PowerShell so we can capture its PID.
powershell -NoProfile -Command "$p = Start-Process -PassThru -WindowStyle Minimized -FilePath cmd.exe -ArgumentList '/c','python -m http.server %PORT%'; Set-Content -Encoding ASCII -Path '%PIDFILE%' -Value $p.Id;" >nul
REM Give the server a moment to start
timeout /t 1 /nobreak >nul

echo Opening %URL%
start "" "%URL%"
echo.
echo To stop the server later, run:
echo   %~nx0 0
set "error=0"
timeout /t 5
goto :MENU

:STOP
if not exist "%PIDFILE%" (
  echo.
  echo No PID file found: %PIDFILE%
  echo Server may already be stopped.
  set "error=1"
  goto :EXIT
)

set /p SERVERPID=<"%PIDFILE%"
if "%SERVERPID%"=="" (
  echo.
  echo PID file was empty.
  del "%PIDFILE%" >nul 2>nul
  set "error=1"
  goto :EXIT
)

echo.
echo Stopping server PID %SERVERPID% ...
taskkill /PID %SERVERPID% /F >nul 2>nul
if errorlevel 1 (
  echo.
  echo Failed to stop PID %SERVERPID% ...
) else (
  echo.
  echo Server stopped.
)
del "%PIDFILE%" >nul 2>nul
set "error=0"
goto :MENU

:EXIT
echo.
echo Goodbye!
timeout /t 5
endlocal
exit /b %error%