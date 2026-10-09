<#
.SYNOPSIS
    Watchtower V2 Local Launcher Script for Windows PowerShell
.DESCRIPTION
    Verifies Node.js/npm prerequisites, creates .env.local if missing,
    verifies dependencies, generates the Prisma client, and launches
    the application in your default browser.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Start-Watchtower.ps1
#>

[CmdletBinding()]
param()

$Host.UI.RawUI.WindowTitle = "Watchtower V2 Launcher"
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "            WATCHTOWER V2 - LOCAL LAUNCHER         " -ForegroundColor White
Write-Host "===================================================`n" -ForegroundColor Cyan

try {
    # 1. Verify Node.js and npm are available
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] Node.js is not found in your PATH." -ForegroundColor Red
        Write-Host "Please install Node.js 18+ from https://nodejs.org/ and try again." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }

    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] npm is not found in your PATH." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    # 2. Ensure environment configuration exists
    if (-not (Test-Path '.env.local') -and -not (Test-Path '.env')) {
        if (Test-Path '.env.example') {
            Write-Host "[*] Creating .env.local from .env.example template..." -ForegroundColor Yellow
            Copy-Item '.env.example' '.env.local'
            Write-Host "[!] Created .env.local. You can configure AI keys (GEMINI_API_KEY, GROQ_API_KEY) in .env.local.`n" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Neither .env.local, .env, nor .env.example was found." -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
    }

    # 3. Check and install dependencies if needed
    if (-not (Test-Path 'node_modules')) {
        Write-Host "[1/3] Installing dependencies (this may take a couple of minutes)..." -ForegroundColor Yellow
        & npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE."
        }
    } else {
        Write-Host "[1/3] Dependencies found in node_modules." -ForegroundColor Green
    }

    # 4. Generate Prisma client
    Write-Host "[2/3] Generating Prisma client..." -ForegroundColor Yellow
    & npm run db:generate
    if ($LASTEXITCODE -ne 0) {
        throw "Prisma client generation failed with exit code $LASTEXITCODE."
    }

    # 5. Launch browser and Next.js dev server
    Write-Host "[3/3] Launching Watchtower V2..." -ForegroundColor Green
    Write-Host "`n===================================================" -ForegroundColor Cyan
    Write-Host " Watchtower is starting at http://localhost:3000" -ForegroundColor White
    Write-Host " Press Ctrl+C in this window to stop the server." -ForegroundColor DarkGray
    Write-Host "===================================================`n" -ForegroundColor Cyan

    Start-Process 'http://localhost:3000'
    & npm run dev

} catch {
    Write-Host "`n[ERROR] An error occurred while launching Watchtower:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "`nPress Enter to exit"
    exit 1
}
