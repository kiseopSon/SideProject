# AI Incident Intelligence Platform - 서비스 실행 스크립트
# Windows PowerShell용

Write-Host "=== AI Incident Intelligence Platform 서비스 실행 ===" -ForegroundColor Cyan
Write-Host ""

# .env 파일 확인
if (-not (Test-Path ".env")) {
    Write-Host "[경고] .env 파일이 없습니다. env.example을 복사하여 .env 파일을 생성하세요." -ForegroundColor Yellow
    Write-Host "  Copy-Item env.example .env" -ForegroundColor Gray
    Write-Host ""
}

# 서비스 실행 함수
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [string]$Command
    )
    
    Write-Host "[$ServiceName] 시작 중..." -ForegroundColor Yellow
    
    if (-not (Test-Path "$ServicePath\venv")) {
        Write-Host "  [오류] 가상환경이 없습니다. 먼저 setup.ps1을 실행하세요." -ForegroundColor Red
        return $false
    }
    
    # 새 PowerShell 창에서 서비스 실행
    $script = @"
cd '$PWD\$ServicePath'
& '.\venv\Scripts\Activate.ps1'
$Command
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $script
    Write-Host "  [$ServiceName] 새 창에서 실행 중..." -ForegroundColor Green
    
    return $true
}

Write-Host "다음 서비스들을 실행할까요?" -ForegroundColor Cyan
Write-Host "1. Event Processor"
Write-Host "2. LLM Layer"
Write-Host "3. Notification Service"
Write-Host "4. 모두 실행"
Write-Host ""
$choice = Read-Host "선택 (1-4)"

switch ($choice) {
    "1" {
        Start-Service -ServiceName "Event Processor" -ServicePath "event-processor" -Command "python main.py"
    }
    "2" {
        Start-Service -ServiceName "LLM Layer" -ServicePath "llm-layer" -Command "uvicorn main:app --reload --port 8000"
    }
    "3" {
        Start-Service -ServiceName "Notification Service" -ServicePath "notification" -Command "python main.py"
    }
    "4" {
        Start-Service -ServiceName "Event Processor" -ServicePath "event-processor" -Command "python main.py"
        Start-Sleep -Seconds 2
        Start-Service -ServiceName "LLM Layer" -ServicePath "llm-layer" -Command "uvicorn main:app --reload --port 8000"
        Start-Sleep -Seconds 2
        Start-Service -ServiceName "Notification Service" -ServicePath "notification" -Command "python main.py"
        Write-Host ""
        Write-Host "모든 서비스가 새 창에서 실행되었습니다." -ForegroundColor Green
    }
    default {
        Write-Host "잘못된 선택입니다." -ForegroundColor Red
    }
}
