@echo off
REM Double-click this file to release a new version of FROST VEIL.
REM It bumps the version, commits, tags, and pushes.
REM GitHub Actions then builds the APK and adds an entry
REM to the Releases list automatically.
setlocal EnableDelayedExpansion

cd /d "%~dp0"

echo.
echo  ===== FROST VEIL - new release =====
echo.
set /p VERSION="Version number (for example 2.0): "
if "%VERSION%"=="" echo No version typed. Closing. & pause & exit /b 1

REM Allow typing with or without a leading v
set TAG=%VERSION%
if not "%TAG:~0,1%"=="v" set TAG=v%VERSION%
set NUM=%TAG:~1%

echo.
echo  This will release %TAG%. Continue? (Y/N)
set /p CONFIRM="> "
if /i not "%CONFIRM%"=="Y" echo Cancelled. & pause & exit /b 1

REM Update version in package.json (keeps 1.0.0 style if you type 2.0 -> 2.0.0)
powershell -NoProfile -Command ^
  "$n='%NUM%';" ^
  "if (($n.Split('.')).Count -eq 2) { $n = \"$n.0\" };" ^
  "$p = Get-Content 'package.json' -Raw | ConvertFrom-Json;" ^
  "$p.version = $n;" ^
  "$p | ConvertTo-Json -Depth 10 | Set-Content 'package.json' -Encoding UTF8;" ^
  "Write-Host \"package.json version set to $n\""
if errorlevel 1 echo Failed to update package.json. & pause & exit /b 1

git add package.json CHANGELOG.md 2>nul
git add -A
git commit -m "Release %TAG%" 2>nul
git tag %TAG%
if errorlevel 1 echo Tag %TAG% already exists. Use another number. & pause & exit /b 1

git push origin main 2>&1 | findstr /i "error rejected" >nul
if not errorlevel 1 (
  echo.
  echo  Push needs a pull first - downloading GitHub changes...
  git pull --rebase origin main
)

git push origin main
git push origin %TAG%

echo.
echo  ===== Done! =====
echo  GitHub is now building %TAG% (takes about 5 minutes).
echo  Then find it at: https://github.com/Axyrius-Ace/The-Frost-Veil/releases
echo  Your new version will sit at the TOP, older ones below it.
echo.
pause
