@echo off
REM soSadWorld 백엔드 서비스 중지 스크립트 (배치 파일 버전)

echo === soSadWorld 백엔드 서비스 중지 ===
echo.
echo 실행 중인 Java 프로세스를 중지합니다...

REM Java 프로세스 중지 (포트 8080-8083 사용 중인 프로세스)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 :8081 :8082 :8083"') do (
    echo PID %%a 프로세스 중지 중...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo 서비스 중지 완료.
pause
