# -*- coding: utf-8 -*-
# Ollama 설치 및 설정 스크립트

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Ollama Setup Script (FREE LLM)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Ollama 설치 확인
Write-Host "[1] Checking Ollama installation..." -ForegroundColor Yellow
try {
    $ollamaVersion = ollama --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Ollama is installed: $ollamaVersion" -ForegroundColor Green
    } else {
        throw "Ollama not found"
    }
} catch {
    Write-Host "[ERROR] Ollama is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Ollama:" -ForegroundColor Yellow
    Write-Host "  1. Visit: https://ollama.com/download" -ForegroundColor White
    Write-Host "  2. Download and install for Windows" -ForegroundColor White
    Write-Host "  3. Run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Ollama 서버 확인
Write-Host ""
Write-Host "[2] Checking Ollama server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Ollama server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARNING] Ollama server not running. Starting..." -ForegroundColor Yellow
    Write-Host "  (Ollama should start automatically after installation)" -ForegroundColor Gray
    Write-Host "  If not, run: ollama serve" -ForegroundColor Gray
}

# 모델 확인 및 다운로드
Write-Host ""
Write-Host "[3] Checking models..." -ForegroundColor Yellow
$model = "llama3.2:3b"

try {
    $models = ollama list 2>&1
    if ($models -match $model) {
        Write-Host "[OK] Model '$model' is already installed" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Model '$model' not found. Downloading..." -ForegroundColor Yellow
        Write-Host "  (This may take a few minutes, ~4GB download)" -ForegroundColor Gray
        ollama pull $model
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Model downloaded successfully" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Failed to download model" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "[ERROR] Failed to check models: $_" -ForegroundColor Red
    exit 1
}

# .env 파일 업데이트
Write-Host ""
Write-Host "[4] Updating .env file..." -ForegroundColor Yellow
$envFile = ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # LLM_PROVIDER 설정
    if ($content -match "LLM_PROVIDER=") {
        $content = $content -replace "LLM_PROVIDER=.*", "LLM_PROVIDER=ollama"
    } else {
        $content += "`nLLM_PROVIDER=ollama`n"
    }
    
    # OLLAMA 설정 추가
    if ($content -notmatch "OLLAMA_BASE_URL=") {
        $content += "OLLAMA_BASE_URL=http://localhost:11434`n"
    }
    if ($content -notmatch "OLLAMA_MODEL=") {
        $content += "OLLAMA_MODEL=llama3.2:3b`n"
    }
    
    Set-Content -Path $envFile -Value $content -NoNewline
    Write-Host "[OK] .env file updated" -ForegroundColor Green
} else {
    Write-Host "[WARNING] .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        $content = Get-Content ".env" -Raw
        $content = $content -replace "LLM_PROVIDER=.*", "LLM_PROVIDER=ollama"
        Set-Content -Path ".env" -Value $content -NoNewline
        Write-Host "[OK] .env file created" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] .env.example not found" -ForegroundColor Red
    }
}

# 테스트
Write-Host ""
Write-Host "[5] Testing Ollama connection..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "http://localhost:11434/api/generate" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            model = $model
            prompt = "Say hello in one word"
            stream = $false
        } | ConvertTo-Json) `
        -UseBasicParsing `
        -TimeoutSec 10
    
    if ($testResponse.StatusCode -eq 200) {
        Write-Host "[OK] Ollama is working correctly!" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARNING] Test request failed (this is OK if server just started)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "[OK] Ollama setup complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start LLM service: py scripts\start-llm-layer.ps1" -ForegroundColor White
Write-Host "  2. Run test: py scripts\test-classify-only.py" -ForegroundColor White
Write-Host ""
Write-Host "Note: Ollama is completely FREE!" -ForegroundColor Green
Write-Host ""
