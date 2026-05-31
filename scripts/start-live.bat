@echo off
title AnyBid - Live Server
echo.
echo  Starting MySQL (XAMPP)...
if exist C:\xampp\mysql_start.bat (
  start /min cmd /c C:\xampp\mysql_start.bat
  timeout /t 6 /nobreak >nul
)
echo  Starting AnyBid on http://localhost:3000
echo  Share on your Wi-Fi: http://YOUR-PC-IP:3000
echo.
cd /d "%~dp0.."
node server\index.js
pause
