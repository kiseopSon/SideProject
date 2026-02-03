# Fix .env and restart service
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== .env 파일 수정 및 서비스 재시작 ===" -ForegroundColor Cyan
Write-Host ""

# 1. .env 파일 확인 및 수정
Write-Host "[1] .env 파일 확인..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $content = Get-Content .env -Raw
    if ($content -notmatch "OLLAMA_MODEL=deepseek-coder:6.7b") {
        if ($content -match "OLLAMA_MODEL=") {
            $content = $content -replace "OLLAMA_MODEL=.*", "OLLAMA_MODEL=deepseek-coder:6.7b"
        } else {
            if ($content -notmatch "OLLAMA_BASE_URL") {
                $content = "# Ollama`nOLLAMA_BASE_URL=http://localhost:11434`nOLLAMA_MODEL=deepseek-coder:6.7b`n`n" + $content
            } else {
                $content = $content -replace "(OLLAMA_BASE_URL=.*)", "`$1`nOLLAMA_MODEL=deepseek-coder:6.7b"
            }
        }
        Set-Content -Path ".env" -Value $content -NoNewline
        Write-Host "[OK] .env 파일 업데이트 완료" -ForegroundColor Green
    } else {
        Write-Host "[OK] .env 파일 이미 올바르게 설정됨" -ForegroundColor Green
    }
} else {
    Copy-Item env.example .env
    Write-Host "[OK] .env 파일 생성 완료" -ForegroundColor Green
}

# 2. 기존 서비스 종료
Write-Host ""
Write-Host "[2] 기존 서비스 종료..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*uvicorn*" -or 
    $_.CommandLine -like "*main:app*" -or
    $_.Path -like "*llm-layer*"
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "[OK] 기존 서비스 종료 완료" -ForegroundColor Green

# 3. 서비스 시작
Write-Host ""
Write-Host "[3] 서비스 시작..." -ForegroundColor Yellow
Write-Host "  새 창에서 서비스가 시작됩니다" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; py scripts\start-llm-layer.ps1"
Start-Sleep -Seconds 10

# 4. 서비스 확인
Write-Host ""
Write-Host "[4] 서비스 상태 확인..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $data = $health.Content | ConvertFrom-Json
    Write-Host "[OK] 서비스 실행 중!" -ForegroundColor Green
    Write-Host "  Status: $($data.status)" -ForegroundColor White
} catch {
    Write-Host "[WARN] 서비스가 아직 시작되지 않았습니다" -ForegroundColor Yellow
    Write-Host "  잠시 후 http://localhost:8000 에서 확인해주세요" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== 완료 ===" -ForegroundColor Green
Write-Host "  서비스가 새 창에서 실행 중입니다" -ForegroundColor White
Write-Host "  테스트: py scripts\test-classify-only.py" -ForegroundColor Cyan
