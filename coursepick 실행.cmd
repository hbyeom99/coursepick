@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\start-local.ps1" %*
if errorlevel 1 (
  echo.
  echo Startup failed. See the message above and outputs\local-servers logs.
  pause
  exit /b 1
)
exit /b 0
