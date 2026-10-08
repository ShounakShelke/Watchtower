[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "`nWATCHTOWER V1 - LOCAL LAUNCHER`n" -ForegroundColor White

if (-not (Test-Path '.env.local')) {
  Write-Host 'ERROR: .env.local is missing.' -ForegroundColor Red
  Write-Host 'Copy .env.example to .env.local and configure DATABASE_URL first.'
  Read-Host 'Press Enter to exit'
  exit 1
}

if (-not (Test-Path 'node_modules')) {
  Write-Host 'Installing dependencies...' -ForegroundColor Yellow
  npm install
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
}

Write-Host 'Generating Prisma client...' -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -ne 0) { throw 'Prisma client generation failed.' }

Write-Host "`nStarting Watchtower at http://localhost:3000" -ForegroundColor Green
Write-Host 'Keep this window open while using Watchtower.' -ForegroundColor DarkGray
Start-Process 'http://localhost:3000'
npm run dev
