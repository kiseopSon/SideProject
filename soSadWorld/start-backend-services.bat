@echo off
chcp 949 >nul
REM soSadWorld Backend Services Startup Script
REM Starts all Spring Boot services in separate windows

REM Set JAVA_HOME to Java 17 if not already set
if not defined JAVA_HOME (
    set "JAVA_HOME=C:\Program Files\Java\jdk-17"
)
if exist "%JAVA_HOME%\bin\java.exe" (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
    echo Using Java 17 from: %JAVA_HOME%
) else (
    echo Warning: Java 17 not found at %JAVA_HOME%
    echo Please set JAVA_HOME to Java 17 installation directory
)

echo === soSadWorld Backend Services Starting ===

cd /d "%~dp0"

set "JAVA_HOME_DIR=C:\Program Files\Java\jdk-17"
set "PROJECT_ROOT=%~dp0"
set "LOG_DIR=%PROJECT_ROOT%logs"

REM Create logs directory if it doesn't exist
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo.
echo [1/4] Starting Diary Service... (Port 8081)
start "Diary Service (Port 8081)" cmd /k "set "JAVA_HOME=%JAVA_HOME_DIR%" && set "PATH=%JAVA_HOME_DIR%\bin;%PATH%" && set "LOGGING_FILE_NAME=%LOG_DIR%\diary-service.log" && cd /d %~dp0diary-service && gradlew.bat bootRun"

timeout /t 2 /nobreak >nul

echo [2/4] Starting AI Analysis Service... (Port 8082)
start "AI Analysis Service (Port 8082)" cmd /k "set "JAVA_HOME=%JAVA_HOME_DIR%" && set "PATH=%JAVA_HOME_DIR%\bin;%PATH%" && set "LOGGING_FILE_NAME=%LOG_DIR%\ai-analysis-service.log" && cd /d %~dp0ai-analysis-service && gradlew.bat bootRun"

timeout /t 2 /nobreak >nul

echo [3/4] Starting Analysis Result Service... (Port 8083)
start "Analysis Result Service (Port 8083)" cmd /k "set "JAVA_HOME=%JAVA_HOME_DIR%" && set "PATH=%JAVA_HOME_DIR%\bin;%PATH%" && set "LOGGING_FILE_NAME=%LOG_DIR%\analysis-result-service.log" && cd /d %~dp0analysis-result-service && gradlew.bat bootRun"

timeout /t 2 /nobreak >nul

echo [4/4] Starting Gateway Service... (Port 8080)
start "Gateway Service (Port 8080)" cmd /k "set "JAVA_HOME=%JAVA_HOME_DIR%" && set "PATH=%JAVA_HOME_DIR%\bin;%PATH%" && set "LOGGING_FILE_NAME=%LOG_DIR%\gateway-service.log" && cd /d %~dp0gateway-service && gradlew.bat bootRun"

echo.
echo === All services have been started ===
echo Each service is running in a separate window.
echo.
echo Service Ports:
echo   - Gateway Service: http://localhost:8080
echo   - Diary Service: http://localhost:8081
echo   - AI Analysis Service: http://localhost:8082
echo   - Analysis Result Service: http://localhost:8083
echo.
echo To stop services, close each window.
echo.
pause
