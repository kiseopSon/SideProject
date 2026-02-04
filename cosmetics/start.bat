@echo off
echo ========================================
echo Starting Cosmetics Ingredient Analyzer
echo ========================================
echo.

REM Start backend server
cd backend
echo Starting backend server...
REM Activate virtual environment if exists
if exist "venv\Scripts\activate.bat" (
    start "Backend Server (Port 8500)" cmd /k "venv\Scripts\activate.bat && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8500"
) else (
    start "Backend Server (Port 8500)" cmd /k "python -m uvicorn main:app --reload --host 127.0.0.1 --port 8500"
)
timeout /t 2 /nobreak >nul

REM Start frontend server
cd ..\frontend
echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Servers started!
echo ========================================
echo Backend: http://localhost:8500
echo Backend API Docs: http://localhost:8500/docs
echo Frontend: http://127.0.0.1:9005 (or check the terminal for actual port)
echo.
echo Close each window to stop the server.
echo.
pause
