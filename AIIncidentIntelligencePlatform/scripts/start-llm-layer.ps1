# LLM 레이어 서비스 시작 스크립트
# 한글 인코딩 설정 (최우선)
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONIOENCODING = "utf-8"
chcp 65001 | Out-Null

Write-Host "=== LLM Layer Service Start ===" -ForegroundColor Cyan
Write-Host ""

$llmLayerPath = "llm-layer"

# 디렉토리 확인
if (-not (Test-Path $llmLayerPath)) {
    Write-Host "[ERROR] llm-layer directory not found" -ForegroundColor Red
    exit 1
}

Set-Location $llmLayerPath

# 가상 환경 확인
if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Virtual environment creation failed" -ForegroundColor Red
        exit 1
    }
}

# 의존성 설치
Write-Host "Installing dependencies..." -ForegroundColor Yellow
.\venv\Scripts\python.exe -m pip install --quiet --upgrade pip
.\venv\Scripts\python.exe -m pip install --quiet -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Dependency installation failed" -ForegroundColor Red
    exit 1
}

# Ollama 확인
Write-Host "Checking Ollama..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "[OK] Ollama server is running" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Ollama server not found" -ForegroundColor Yellow
    Write-Host "  Please install Ollama: https://ollama.com/download" -ForegroundColor Yellow
    Write-Host "  Then run: ollama pull llama3.2:3b" -ForegroundColor Yellow
}

# 서비스 시작
Write-Host ""
Write-Host "Starting LLM Layer service..." -ForegroundColor Green
Write-Host "Service URL: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
