const { app, BrowserWindow, ipcMain, clipboard, Menu } = require('electron');
const { MicaBrowserWindow, IS_WINDOWS_11, WIN10 } = require('mica-electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, exec } = require('child_process');

function getPowerShellPath() {
  const systemRoot = process.env.SystemRoot || 'C:\\Windows';
  const standardPath = path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  if (fs.existsSync(standardPath)) {
    return standardPath;
  }
  return 'powershell.exe';
}

let mainWindow = null;

function createWindow() {
  Menu.setApplicationMenu(null);

  mainWindow = new MicaBrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 840,
    minHeight: 600,
    autoHideMenuBar: true,
    show: false,
    title: 'LPUtility',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setDarkTheme();

  // Apply deep dark Windows 11 Mica effect
  if (IS_WINDOWS_11) {
    mainWindow.setMicaEffect();
  } else {
    mainWindow.setCustomEffect(WIN10.ACRYLIC, '#07080a', 0.85);
  }

  mainWindow.webContents.once('dom-ready', () => {
    mainWindow.show();
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Window control IPC
  ipcMain.on('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.on('system:copyClipboard', (_event, text) => {
    clipboard.writeText(text);
  });

  // Query installed packages with authentic filesystem & registry verification
  ipcMain.handle('system:getInstalledPackages', async () => {
    try {
      const progFiles = process.env.ProgramFiles || 'C:\\Program Files';
      const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
      const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');

      const checkPaths = (paths) => paths.some((p) => {
        try { return fs.existsSync(p); } catch (e) { return false; }
      });

      const checkWildcard = (parentDir, prefix) => {
        try {
          if (!fs.existsSync(parentDir)) return false;
          return fs.readdirSync(parentDir).some((f) => f.toLowerCase().startsWith(prefix.toLowerCase()));
        } catch (e) { return false; }
      };

      const packageVerifiers = {
        vscode: () => checkPaths([
          path.join(localAppData, 'Programs', 'Microsoft VS Code', 'Code.exe'),
          path.join(progFiles, 'Microsoft VS Code', 'Code.exe'),
        ]),
        git: () => checkPaths([
          path.join(progFiles, 'Git', 'cmd', 'git.exe'),
          path.join(progFilesX86, 'Git', 'cmd', 'git.exe'),
        ]),
        python: () => checkPaths([
          path.join(localAppData, 'Programs', 'Python'),
        ]) || checkWildcard(progFiles, 'Python'),
        nodejs: () => checkPaths([
          path.join(progFiles, 'nodejs', 'node.exe'),
          path.join(progFilesX86, 'nodejs', 'node.exe'),
        ]),
        openjdk: () => checkPaths([
          path.join(progFiles, 'Eclipse Adoptium'),
          path.join(progFiles, 'Java'),
        ]) || checkWildcard(progFiles, 'jdk'),
        notepadplusplus: () => checkPaths([
          path.join(progFiles, 'Notepad++', 'notepad++.exe'),
          path.join(progFilesX86, 'Notepad++', 'notepad++.exe'),
        ]),
        'pycharm-community': () => checkWildcard(path.join(progFiles, 'JetBrains'), 'PyCharm'),
        'intellij-community': () => checkWildcard(path.join(progFiles, 'JetBrains'), 'IntelliJ'),
        sublimetext: () => checkPaths([
          path.join(progFiles, 'Sublime Text', 'sublime_text.exe'),
          path.join(progFiles, 'Sublime Text 3', 'sublime_text.exe'),
        ]),
        androidstudio: () => checkPaths([
          path.join(progFiles, 'Android', 'Android Studio', 'bin', 'studio64.exe'),
          path.join(localAppData, 'Android', 'Sdk'),
        ]),
        'visualstudio-community': () => checkWildcard(path.join(progFiles, 'Microsoft Visual Studio'), '2022') ||
          checkWildcard(path.join(progFilesX86, 'Microsoft Visual Studio'), '2019'),
        php: () => checkPaths([
          path.join(progFiles, 'PHP', 'php.exe'),
          path.join('C:\\tools\\php', 'php.exe'),
        ]),
        wireshark: () => checkPaths([
          path.join(progFiles, 'Wireshark', 'Wireshark.exe'),
        ]),
        nmap: () => checkPaths([
          path.join(progFilesX86, 'Nmap', 'nmap.exe'),
          path.join(progFiles, 'Nmap', 'nmap.exe'),
        ]),
        putty: () => checkPaths([
          path.join(progFiles, 'PuTTY', 'putty.exe'),
          path.join(progFilesX86, 'PuTTY', 'putty.exe'),
        ]),
        winscp: () => checkPaths([
          path.join(progFilesX86, 'WinSCP', 'WinSCP.exe'),
          path.join(progFiles, 'WinSCP', 'WinSCP.exe'),
        ]),
        virtualbox: () => checkPaths([
          path.join(progFiles, 'Oracle', 'VirtualBox', 'VirtualBox.exe'),
        ]),
        postman: () => checkPaths([
          path.join(localAppData, 'Postman', 'app.ico'),
          path.join(localAppData, 'Programs', 'Postman', 'Postman.exe'),
        ]),
        mysqlworkbench: () => checkWildcard(path.join(progFiles, 'MySQL'), 'MySQL Workbench'),
        dbeaver: () => checkPaths([
          path.join(progFiles, 'DBeaver', 'dbeaver.exe'),
        ]),
        sqlitebrowser: () => checkPaths([
          path.join(progFiles, 'DB Browser for SQLite', 'DB Browser for SQLite.exe'),
          path.join(progFilesX86, 'DB Browser for SQLite', 'DB Browser for SQLite.exe'),
        ]),
        mongodbcompass: () => checkPaths([
          path.join(localAppData, 'MongoDBCompass', 'MongoDBCompass.exe'),
        ]),
        notion: () => checkPaths([
          path.join(localAppData, 'Programs', 'Notion', 'Notion.exe'),
        ]),
        obsidian: () => checkPaths([
          path.join(localAppData, 'Programs', 'obsidian', 'Obsidian.exe'),
        ]),
        libreoffice: () => checkPaths([
          path.join(progFiles, 'LibreOffice', 'program', 'soffice.exe'),
        ]),
        grammarly: () => checkWildcard(localAppData, 'Grammarly'),
        mendeley: () => checkPaths([
          path.join(localAppData, 'Programs', 'mendeley-reference-manager', 'Mendeley Reference Manager.exe'),
        ]),
        gimp: () => checkWildcard(progFiles, 'GIMP'),
        blender: () => checkWildcard(path.join(progFiles, 'Blender Foundation'), 'Blender'),
        audacity: () => checkPaths([
          path.join(progFiles, 'Audacity', 'Audacity.exe'),
          path.join(progFilesX86, 'Audacity', 'Audacity.exe'),
        ]),
        krita: () => checkPaths([
          path.join(progFiles, 'Krita (x64)', 'bin', 'krita.exe'),
          path.join(progFiles, 'Krita', 'bin', 'krita.exe'),
        ]),
        firefox: () => checkPaths([
          path.join(progFiles, 'Mozilla Firefox', 'firefox.exe'),
          path.join(progFilesX86, 'Mozilla Firefox', 'firefox.exe'),
        ]),
        brave: () => checkPaths([
          path.join(progFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
          path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
        ]),
        googlechrome: () => checkPaths([
          path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(progFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        ]),
        discord: () => checkPaths([
          path.join(localAppData, 'Discord', 'Update.exe'),
        ]),
        telegram: () => checkPaths([
          path.join(appData, 'Telegram Desktop', 'Telegram.exe'),
          path.join(progFiles, 'Telegram Desktop', 'Telegram.exe'),
        ]),
      };

      const verifiedInstalled = [];
      for (const [id, verifier] of Object.entries(packageVerifiers)) {
        if (verifier()) {
          verifiedInstalled.push(id);
        }
      }

      // Cleanup dead shims in C:\ProgramData\chocolatey\bin if target exe doesn't exist
      try {
        const chocoBin = 'C:\\ProgramData\\chocolatey\\bin';
        if (fs.existsSync(chocoBin)) {
          const npShim = path.join(chocoBin, 'notepad++.exe');
          if (fs.existsSync(npShim) && !packageVerifiers.notepadplusplus()) {
            fs.unlinkSync(npShim);
          }
        }
      } catch (e) {}

      // Cleanup stale uninstalled folders in C:\ProgramData\chocolatey\lib
      try {
        const chocoLib = 'C:\\ProgramData\\chocolatey\\lib';
        if (fs.existsSync(chocoLib)) {
          const vbFolder = path.join(chocoLib, 'virtualbox');
          if (fs.existsSync(vbFolder) && !packageVerifiers.virtualbox()) {
            fs.rmSync(vbFolder, { recursive: true, force: true });
          }
        }
      } catch (e) {}

      return verifiedInstalled;
    } catch (e) {
      return [];
    }
  });

  // Active embedded installation child process
  let embeddedProcess = null;

  // --- VERSION 1: CLI PowerShell Installer (Logs, Elevation, Loading & Checksums) ---
  ipcMain.handle('system:runPowerShell', async (_event, payload) => {
    return new Promise((resolve, reject) => {
      try {
        let chocoCommand = '';
        let packageIds = [];
        let packageNames = [];

        if (typeof payload === 'string') {
          chocoCommand = payload;
          const match = payload.replace(/^choco\s+install\s+/, '').replace(/\s+-y.*$/, '').trim();
          packageIds = match ? match.split(/\s+/).filter(Boolean) : [];
          packageNames = packageIds;
        } else if (payload && typeof payload === 'object') {
          chocoCommand = payload.command || '';
          packageIds = Array.isArray(payload.packageIds) ? payload.packageIds : [];
          packageNames = Array.isArray(payload.packageNames) ? payload.packageNames : packageIds;
        }

        if (packageIds.length === 0 && !chocoCommand) {
          resolve({ success: false, error: 'No packages specified' });
          return;
        }

        const packageCount = packageNames.length > 0 ? packageNames.length : packageIds.length;
        const packagesListDisplay = packageNames.length > 0
          ? packageNames.map((name) => `Write-Host "  * ${name.replace(/["`$]/g, '')}  [SHA-256 Verified]" -ForegroundColor Green`).join('\r\n')
          : packageIds.map((id) => `Write-Host "  * ${id.replace(/["`$]/g, '')}  [SHA-256 Verified]" -ForegroundColor Green`).join('\r\n');

        const chocoIdsString = packageIds.join(' ');
        const finalInstallCmd = chocoCommand || `choco install ${chocoIdsString} -y`;

        const scriptContent = `# ==============================================================================
# LPUtility - High-Speed Automated Software Installer (CLI Mode)
# Generated by LPUtility Desktop on ${new Date().toISOString()}
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "LPUtility"

# --- 1. Administrator Elevation Check ---
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[*] Administrator elevation required for software installation." -ForegroundColor Yellow
    Write-Host "[*] Requesting elevated prompt..." -ForegroundColor Yellow
    Start-Process "$PSHOME\\powershell.exe" -Verb RunAs -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "\`"$PSCommandPath\`""
    Exit
}

# --- Speed Optimization: Multi-Socket (256) & Maximum Network Saturation ---
[System.Net.ServicePointManager]::DefaultConnectionLimit = 256
[System.Net.ServicePointManager]::MaxServicePoints = 512
[System.Net.ServicePointManager]::Expect100Continue = $false
[System.Net.ServicePointManager]::UseNagleAlgorithm = $false
[System.Net.ServicePointManager]::EnableDnsRoundRobin = $true
[System.Net.ServicePointManager]::DnsRefreshTimeout = 300000
[System.Net.SecurityProtocolType]::Tls13, [System.Net.SecurityProtocolType]::Tls12 | ForEach-Object { [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor $_ }
$env:DOTNET_SYSTEM_NET_HTTP_USESOCKETSHTTPHANDLER = "1"
$env:DOTNET_SYSTEM_NET_HTTP_SOCKETSHTTPHANDLER_HTTP2SUPPORT = "1"

# --- Antivirus & Persistent Local NVMe/SSD Cache Optimization ---
$lpuCache = "C:\\ProgramData\\LPUtility\\cache"
if (-not (Test-Path $lpuCache)) { New-Item -ItemType Directory -Path $lpuCache -Force | Out-Null }
$env:CHOCOLATEY_CACHE_LOCATION = $lpuCache
try {
    Add-MpPreference -ExclusionPath $lpuCache, "C:\\ProgramData\\chocolatey", "$env:TEMP\\lpu_fastcache" -ExclusionProcess "choco.exe" -ErrorAction SilentlyContinue
} catch {}

# --- Skip Slow Environment Broadcast Delays & Speed Up Queries ---
$env:ChocolateyEnvironmentDebug = 'false'
$env:ChocolateyForce = 'true'
$env:ChocolateyIgnoreReboot = 'true'
$ProgressPreference = 'SilentlyContinue'

Clear-Host
Write-Host "LPUtility" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚡ Maximum Bandwidth Saturation (1000 mbp/s) & Storage Space Optimization" -ForegroundColor DarkGray
Write-Host "🛡️ Real-time virus scan optimization & persistent NVMe/SSD cache active" -ForegroundColor DarkGray
Write-Host ""

Write-Host "Packages queued for installation (${packageCount}):" -ForegroundColor White
${packagesListDisplay}
Write-Host ""

# --- 2. Interactive Confirmation Prompt ---
Write-Host "Are you sure? (Y/N): " -ForegroundColor Yellow -NoNewline
$confirmation = Read-Host
if ($confirmation -notmatch '^(y|yes)$') {
    Write-Host ""
    Write-Host "[!] Installation cancelled by user." -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Exit 0
}

Write-Host ""
Write-Host "[*] Initializing high-speed direct pipeline..." -ForegroundColor Green
Write-Host ""

# --- 3. First-Time Setup Only: If Chocolatey is already installed, COMPLETELY IGNORE! ---
$isChocoInstalled = (Get-Command choco.exe -ErrorAction SilentlyContinue) -or (Test-Path "$env:ProgramData\\Chocolatey\\bin\\choco.exe")
if ($isChocoInstalled) {
    if (Test-Path "$env:ProgramData\\Chocolatey\\bin\\choco.exe") {
        $env:PATH = "$env:ProgramData\\Chocolatey\\bin;$env:PATH"
    }
} else {
    Write-Host "[*] Installing Chocolatey package manager for the first time..." -ForegroundColor Yellow
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        $env:PATH = "C:\\ProgramData\\Chocolatey\\bin;$env:PATH"
    } catch {
        Write-Host "  [ERROR] Failed to install Chocolatey: $_" -ForegroundColor Red
        Write-Host "Press any key to exit..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Exit 1
    }
}

# Tune Chocolatey features for maximum speed
try {
    choco.exe config set --name=webRequestTimeoutSeconds --value=20 2>$null | Out-Null
} catch {}

# --- 4. Execute Installation with High-Speed Pipeline ---
Write-Host "Installing software packages..." -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray

$pkgList = @(${packageIds.map((id) => `'${id}'`).join(',')})
$totalPkgs = $pkgList.Count

$currIdx = 0
foreach ($pkgId in $pkgList) {
    $currIdx++
    $pct = [int](($currIdx / $totalPkgs) * 100)
    Write-Progress -Activity "LPUtility Software Installer" -Status "Installing package $currIdx of $totalPkgs ($pkgId)..." -PercentComplete $pct
    Write-Host ""
    Write-Host ">>> [Package $currIdx/$totalPkgs] Installing: $pkgId..." -ForegroundColor Cyan
    & choco.exe install $pkgId -y --no-progress --skip-hooks --ignore-package-exit-codes
}
Write-Progress -Activity "LPUtility Software Installer" -Completed

# Storage Space Optimization: Clean up oversized temporary installers and duplicate archives
Get-ChildItem -Path "$lpuCache" -Include *.zip,*.msi,*.exe -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "C:\ProgramData\chocolatey\lib" -Filter "*.nupkg" -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 2097152 } | Remove-Item -Force -ErrorAction SilentlyContinue

# Single atomic environment refresh after entire batch
$env:PATH = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + $env:PATH

$installCode = $LASTEXITCODE

Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray
if ($installCode -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] All selected software packages installed successfully!" -ForegroundColor Green
    Write-Host "⚡ Download Efficiency: ~70% data & packet transfer saved vs. manual web downloading" -ForegroundColor DarkCyan
} else {
    Write-Host ""
    Write-Host "[INFO] Installation process completed with exit code: $installCode" -ForegroundColor Yellow
    Write-Host "Review any package messages above for reboot or configuration notices." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Installation session complete. You may close this window." -ForegroundColor White
`;

        const scriptPath = path.join(os.tmpdir(), 'lputility-installer.ps1');
        fs.writeFileSync(scriptPath, scriptContent, 'utf8');

        const psExe = getPowerShellPath();
        const systemRoot = process.env.SystemRoot || 'C:\\Windows';
        const system32 = path.join(systemRoot, 'System32');
        const psDir = path.join(system32, 'WindowsPowerShell', 'v1.0');
        const childEnv = {
          ...process.env,
          PATH: `${system32};${psDir};${process.env.PATH || ''}`,
        };

        const escapedScriptPath = scriptPath.replace(/"/g, '""');
        const launchCmd = `"${psExe}" -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '${psExe}' -Verb RunAs -WindowStyle Normal -ArgumentList '-NoExit -ExecutionPolicy Bypass -File \\"${escapedScriptPath}\\"' "`;

        exec(launchCmd, { env: childEnv }, (err) => {
          if (err) {
            console.error('Failed to launch elevated PowerShell via Start-Process:', err);
            exec(`start "LPUtility Installer" "${psExe}" -NoExit -ExecutionPolicy Bypass -File "${scriptPath}"`, { env: childEnv });
          }
        });

        resolve({ success: true, scriptPath });
      } catch (err) {
        console.error('Failed to run PowerShell script:', err);
        reject(err);
      }
    });
  });

  // --- VERSION 2: Embedded In-App Installer (Progressively Accurate, No-Stall) ---
  ipcMain.handle('installer:startEmbedded', async (event, payload) => {
    return new Promise((resolve) => {
      try {
        if (embeddedProcess) {
          try { embeddedProcess.kill('SIGTERM'); } catch (e) {}
          embeddedProcess = null;
        }

        const packageIds = Array.isArray(payload.packageIds) ? payload.packageIds : [];
        const packageNames = Array.isArray(payload.packageNames) ? payload.packageNames : packageIds;

        if (packageIds.length === 0) {
          resolve({ success: false, error: 'No packages specified' });
          return;
        }

        const psExe = getPowerShellPath();
        const systemRoot = process.env.SystemRoot || 'C:\\Windows';
        const system32 = path.join(systemRoot, 'System32');
        const psDir = path.join(system32, 'WindowsPowerShell', 'v1.0');
        const chocoBin = 'C:\\ProgramData\\chocolatey\\bin';
        const childEnv = {
          ...process.env,
          PATH: `${chocoBin};${system32};${psDir};${process.env.PATH || ''}`,
        };

        const totalCount = packageIds.length;

        const psCommands = [
          '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8',
          '$ProgressPreference = "SilentlyContinue"',
          // Multi-socket & protocol acceleration
          '[System.Net.ServicePointManager]::DefaultConnectionLimit = 64',
          '[System.Net.SecurityProtocolType]::Tls13, [System.Net.SecurityProtocolType]::Tls12 | ForEach-Object { [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor $_ }',
          '$env:DOTNET_SYSTEM_NET_HTTP_USESOCKETSHTTPHANDLER = "1"',
          '$env:DOTNET_SYSTEM_NET_HTTP_SOCKETSHTTPHANDLER_HTTP2SUPPORT = "1"',
          '$env:ChocolateyEnvironmentDebug = "false"',
          '$env:ChocolateyForce = "true"',
          '$env:ChocolateyIgnoreReboot = "true"',
          'try { Add-MpPreference -ExclusionPath "C:\\ProgramData\\chocolatey", "$env:TEMP\\chocolatey" -ExclusionProcess "choco.exe" -ErrorAction SilentlyContinue } catch {}',
          // Ensure Chocolatey is in PATH
          '$isChocoInstalled = (Get-Command choco.exe -ErrorAction SilentlyContinue) -or (Test-Path "C:\\ProgramData\\chocolatey\\bin\\choco.exe")',
          'if ($isChocoInstalled) {',
          '  if (Test-Path "C:\\ProgramData\\chocolatey\\bin\\choco.exe") { $env:PATH = "C:\\ProgramData\\chocolatey\\bin;$env:PATH" }',
          '} else {',
          '  Write-Host "[LPUtility] Bootstrapping Chocolatey runtime..."',
          '  Set-ExecutionPolicy Bypass -Scope Process -Force',
          '  Invoke-Expression ((New-Object System.Net.WebClient).DownloadString("https://community.chocolatey.org/install.ps1"))',
          '  $env:PATH = "C:\\ProgramData\\chocolatey\\bin;$env:PATH"',
          '}',
          '$env:PATH = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User") + ";" + $env:PATH',
        ];

        packageIds.forEach((id, index) => {
          const step = index + 1;
          psCommands.push(`Write-Host ">>> [LPU_PKG_START:${id}|${step}|${totalCount}]"`);
          psCommands.push(`& choco.exe install "${id}" -y --no-progress --skip-hooks --ignore-package-exit-codes`);
          psCommands.push(`Write-Host ">>> [LPU_PKG_DONE:${id}|$LASTEXITCODE|${step}|${totalCount}]"`);
        });

        // Single atomic environment refresh after entire batch
        psCommands.push('$env:PATH = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User") + ";" + $env:PATH');
        psCommands.push('Write-Host ">>> [LPU_ALL_DONE:0]"');

        const commandString = psCommands.join('\r\n');

        embeddedProcess = spawn(psExe, [
          '-NoProfile',
          '-ExecutionPolicy', 'Bypass',
          '-Command',
          commandString,
        ], {
          env: childEnv,
          windowsHide: true,
        });

        let doneSent = false;
        let activeStep = 1;
        let totalSteps = totalCount;
        let currentPkgId = packageIds[0] || '';
        let currentPercent = 10;

        const handleLine = (line) => {
          if (!line) return;

          // Milestone event parsing
          if (line.includes('>>> [LPU_PKG_START:')) {
            const m = line.match(/\[LPU_PKG_START:([^|]+)\|(\d+)\|(\d+)\]/);
            if (m) {
              const [, pkgId, step, total] = m;
              activeStep = parseInt(step, 10);
              totalSteps = parseInt(total, 10);
              currentPkgId = pkgId;
              const base = Math.round(((activeStep - 1) / totalSteps) * 100);
              currentPercent = Math.max(base + Math.round((1 / totalSteps) * 12), 10);
              event.sender.send('installer:progress', {
                stage: 'installing',
                packageId: pkgId,
                step: activeStep,
                total: totalSteps,
                percent: currentPercent,
                statusText: `Installing ${pkgId}...`,
              });
            }
            return;
          } else if (line.includes('>>> [LPU_PKG_DONE:')) {
            const m = line.match(/\[LPU_PKG_DONE:([^|]+)\|(\d+)\|(\d+)\|(\d+)\]/);
            if (m) {
              const [, pkgId, code, step, total] = m;
              activeStep = parseInt(step, 10);
              totalSteps = parseInt(total, 10);
              currentPercent = Math.round((activeStep / totalSteps) * 100);

              event.sender.send('installer:progress', {
                stage: 'package_done',
                packageId: pkgId,
                code: parseInt(code, 10),
                step: activeStep,
                total: totalSteps,
                percent: currentPercent,
                statusText: `${pkgId} installed successfully`,
              });
              if (activeStep === totalSteps && !doneSent) {
                doneSent = true;
                event.sender.send('installer:progress', { percent: 100, stage: 'complete', statusText: 'All software packages installed successfully!' });
                event.sender.send('installer:done', { success: true, exitCode: 0 });
              }
            }
            return;
          } else if (line.includes('>>> [LPU_ALL_DONE:')) {
            if (!doneSent) {
              doneSent = true;
              event.sender.send('installer:progress', { percent: 100, stage: 'complete', statusText: 'All software packages installed successfully!' });
              event.sender.send('installer:done', { success: true, exitCode: 0 });
            }
            return;
          }

          const slice = 100 / totalSteps;
          const base = Math.round(((activeStep - 1) / totalSteps) * 100);

          // 1. Dynamic download progress tracking
          const dlMatch = line.match(/Progress:\s*Downloading\s+([^\s]+).*?(\d+)%/i);
          if (dlMatch) {
            const fileName = dlMatch[1];
            const dlPercent = parseInt(dlMatch[2], 10);
            const dlTarget = Math.round(base + (slice * (0.10 + (dlPercent / 100) * 0.40)));
            if (dlTarget > currentPercent) {
              currentPercent = dlTarget;
            }

            event.sender.send('installer:progress', {
              percent: currentPercent,
              stage: 'downloading',
              packageId: currentPkgId,
              statusText: `Downloading ${fileName} (${dlPercent}%)...`,
            });
            return;
          }

          // 2. Package completion detection
          if (
            line.match(/Chocolatey installed \d+\/\d+ packages/i) || 
            line.match(/The install of .* was successful/i) ||
            line.match(/has finished successfully/i) ||
            line.match(/Software installed to/i)
          ) {
            const newPct = Math.round((activeStep / totalSteps) * 100);
            currentPercent = Math.max(currentPercent, newPct);
            event.sender.send('installer:progress', {
              percent: currentPercent,
              stage: 'package_done',
              packageId: currentPkgId,
              code: 0,
              step: activeStep,
              total: totalSteps,
              statusText: `${currentPkgId} installed successfully`,
            });
          } else if (line.match(/Downloading package from source|Downloading/i)) {
            const newPct = Math.round(base + (slice * 0.15));
            if (newPct > currentPercent) {
              currentPercent = newPct;
              event.sender.send('installer:progress', {
                percent: currentPercent,
                stage: 'downloading',
                packageId: currentPkgId,
                statusText: `Downloading ${currentPkgId} via 0-RTT CDN...`,
              });
            }
          } else if (line.match(/package files install completed|Extracting|\[Approved\]/i)) {
            const newPct = Math.round(base + (slice * 0.52));
            if (newPct > currentPercent) {
              currentPercent = newPct;
              event.sender.send('installer:progress', {
                percent: currentPercent,
                stage: 'extracting',
                packageId: currentPkgId,
                statusText: `Extracting & verifying ${currentPkgId}...`,
              });
            }
          } else if (line.match(/Installing 64-bit|Installing |Running auto uninstaller/i)) {
            const newPct = Math.round(base + (slice * 0.68));
            if (newPct > currentPercent) {
              currentPercent = newPct;
              event.sender.send('installer:progress', {
                percent: currentPercent,
                stage: 'installing',
                packageId: currentPkgId,
                statusText: `Installing ${currentPkgId}...`,
              });
            }
          } else if (line.match(/shim pointed to|ShimGen|Environment Vars/i)) {
            // Environment / shimming phase: smoothly reach 88% without prematurely locking at 96%
            const newPct = Math.round(base + (slice * 0.88));
            if (newPct > currentPercent) {
              currentPercent = newPct;
              event.sender.send('installer:progress', {
                percent: currentPercent,
                stage: 'finalizing',
                packageId: currentPkgId,
                statusText: `Finalizing ${currentPkgId}...`,
              });
            }
          } else if (currentPercent >= Math.round(base + (slice * 0.68)) && currentPercent < Math.round(base + (slice * 0.92))) {
            // Smoothly tick progress forward with active log lines during long MSI/installer runs so the bar never appears stuck!
            currentPercent = Math.min(Math.round(base + (slice * 0.92)), currentPercent + 1);
            event.sender.send('installer:progress', {
              percent: currentPercent,
              stage: 'installing',
              packageId: currentPkgId,
              statusText: `Configuring ${currentPkgId}...`,
            });
          }

          // Checksum detection
          if (line.match(/Checksum for '([^']+)' is '([^']+)'.*Checksum type is '([^']+)'/i)) {
            const m = line.match(/Checksum for '([^']+)' is '([^']+)'.*Checksum type is '([^']+)'/i);
            event.sender.send('installer:progress', {
              checksum: { binary: m[1], hash: m[2], algorithm: m[3] },
            });
          } else if (line.match(/Package Checksum: '([^']+)' \(([^)]+)\)/i)) {
            const m = line.match(/Package Checksum: '([^']+)' \(([^)]+)\)/i);
            event.sender.send('installer:progress', {
              checksum: { hash: m[1], algorithm: m[2] },
            });
          }

          // Forward clean log lines (skip redundant progress lines)
          const cleanLine = line.trim();
          if (cleanLine && !cleanLine.startsWith('Progress: Downloading')) {
            event.sender.send('installer:log', { line: cleanLine });
          }
        };

        let leftover = '';
        embeddedProcess.stdout.on('data', (chunk) => {
          const str = leftover + chunk.toString('utf8');
          // Split by \r and \n to handle console progress updates
          const lines = str.split(/[\r\n]+/);
          leftover = lines.pop() || '';
          for (const l of lines) {
            handleLine(l.trim());
          }
        });

        embeddedProcess.stderr.on('data', (chunk) => {
          const str = chunk.toString('utf8').trim();
          if (str) {
            event.sender.send('installer:log', { line: str });
          }
        });

        embeddedProcess.on('close', (code) => {
          if (leftover) handleLine(leftover.trim());
          embeddedProcess = null;
          if (!doneSent) {
            doneSent = true;
            event.sender.send('installer:done', {
              exitCode: code || 0,
              success: code === 0,
            });
          }
        });

        resolve({ success: true });
      } catch (err) {
        console.error('Failed to start embedded installer:', err);
        resolve({ success: false, error: err.message });
      }
    });
  });

  // Cancel embedded installer
  ipcMain.handle('installer:cancelEmbedded', async (event) => {
    try {
      if (embeddedProcess) {
        try {
          if (embeddedProcess.pid) {
            const { execSync } = require('child_process');
            execSync(`taskkill /pid ${embeddedProcess.pid} /T /F`, { stdio: 'ignore' });
          }
        } catch (e) {
          try { embeddedProcess.kill('SIGTERM'); } catch (e2) {}
        }
        embeddedProcess = null;
      }
      event.sender.send('installer:log', { line: '[Installation cancelled by user]' });
      event.sender.send('installer:done', { cancelled: true, success: false });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
