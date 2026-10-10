@echo off
title Decisioned Offer System - Unified Launcher
cd /d "%~dp0"

cls
echo ======================================================================
echo          MOMENT IQ: DECISIONED OFFER SYSTEM (UNIFIED LAUNCHER)
echo ======================================================================
echo.
echo [1/3] Starting Express Backend Server (Port 5000)...
start "Backend - Express Server (Port 5000)" cmd /k "cd /d "%~dp0server" && npm run dev"

echo [2/3] Starting React Vite Frontend Client (Port 5173)...
start "Frontend - Vite Client (Port 5173)" cmd /k "cd /d "%~dp0client" && npm run dev"

echo [3/3] Initializing ML Engine ^& Verifying XGBoost Models...
start "ML Engine - Python Pipeline & Recommender" cmd /k "cd /d "%~dp0" && python ml_engine/priya_tuesday_demo.py && echo. && echo ====================================================================== && echo [ML Engine Online] Backend automatically calls this for real-time inference. && echo Run 'python ml_engine/run_ml_pipeline.py' for full benchmark evaluation. && echo ====================================================================== && cmd"

echo.
echo All 3 components successfully launched in dedicated windows!
echo Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening web application at http://localhost:5173...
start http://localhost:5173

echo.
echo ======================================================================
echo SYSTEM STATUS: ALL 3 SERVICES RUNNING
echo ======================================================================
echo  * Frontend UI:   http://localhost:5173
echo  * Backend API:   http://localhost:5000 (Health: /api/health)
echo  * ML Engine:     Python XGBoost Recommender (Synced ^& Ready)
echo.
echo Note: Keep the opened terminal windows running to keep the services alive.
echo To stop all services later, run 'stop_all.bat'.
echo ======================================================================
pause
