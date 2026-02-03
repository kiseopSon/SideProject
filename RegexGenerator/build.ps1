# PowerShell 빌드 스크립트
Write-Host "정규식 생성기 실행 파일 생성 중..." -ForegroundColor Green
Write-Host ""

# Python 버전 확인
try {
    $pythonVersion = py --version
    Write-Host "Python 버전: $pythonVersion" -ForegroundColor Cyan
} catch {
    Write-Host "오류: Python을 찾을 수 없습니다. 'py' 명령어로 Python을 설치해주세요." -ForegroundColor Red
    exit 1
}

# 가상환경이 있으면 활성화
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "가상환경 활성화 중..." -ForegroundColor Cyan
    & "venv\Scripts\Activate.ps1"
}

# 필요한 패키지 설치
Write-Host "필요한 패키지 설치 중..." -ForegroundColor Cyan
py -m pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "오류: 패키지 설치에 실패했습니다." -ForegroundColor Red
    exit 1
}

# PyInstaller로 실행 파일 생성
Write-Host "실행 파일 생성 중..." -ForegroundColor Cyan
py -m PyInstaller --onefile --windowed --name=RegexGenerator main.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "빌드 완료!" -ForegroundColor Green
    Write-Host "실행 파일 위치: dist\RegexGenerator.exe" -ForegroundColor Yellow
} else {
    Write-Host "오류: 빌드에 실패했습니다." -ForegroundColor Red
    exit 1
}

if (-not $env:CI) {
    Read-Host "Press Enter to continue"
}
