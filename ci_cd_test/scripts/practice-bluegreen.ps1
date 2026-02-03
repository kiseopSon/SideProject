# Blue-Green 배포 로컬 연습 스크립트
# 사용법: .\scripts\practice-bluegreen.ps1 [init|deploy]

param([string]$Action = "init")

$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$DeployDir = Join-Path $RootDir "deploy"

function Init {
    Write-Host "=== 1. Build images ===" -ForegroundColor Cyan
    Set-Location $RootDir
    docker build -t ecommerce-mvp:latest .
    docker build -f Dockerfile.worker -t ecommerce-mvp-worker:latest .

    Write-Host "`n=== 2. Start Blue-Green stack ===" -ForegroundColor Cyan
    Set-Location $DeployDir
    Copy-Item nginx-blue.conf nginx.conf -Force
    $env:IMAGE = "ecommerce-mvp:latest"
    $env:IMAGE_WORKER = "ecommerce-mvp-worker:latest"
    docker compose -f docker-compose.deploy.yml up -d

    Write-Host "`nDone. Open http://localhost:80" -ForegroundColor Green
}

function Deploy {
    param([string]$Tag = "latest")
    Write-Host "=== Deploy new version (Blue-Green switch) ===" -ForegroundColor Cyan
    Write-Host "Build images from project root first:" -ForegroundColor Yellow
    Write-Host "  docker build -t ecommerce-mvp:$Tag ." -ForegroundColor Gray
    Write-Host "  docker build -f Dockerfile.worker -t ecommerce-mvp-worker:$Tag ." -ForegroundColor Gray
    Set-Location $DeployDir
    $env:IMAGE = "ecommerce-mvp:$Tag"
    $env:IMAGE_WORKER = "ecommerce-mvp-worker:$Tag"
    & "$DeployDir\deploy.ps1" green $Tag
}

Set-Location $RootDir
switch ($Action) {
    "init"   { Init }
    "deploy" { Deploy }
    default  {
        Write-Host "Usage: .\practice-bluegreen.ps1 init   # first-time setup"
        Write-Host "       .\practice-bluegreen.ps1 deploy  # deploy new version (build images first)"
    }
}
