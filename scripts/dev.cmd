@echo off
setlocal
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"
set "PATH=%PROJECT_ROOT%\.tools\node-v22.23.0-win-x64;%PROJECT_ROOT%\.tools\bin;%PATH%"
call pnpm.cmd --filter @ofertas/panel dev %*
exit /b %errorlevel%