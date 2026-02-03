@echo off
echo 정규식 생성기 실행 파일 생성 중...
echo.

REM Python 버전 확인
py --version
if errorlevel 1 (
    echo 오류: Python을 찾을 수 없습니다.
    pause
    exit /b 1
)

REM 가상환경이 있으면 활성화
if exist venv\Scripts\activate.bat (
    echo 가상환경 활성화 중...
    call venv\Scripts\activate.bat
)

REM 필요한 패키지 설치
echo 필요한 패키지 설치 중...
py -m pip install -r requirements.txt
if errorlevel 1 (
    echo 오류: 패키지 설치에 실패했습니다.
    pause
    exit /b 1
)

REM PyInstaller로 실행 파일 생성
echo 실행 파일 생성 중...
py -m PyInstaller --onefile --windowed --name=RegexGenerator main.py
if errorlevel 1 (
    echo 오류: 빌드에 실패했습니다.
    pause
    exit /b 1
)

echo.
echo 빌드 완료!
echo 실행 파일 위치: dist\RegexGenerator.exe
pause
