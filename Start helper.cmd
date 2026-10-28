@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js LTS from https://nodejs.org/ and then run this file again.
  pause
  exit /b 1
)
start "Quest Helper local server" /min node "%~dp0server.cjs"
start "" "http://127.0.0.1:8765/index.html"
