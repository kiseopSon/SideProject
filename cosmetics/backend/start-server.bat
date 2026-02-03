@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.

REM Activate virtual environment if exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

REM Check and install required packages
echo Checking required packages...
python -m pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    python -m pip install -r requirements.txt
    echo.
) else (
    python -m pip show requests >nul 2>&1
    if errorlevel 1 (
        echo Missing requests package, installing...
        python -m pip install -r requirements.txt
        echo.
    )
)

echo.
echo Starting backend server...
echo Backend: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
