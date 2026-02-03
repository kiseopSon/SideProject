@echo off
echo Checking Maven installation...
echo.

where mvn >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Maven found in PATH
    mvn --version
) else (
    echo [ERROR] Maven not found in PATH
    echo.
    echo Please install Maven:
    echo 1. Download from https://maven.apache.org/download.cgi
    echo 2. Extract to C:\Program Files\Apache\maven (or your preferred location)
    echo 3. Add Maven bin directory to PATH environment variable
    echo    (e.g., C:\Program Files\Apache\maven\bin)
    echo.
    echo Or use Maven Wrapper (mvnw) if available
)

echo.
pause
