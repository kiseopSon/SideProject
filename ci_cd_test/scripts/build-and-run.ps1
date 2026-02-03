# 로컬 빌드 & 실행 (PowerShell)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent)

Write-Host "=== 이미지 빌드 ==="
docker build -t ecommerce-mvp:latest .
docker build -f Dockerfile.worker -t ecommerce-mvp-worker:latest .

Write-Host "=== Docker Compose 실행 ==="
docker compose up -d

Write-Host "=== 완료: http://localhost:3000 ==="
