# IDM-VTON 설정 (무료, GPU). myDressRoom 루트에서 실행.
# conda가 이미 설치되어 있을 때만 사용. 없으면 setup-conda-and-idm.ps1 사용.
# 1) IDM-VTON 클론 (없으면)
# 2) conda env 'idm' 생성 (environment.yaml)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Idm = Join-Path $Root "IDM-VTON"

if (-not (Test-Path $Idm)) {
    Write-Host "Cloning IDM-VTON..."
    git clone --depth 1 https://github.com/yisol/IDM-VTON.git $Idm
} else {
    Write-Host "IDM-VTON already exists at $Idm"
}

$conda = $null
foreach ($c in @("conda", "$env:USERPROFILE\miniconda3\Scripts\conda.exe", "$env:USERPROFILE\anaconda3\Scripts\conda.exe")) {
    try { $null = Get-Command $c -ErrorAction Stop; $conda = $c; break } catch {}
}
if (-not $conda) {
    Write-Host "Conda not found. Install Miniconda/Anaconda and add to PATH, then run:"
    Write-Host "  cd $Idm"
    Write-Host "  conda env create -f environment.yaml"
    Write-Host "  conda activate idm"
    exit 1
}

Push-Location $Idm
try {
    $list = & $conda env list 2>&1
    if ($list | Select-String -Pattern "^\s*idm\s") {
        Write-Host "Conda env 'idm' already exists."
    } else {
        Write-Host "Creating conda env 'idm'..."
        & $conda env create -f environment.yaml
    }
    Write-Host "Done. Run: conda activate idm; cd inference; python run.py"
}
finally {
    Pop-Location
}
