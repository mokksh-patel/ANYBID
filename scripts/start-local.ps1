# Start XAMPP MySQL if not running, then AnyBid
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$mysqlExe = "C:\xampp\mysql\bin\mysql.exe"
if (-not (Test-Path $mysqlExe)) {
  Write-Host "XAMPP MySQL not found at C:\xampp. Start MySQL manually or install XAMPP."
  exit 1
}

try {
  & $mysqlExe -u root -e "SELECT 1" 2>$null | Out-Null
  Write-Host "MySQL is running."
} catch {
  Write-Host "Starting XAMPP MySQL..."
  Start-Process -FilePath "C:\xampp\mysql_start.bat" -WindowStyle Minimized
  Start-Sleep -Seconds 8
}

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-Host "Starting AnyBid at http://localhost:3000"
node server/index.js
