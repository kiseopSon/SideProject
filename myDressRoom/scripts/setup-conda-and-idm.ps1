# Conda + IDM-VTON 전체 설정 (무료, GPU). myDressRoom 루트에서 실행.
# 1) Miniconda 자동 설치 (없으면)
# 2) IDM-VTON 클론 (없으면)
# 3) conda env 'idm' 생성 (environment.yaml)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Idm = Join-Path $Root "IDM-VTON"

# 1. Conda 설치 확인 및 자동 설치
function Install-Miniconda {
    $condaPaths = @(
        "conda",
        "$env:USERPROFILE\miniconda3\Scripts\conda.exe",
        "$env:USERPROFILE\anaconda3\Scripts\conda.exe",
        "$env:LOCALAPPDATA\miniconda3\Scripts\conda.exe",
        "$env:ProgramData\miniconda3\Scripts\conda.exe"
    )
    
    foreach ($c in $condaPaths) {
        try {
            $null = Get-Command $c -ErrorAction Stop
            Write-Host "Conda found: $c" -ForegroundColor Green
            return $c
        } catch {}
    }
    
    Write-Host "Conda not found. Installing Miniconda..." -ForegroundColor Yellow
    
    $installer = Join-Path $env:TEMP "Miniconda3-latest-Windows-x86_64.exe"
    $minicondaUrl = "https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe"
    
    if (-not (Test-Path $installer)) {
        Write-Host "Downloading Miniconda..." -ForegroundColor Yellow
        try {
            Invoke-WebRequest -Uri $minicondaUrl -OutFile $installer -UseBasicParsing
        } catch {
            Write-Host "Failed to download Miniconda. Please download manually from:" -ForegroundColor Red
            Write-Host "  $minicondaUrl" -ForegroundColor Yellow
            exit 1
        }
    }
    
    Write-Host "Installing Miniconda (this may take a few minutes)..." -ForegroundColor Yellow
    $installDir = "$env:USERPROFILE\miniconda3"
    $installArgs = @(
        "/S",  # Silent install
        "/InstallationType=JustMe",
        "/AddToPath=0",  # We'll add manually
        "/RegisterPython=1",
        "/D=$installDir"
    )
    
    $proc = Start-Process -FilePath $installer -ArgumentList $installArgs -Wait -PassThru -NoNewWindow
    if ($proc.ExitCode -ne 0) {
        Write-Host "Miniconda installation failed. Exit code: $($proc.ExitCode)" -ForegroundColor Red
        exit 1
    }
    
    # PATH에 추가 (현재 세션)
    $condaBin = "$installDir\Scripts"
    $condaLib = "$installDir\Library\bin"
    if ($env:PATH -notlike "*$condaBin*") {
        $env:PATH = "$condaBin;$condaLib;$env:PATH"
    }
    
    # 시스템 PATH에도 추가 (영구)
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$condaBin*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$condaBin;$condaLib", "User")
        Write-Host "Added Miniconda to PATH. Please restart PowerShell or run: `$env:PATH = [Environment]::GetEnvironmentVariable('Path', 'User')" -ForegroundColor Yellow
    }
    
    # conda 초기화
    Write-Host "Initializing conda..." -ForegroundColor Yellow
    & "$condaBin\conda.exe" init powershell --quiet 2>&1 | Out-Null
    
    # TOS 수락 (필수)
    Write-Host "Accepting conda Terms of Service..." -ForegroundColor Yellow
    & "$condaBin\conda.exe" tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main 2>&1 | Out-Null
    & "$condaBin\conda.exe" tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r 2>&1 | Out-Null
    & "$condaBin\conda.exe" tos accept --override-channels --channel https://repo.anaconda.com/pkgs/msys2 2>&1 | Out-Null
    
    # 새 PATH로 conda 찾기
    Start-Sleep -Seconds 2
    $env:PATH = [Environment]::GetEnvironmentVariable("Path", "User")
    
    if (Test-Path "$condaBin\conda.exe") {
        Write-Host "Miniconda installed successfully!" -ForegroundColor Green
        return "$condaBin\conda.exe"
    } else {
        Write-Host "Conda installation completed but conda.exe not found. Please restart PowerShell." -ForegroundColor Yellow
        Write-Host "Then run this script again." -ForegroundColor Yellow
        exit 1
    }
}

$conda = Install-Miniconda

# 2. IDM-VTON 클론
if (-not (Test-Path $Idm)) {
    Write-Host "Cloning IDM-VTON..." -ForegroundColor Yellow
    git clone --depth 1 https://github.com/yisol/IDM-VTON.git $Idm
} else {
    Write-Host "IDM-VTON already exists at $Idm" -ForegroundColor Green
}

# 3. Conda env 생성
Push-Location $Idm
try {
    Write-Host "Checking conda env 'idm'..." -ForegroundColor Yellow
    $envList = & $conda env list 2>&1
    if ($envList | Select-String -Pattern "^\s*idm\s") {
        Write-Host "Conda env 'idm' already exists." -ForegroundColor Green
    } else {
        Write-Host "Creating conda env 'idm' (this will take 10-20 minutes)..." -ForegroundColor Yellow
        Write-Host "Installing PyTorch, CUDA, and dependencies..." -ForegroundColor Yellow
        & $conda env create -f environment.yaml
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to create conda env. Check errors above." -ForegroundColor Red
            exit 1
        }
        Write-Host "Conda env 'idm' created successfully!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Green
    Write-Host "Setup complete!" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Restart PowerShell (to load conda PATH)" -ForegroundColor White
    Write-Host "  2. cd inference" -ForegroundColor White
    Write-Host "  3. python run.py" -ForegroundColor White
    Write-Host ""
    Write-Host "Or activate conda env manually:" -ForegroundColor Cyan
    Write-Host "  conda activate idm" -ForegroundColor White
    Write-Host "  cd inference" -ForegroundColor White
    Write-Host "  python run.py" -ForegroundColor White
}
finally {
    Pop-Location
}
