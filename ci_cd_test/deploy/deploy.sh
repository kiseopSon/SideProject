#!/bin/bash
# 무중단 배포 스크립트 - Blue-Green 전환
# 사용법: ./deploy.sh [blue|green] [이미지태그]
# 예: ./deploy.sh green v1.0.1  → Green에 새 이미지 배포 후 트래픽 전환

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ACTIVE=${1:-blue}   # blue 또는 green
NEW_TAG=${2:-latest}
IMAGE_NAME=${IMAGE_NAME:-ecommerce-mvp}
IMAGE_WORKER_NAME=${IMAGE_WORKER_NAME:-ecommerce-mvp-worker}

# 새로 배포할 쪽 = 현재 비활성
if [ "$ACTIVE" = "blue" ]; then
  DEPLOY_TARGET="green"
  NGINX_CFG="nginx-green.conf"
else
  DEPLOY_TARGET="blue"
  NGINX_CFG="nginx-blue.conf"
fi

echo "=== 무중단 배포: $DEPLOY_TARGET 인스턴스 업데이트 후 전환 ==="
echo "현재 활성: $ACTIVE, 배포 대상: $DEPLOY_TARGET"
echo "이미지: $IMAGE_NAME:$NEW_TAG"

# 1. 비활성 인스턴스에 새 이미지로 업데이트
export IMAGE="${IMAGE_NAME}:${NEW_TAG}"
export IMAGE_WORKER="${IMAGE_WORKER_NAME}:${NEW_TAG}"

docker compose -f docker-compose.deploy.yml pull "$IMAGE" "$IMAGE_WORKER" 2>/dev/null || true
docker compose -f docker-compose.deploy.yml up -d "app_${DEPLOY_TARGET}" --no-deps
echo "app_${DEPLOY_TARGET} 시작됨, 헬스체크 대기..."

# 2. 헬스체크
for i in {1..30}; do
  if curl -sf http://localhost:80/health > /dev/null 2>&1; then
    echo "헬스체크 OK (로컬 테스트)"
    break
  fi
  sleep 2
  if [ $i -eq 30 ]; then
    echo "헬스체크 실패"
    exit 1
  fi
done

# 3. Nginx 설정 전환 (Blue <-> Green)
cp "$NGINX_CFG" nginx.conf
docker compose -f docker-compose.deploy.yml exec -T nginx nginx -s reload 2>/dev/null || \
  docker compose -f docker-compose.deploy.yml restart nginx

echo "=== 배포 완료: $DEPLOY_TARGET 활성화 ==="
