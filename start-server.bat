@echo off
title Skillence Academy Server
echo ========================================================
echo   Starting Skillence Academy Local Web Server...
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
