# Metrics Exporter 시작 스크립트
Write-Host "=== Metrics Exporter 시작 ===" -ForegroundColor Cyan

# 가상환경 확인 및 생성
if (-not (Test-Path "venv")) {
    Write-Host "가상환경 생성 중..." -ForegroundColor Yellow
    python -m venv venv
}

# 의존성 설치
Write-Host "의존성 설치 중..." -ForegroundColor Yellow
.\venv\Scripts\python.exe -m pip install -r requirements.txt

# 서비스 시작
Write-Host "Metrics Exporter 시작 중..." -ForegroundColor Green
.\venv\Scripts\python.exe main.py
