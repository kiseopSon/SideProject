#!/bin/bash
# 로컬 빌드 & 실행 (개발용)
set -e
cd "$(dirname "$0")/.."

echo "=== 이미지 빌드 ==="
docker build -t ecommerce-mvp:latest .
docker build -f Dockerfile.worker -t ecommerce-mvp-worker:latest .

echo "=== Docker Compose 실행 ==="
docker compose up -d

echo "=== 완료: http://localhost:3000 ==="
