@echo off
title LPUtility
cd /d "%~dp0"

set "PATH=C:\Program Files\nodejs;%SystemRoot%\System32;%SystemRoot%\System32\WindowsPowerShell\v1.0;%PATH%"
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not detected. Running automated setup...
    call setup.bat
    exit /b 0
)

if not exist "node_modules\" (
    echo Dependencies not found. Running automated setup...
    call setup.bat
    exit /b 0
)

echo Starting LPUtility...
call npm run electron
pause
