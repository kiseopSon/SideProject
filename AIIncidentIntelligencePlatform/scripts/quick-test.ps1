# Quick Test Script
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== Quick Test ===" -ForegroundColor Cyan
Write-Host ""

# 1. Ollama check
Write-Host "[1] Checking Ollama..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "[OK] Ollama server is running" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Ollama server not running" -ForegroundColor Yellow
    Write-Host "  Please install and start Ollama" -ForegroundColor Gray
}

# 2. Check model
Write-Host ""
Write-Host "[2] Checking model..." -ForegroundColor Yellow
try {
    $models = ollama list 2>&1
    if ($LASTEXITCODE -eq 0) {
        if ($models -match "deepseek-coder") {
            Write-Host "[OK] deepseek-coder model found" -ForegroundColor Green
        } else {
            Write-Host "[WARN] deepseek-coder model not found" -ForegroundColor Yellow
            Write-Host "  Run: ollama pull deepseek-coder:6.7b" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "[WARN] Cannot check models" -ForegroundColor Yellow
}

# 3. Test LLM service
Write-Host ""
Write-Host "[3] Testing LLM service..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    $data = $health.Content | ConvertFrom-Json
    Write-Host "[OK] LLM service is running" -ForegroundColor Green
    Write-Host "  Status: $($data.status)" -ForegroundColor Gray
    Write-Host "  Model: $($data.prompt_version)" -ForegroundColor Gray
} catch {
    Write-Host "[WARN] LLM service not running" -ForegroundColor Yellow
    Write-Host "  Start with: py scripts\start-llm-layer.ps1" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
