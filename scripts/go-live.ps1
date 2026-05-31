# AnyBid — one-command public link (while your PC is on)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "`n=== AnyBid Go Live ===" -ForegroundColor Cyan

# MySQL
if (Test-Path "C:\xampp\mysql\bin\mysql.exe") {
  $ok = & C:\xampp\mysql\bin\mysql.exe -u root -e "SELECT 1" 2>$null
  if (-not $ok) {
    Write-Host "Starting MySQL..."
    Start-Process -FilePath "C:\xampp\mysql_start.bat" -WindowStyle Minimized
    Start-Sleep -Seconds 8
  }
}

# Health check
try {
  Invoke-RestMethod "http://localhost:3000/api/health" -TimeoutSec 2 | Out-Null
  Write-Host "Server already running on port 3000" -ForegroundColor Green
} catch {
  Write-Host "Starting server in new window..."
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; npm start"
  Start-Sleep -Seconds 4
}

Write-Host "`nOpening public tunnel (keep this window open)..." -ForegroundColor Yellow
Write-Host "Your public URL will appear below:`n"
node scripts/tunnel.js
