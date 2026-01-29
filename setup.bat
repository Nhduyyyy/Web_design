@echo off
chcp 65001 >nul
title Tuong - Cai dat du an
cd /d "%~dp0"

echo ==========================================
echo   Tuong - Cai dat du an (Windows)
echo ==========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [X] Chua co Node.js. Vui long cai:
  echo     https://nodejs.org/ ^(khuyen nghi ban LTS^)
  echo.
  pause
  exit /b 1
)

echo [OK] Node.js: 
node -v
echo [OK] npm:
npm -v
echo.

echo Dang cai dat dependencies ^(npm install^)...
echo.
call npm install

echo.
echo ==========================================
echo   [OK] Cai dat xong!
echo ==========================================
echo.
echo Chay ung dung:  npm run dev
echo Build:         npm run build
echo.
pause
