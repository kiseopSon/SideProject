# Inference 서버 실행 (가상환경 자동 활성화 + IDM-VTON 경로/ Python 고정)
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$InferenceDir = Join-Path $Root "inference"
$IdmRoot = Join-Path $Root "IDM-VTON"
$IdmPython = Join-Path $env:USERPROFILE "miniconda3\envs\idm\python.exe"
if (-not (Test-Path $IdmPython)) { $IdmPython = Join-Path $env:USERPROFILE "anaconda3\envs\idm\python.exe" }

Push-Location $InferenceDir
try {
    if (-not (Test-Path ".venv\Scripts\Activate.ps1")) {
        Write-Host "Creating virtual environment..." -ForegroundColor Yellow
        python -m venv .venv
        & ".venv\Scripts\Activate.ps1"
        pip install -q --upgrade pip
        pip install -q -r requirements.txt
    } else {
        & ".venv\Scripts\Activate.ps1"
    }
    if (Test-Path $IdmRoot) { $env:IDM_VTON_PATH = $IdmRoot }
    if (Test-Path $IdmPython) { $env:IDM_PYTHON = $IdmPython }
    # 메모리 안정화: CPU 스레드 제한
    $env:HF_HUB_DISABLE_SYMLINKS_WARNING = "1"
    $env:OMP_NUM_THREADS = "4"
    $env:MKL_NUM_THREADS = "4"
    Write-Host "Starting inference server..." -ForegroundColor Green
    Write-Host "Open http://localhost:8000 in your browser" -ForegroundColor Cyan
    python run.py
}
finally {
    Pop-Location
}
