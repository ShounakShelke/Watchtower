@echo off
setlocal enabledelayedexpansion
title Watchtower V2 Launcher
cd /d "%~dp0"

echo ===================================================
echo             WATCHTOWER V2 - LOCAL LAUNCHER         
echo ===================================================
echo.

:: 1. Verify Node.js and npm are available
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not found in your PATH.
  echo Please install Node.js 18+ from https://nodejs.org/ and try again.
  goto :failed
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not found in your PATH.
  goto :failed
)

:: 2. Ensure environment configuration exists
if not exist ".env.local" (
  if not exist ".env" (
    if exist ".env.example" (
      echo [*] Creating .env.local from .env.example template...
      copy /y ".env.example" ".env.local" >nul
      echo [!] Created .env.local. You can configure AI keys (GEMINI_API_KEY, GROQ_API_KEY) in .env.local.
      echo.
    ) else (
      echo [ERROR] Neither .env.local, .env, nor .env.example was found.
      goto :failed
    )
  )
)

:: 3. Check and install dependencies if needed
if not exist "node_modules" (
  echo [1/3] Installing dependencies (this may take a couple of minutes)...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    goto :failed
  )
) else (
  echo [1/3] Dependencies found in node_modules.
)

:: 4. Generate Prisma client
echo [2/3] Generating Prisma client...
call npm run db:generate
if errorlevel 1 (
  echo [ERROR] Prisma client generation failed.
  goto :failed
)

:: 5. Launch browser and Next.js dev server
echo [3/3] Launching Watchtower V2...
echo.
echo ===================================================
echo  Watchtower is starting at http://localhost:3000
echo  Press Ctrl+C in this window to stop the server.
echo ===================================================
echo.

start "" http://localhost:3000
call npm run dev
if errorlevel 1 goto :failed

exit /b 0

:failed
echo.
echo [ERROR] Watchtower V2 could not start or exited unexpectedly.
pause
exit /b 1
