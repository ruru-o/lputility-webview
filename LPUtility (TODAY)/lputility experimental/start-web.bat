@echo off
title LPUtility
cd /d "%~dp0"

set "PATH=C:\Program Files\nodejs;%PATH%"
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
start http://localhost:5173
call npm run dev
pause
