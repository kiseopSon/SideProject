# Metrics Exporter 설정 스크립트
Write-Host "=== Metrics Exporter 설정 ===" -ForegroundColor Cyan

$exporterDir = "metrics-exporter"

if (-not (Test-Path $exporterDir)) {
    Write-Host "오류: $exporterDir 디렉토리가 없습니다." -ForegroundColor Red
    exit 1
}

Write-Host "`n1. 가상 환경 생성 중..." -ForegroundColor Yellow
cd $exporterDir

if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "   ✓ 가상 환경 생성 완료" -ForegroundColor Green
} else {
    Write-Host "   ✓ 가상 환경 이미 존재" -ForegroundColor Green
}

Write-Host "`n2. 패키지 설치 중..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Write-Host "   ✓ 패키지 설치 완료" -ForegroundColor Green

Write-Host "`n3. 설정 완료!" -ForegroundColor Green
Write-Host "`n실행 방법:" -ForegroundColor Cyan
Write-Host "   cd $exporterDir" -ForegroundColor White
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "   python main.py" -ForegroundColor White
Write-Host "`n확인:" -ForegroundColor Cyan
Write-Host "   - Metrics: http://localhost:9093/metrics" -ForegroundColor White
Write-Host "   - Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "   - Grafana: http://localhost:3000" -ForegroundColor White

cd ..
