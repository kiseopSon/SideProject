# 무중단 배포 스크립트 (PowerShell) - Blue-Green 전환
# 사용법: .\deploy.ps1 [blue|green] [이미지태그]

param(
    [string]$Active = "blue",
    [string]$NewTag = "latest"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$ImageName = if ($env:IMAGE_NAME) { $env:IMAGE_NAME } else { "ecommerce-mvp" }
$ImageWorkerName = if ($env:IMAGE_WORKER_NAME) { $env:IMAGE_WORKER_NAME } else { "ecommerce-mvp-worker" }

if ($Active -eq "blue") {
    $DeployTarget = "green"
    $NginxCfg = "nginx-green.conf"
} else {
    $DeployTarget = "blue"
    $NginxCfg = "nginx-blue.conf"
}

Write-Host "=== Blue-Green deploy: updating app_$DeployTarget then switch ==="
Write-Host "Active: $Active, Deploy target: $DeployTarget"
Write-Host "Image: $ImageName`:$NewTag"

$env:IMAGE = "${ImageName}:${NewTag}"
$env:IMAGE_WORKER = "${ImageWorkerName}:${NewTag}"

# 1. Update inactive instance
docker compose -f docker-compose.deploy.yml up -d "app_$DeployTarget" --no-deps
Write-Host "app_$DeployTarget started, waiting for health check..."

# 2. Health check: copy healthcheck.js and run inside the container (no extra image)
for ($i = 1; $i -le 30; $i++) {
    $cid = docker compose -f docker-compose.deploy.yml ps -q "app_$DeployTarget" 2>$null
    if ($cid) {
        docker cp healthcheck.js "${cid}:/tmp/healthcheck.js" 2>&1 | Out-Null
        docker compose -f docker-compose.deploy.yml exec -T "app_$DeployTarget" node /tmp/healthcheck.js 2>&1 | Out-Null
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Health check OK"
        break
    }
    Start-Sleep -Seconds 2
    if ($i -eq 30) {
        Write-Host "Health check failed (app_$DeployTarget not responding)"
        exit 1
    }
}

# 3. Switch Nginx to new instance
Copy-Item $NginxCfg nginx.conf -Force
docker compose -f docker-compose.deploy.yml restart nginx

Write-Host "=== Deploy done: $DeployTarget is now active ==="
