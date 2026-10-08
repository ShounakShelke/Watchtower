@echo off
setlocal
cd /d "%~dp0"

echo.
echo  WATCHTOWER V1 - LOCAL LAUNCHER
echo.

if not exist ".env.local" (
  echo ERROR: .env.local is missing.
  echo Copy .env.example to .env.local and configure DATABASE_URL first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :failed
)

echo Generating Prisma client...
call npm run db:generate
if errorlevel 1 goto :failed

echo.
echo Starting Watchtower at http://localhost:3000
echo Keep this window open while using Watchtower.
echo.
start "" http://localhost:3000
call npm run dev
exit /b %errorlevel%

:failed
echo.
echo Watchtower could not start. Review the error above.
pause
exit /b 1
