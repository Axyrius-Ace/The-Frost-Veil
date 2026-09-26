@echo off
setlocal EnableExtensions
title FROST VEIL - Launcher
cd /d "%~dp0"

echo.
echo   =============================================
echo      F R O S T   V E I L   ::   launcher
echo   =============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [!] Node.js was not found. FROST VEIL needs Node.js 18 or newer.
  echo       Opening the download page... install it, then run this file again.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)

if not exist "node_modules\phaser\package.json" (
  echo   [1/3] Installing dependencies ^(first launch only, ~1 minute^)...
  call npm install --no-fund --no-audit
  if errorlevel 1 (
    echo   [!] npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
) else (
  echo   [1/3] Dependencies already installed.
)

set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

echo   [2/3] Waiting for the dev server, then opening Chrome...
start "" /min powershell -NoProfile -ExecutionPolicy Bypass -Command "$u='http://localhost:5173'; for($i=0;$i -lt 90;$i++){ try { Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 1 | Out-Null; break } catch { Start-Sleep -Milliseconds 700 } }; $c='%CHROME%'; if($c -ne ''){ Start-Process -FilePath $c -ArgumentList $u } else { Start-Process $u }"

echo   [3/3] Starting Vite on http://localhost:5173  ^(close this window to stop^)
echo.
call npm run dev
pause
