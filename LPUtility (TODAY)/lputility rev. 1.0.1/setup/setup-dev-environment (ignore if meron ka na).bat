@echo off
setlocal enabledelayedexpansion
title LPUtility - Developer Environment Setup

echo ======================================================================
echo   LPUtility - Developer Environment Setup
echo   Automated Node.js and Project Dependency Installer
echo ======================================================================
echo.

:: Ensure current working directory is the script folder
cd /d "%~dp0"

:: Step 1: Check if Node.js is already installed
echo [1/3] Checking for Node.js...

set "NODE_CMD="
where node >nul 2>&1
if %errorlevel% equ 0 (
    set "NODE_CMD=node"
) else (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
        set "NODE_CMD=C:\Program Files\nodejs\node.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\node;%PATH%"
        set "NODE_CMD=%LOCALAPPDATA%\Programs\node\node.exe"
    )
)

if defined NODE_CMD (
    echo     Node.js is already installed:
    call node -v
    call npm -v
    echo.
    goto :InstallDeps
)

:: Step 2: Node.js is not found. Automatically install it.
echo     Node.js is NOT installed on this machine.
echo     Starting automated installation of Node.js LTS...
echo.

:: Method 1: Check if winget is available (Windows 10/11 built-in)
where winget >nul 2>&1
if %errorlevel% equ 0 (
    echo     Installing Node.js LTS using Windows Package Manager (winget)...
    winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    if %errorlevel% equ 0 (
        goto :RefreshPath
    )
    echo     winget install encountered an issue. Falling back to direct download...
)

:: Method 2: Download official MSI installer directly using PowerShell
echo     Downloading official Node.js installer from nodejs.org...
set "NODE_MSI=%TEMP%\nodejs_installer.msi"
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi' -OutFile '%NODE_MSI%'"

if not exist "%NODE_MSI%" (
    echo [ERROR] Failed to download Node.js installer.
    echo Please check your internet connection or download Node.js manually from https://nodejs.org/
    pause
    exit /b 1
)

echo     Installing Node.js silently (please wait a moment)...
msiexec /i "%NODE_MSI%" /quiet /norestart
del "%NODE_MSI%" >nul 2>&1

:RefreshPath
:: Step 3: Refresh PATH in current session
echo.
echo     Refreshing environment paths...
if exist "C:\Program Files\nodejs" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
)
if exist "%APPDATA%\npm" (
    set "PATH=%APPDATA%\npm;%PATH%"
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    if not exist "C:\Program Files\nodejs\node.exe" (
        echo [ERROR] Node.js was not detected after installation.
        echo Please restart your computer or install manually from https://nodejs.org/
        pause
        exit /b 1
    )
    set "PATH=C:\Program Files\nodejs;%PATH%"
)

echo     Node.js installation successful:
call node -v
call npm -v
echo.

:InstallDeps
:: Step 4: Install Project Dependencies (npm install)
echo [2/3] Installing project dependencies (npm install)...
echo     This may take 10-30 seconds...
echo.
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install encountered an error.
    pause
    exit /b 1
)

echo.
echo [3/3] Setup complete! All dependencies are installed.
echo ======================================================================
echo.
echo What would you like to do now?
echo   [1] Launch Desktop App (Electron)
echo   [2] Launch Web App (Browser on localhost:5173)
echo   [3] Exit setup
echo.
set /p CHOICE="Select an option (1, 2, or 3): "

if "%CHOICE%"=="1" (
    echo.
    echo Launching LPUtility Desktop App...
    call npm run electron
) else if "%CHOICE%"=="2" (
    echo.
    echo Launching LPUtility Web App...
    start http://localhost:5173
    call npm run dev
) else (
    echo.
    echo You can start the app anytime using:
    echo   - start-electron.bat : for Desktop app
    echo   - start-web.bat      : for Browser app
    echo.
    pause
)
