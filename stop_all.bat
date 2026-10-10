@echo off
title Stop All Services
echo ======================================================================
echo Stopping Decisioned Offer System Services (Ports 5000 and 5173)...
echo ======================================================================

:: Kill processes listening on Port 5000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Stopping backend process PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

:: Kill processes listening on Port 5173 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Stopping frontend process PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo [OK] All backend, frontend, and development processes have been stopped.
echo ======================================================================
pause
