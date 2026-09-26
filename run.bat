@echo off
setlocal
title FROST VEIL
cd /d "%~dp0"

echo.
echo   ======================================
echo              F R O S T   V E I L
echo   ======================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js was not found.
  echo     Install the LTS version from https://nodejs.org and run this file again.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [*] First run: installing dependencies. This takes a minute...
  call npm install
  if errorlevel 1 (
    echo [!] npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo [*] Freeing port 5173 if busy...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
  taskkill /f /pid %%a >nul 2>nul
)

echo [*] Starting the game server...
call npm run dev
pause
exit /b 0
