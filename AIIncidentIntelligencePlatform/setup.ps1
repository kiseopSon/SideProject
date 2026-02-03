# AI Incident Intelligence Platform - 설정 스크립트
# Windows PowerShell용

Write-Host "=== AI Incident Intelligence Platform 설정 ===" -ForegroundColor Cyan
Write-Host ""

# 가상환경 생성 및 패키지 설치 함수
function Setup-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath
    )
    
    Write-Host "[$ServiceName] 설정 중..." -ForegroundColor Yellow
    
    # 디렉토리로 이동
    Push-Location $ServicePath
    
    # 가상환경 생성
    if (-not (Test-Path "venv")) {
        Write-Host "  가상환경 생성 중..." -ForegroundColor Gray
        python -m venv venv
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [오류] 가상환경 생성 실패" -ForegroundColor Red
            Pop-Location
            return $false
        }
    } else {
        Write-Host "  가상환경이 이미 존재합니다." -ForegroundColor Gray
    }
    
    # 가상환경 활성화
    Write-Host "  가상환경 활성화 중..." -ForegroundColor Gray
    & ".\venv\Scripts\Activate.ps1"
    
    # 패키지 설치
    Write-Host "  패키지 설치 중..." -ForegroundColor Gray
    pip install --upgrade pip
    pip install -r requirements.txt
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [오류] 패키지 설치 실패" -ForegroundColor Red
        Pop-Location
        return $false
    }
    
    Write-Host "  [$ServiceName] 설정 완료!" -ForegroundColor Green
    Write-Host ""
    
    Pop-Location
    return $true
}

# 각 서비스 설정
$services = @(
    @{Name="Event Processor"; Path="event-processor"},
    @{Name="LLM Layer"; Path="llm-layer"},
    @{Name="Notification Service"; Path="notification"}
)

$allSuccess = $true

foreach ($service in $services) {
    if (-not (Test-Path $service.Path)) {
        Write-Host "[경고] $($service.Path) 디렉토리를 찾을 수 없습니다." -ForegroundColor Yellow
        continue
    }
    
    $result = Setup-Service -ServiceName $service.Name -ServicePath $service.Path
    if (-not $result) {
        $allSuccess = $false
    }
}

Write-Host ""
if ($allSuccess) {
    Write-Host "=== 모든 서비스 설정 완료! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "다음 단계:" -ForegroundColor Cyan
    Write-Host "1. .env 파일을 열어 SLACK_WEBHOOK_URL 설정 (Ollama는 자동 설정됨)"
    Write-Host "2. docker-compose up -d 로 인프라 실행"
    Write-Host "3. 각 서비스 디렉토리에서 다음 명령으로 실행:"
    Write-Host "   - Event Processor: python main.py"
    Write-Host "   - LLM Layer: uvicorn main:app --reload --port 8000"
    Write-Host "   - Notification: python main.py"
} else {
    Write-Host "=== 일부 서비스 설정 중 오류가 발생했습니다 ===" -ForegroundColor Red
}
