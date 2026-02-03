# 이커머스 MVP - Redis · Docker · 무중단 배포 연습

이커머스 도메인 기반 MVP로 다음을 연습할 수 있습니다.

- **Redis**: 캐시, Bull 큐(비동기/배치)
- **Docker**: 로컬 실행, 이미지 빌드
- **배포 자동화**: GitHub Actions CI/CD
- **무중단 배포**: Blue-Green, Rolling Update

## 요구사항

- Node.js 18+
- Docker, Docker Compose
- Git

> **Windows 참고**: `better-sqlite3`는 네이티브 빌드가 필요합니다. 로컬에서 `npm install`이 실패하면 Docker로 실행하세요 (`docker compose up -d`).

## 빠른 시작

### 1. 로컬 실행 (Docker 없이)

```bash
npm install
npm run db:init
# Redis를 먼저 실행: docker run -d -p 6379:6379 redis:7-alpine
npm run dev        # 터미널 1
npm run worker     # 터미널 2
```

- http://localhost:3000 - 웹 UI
- http://localhost:3000/api/products - 상품 API (캐시)
- http://localhost:3000/api/orders - 주문 API (큐)

### 2. Docker Compose로 실행

```bash
docker compose up -d
```

- http://localhost:3000

### 3. Blue-Green 무중단 배포 테스트

```bash
# 1) 이미지 빌드
docker build -t ecommerce-mvp:latest .
docker build -f Dockerfile.worker -t ecommerce-mvp-worker:latest .

# 2) 배포 디렉터리로 이동
cd deploy
cp nginx-blue.conf nginx.conf

# 3) Blue-Green 구성 실행 (PowerShell)
$env:IMAGE = "ecommerce-mvp:latest"
$env:IMAGE_WORKER = "ecommerce-mvp-worker:latest"
docker compose -f docker-compose.deploy.yml up -d

# 4) http://localhost:80 접속 확인

# 5) Green에 새 버전 배포 후 전환 (Windows)
.\deploy.ps1 green latest

# Linux/Mac
./deploy.sh green latest
```

### 4. Rolling Update 테스트

```bash
cd deploy
$env:IMAGE = "ecommerce-mvp:latest"
$env:IMAGE_WORKER = "ecommerce-mvp-worker:latest"
docker compose -f docker-compose.rolling.yml up -d --scale app=2
```

## 프로젝트 구조

```
├── src/
│   ├── index.js          # Express 서버
│   ├── worker.js         # Bull 큐 워커 (주문 처리, 배치)
│   ├── config.js
│   ├── db/               # SQLite
│   ├── routes/           # products, orders API
│   └── services/
│       ├── redis.js      # Redis 연결
│       ├── cache.js      # 캐시 레이어
│       └── queue.js      # Bull 큐
├── deploy/
│   ├── docker-compose.deploy.yml   # Blue-Green
│   ├── docker-compose.rolling.yml  # Rolling
│   ├── nginx-*.conf
│   ├── deploy.sh         # Linux/Mac 배포 스크립트
│   └── deploy.ps1        # Windows 배포 스크립트
├── .github/workflows/
│   └── ci-cd.yml         # GitHub Actions (빌드 & 푸시)
├── Dockerfile
├── Dockerfile.worker
└── docker-compose.yml    # 로컬 개발용
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/products | 상품 목록 (캐시) |
| GET | /api/products/:id | 상품 상세 (캐시) |
| POST | /api/products/cache/invalidate | 캐시 무효화 |
| GET | /api/products/cache/status | 캐시 상태 (저장된 키 목록) |
| POST | /api/orders | 주문 접수 (Bull 큐) |
| GET | /api/orders | 주문 목록 |
| POST | /api/orders/batch/report | 일일 리포트 배치 실행 |
| GET | /api/orders/batch/report/status | 배치 작업 상태/결과 조회 |
| GET | /health | 헬스체크 |

### 캐시/배치 동작 확인 방법

**캐시**
1. `curl -I http://localhost:3000/api/products` → `X-Cache: MISS` (최초)
2. 같은 요청 다시 → `X-Cache: HIT`
3. POST `/api/products/cache/invalidate` 후 → 다시 `X-Cache: MISS`
4. `GET /api/products/cache/status` → 현재 캐시된 키 목록 확인

**배치 리포트**
1. POST `/api/orders/batch/report` → 작업 시작
2. `docker compose logs -f worker` → `[Worker] 배치 작업 시작`, `[Worker] 일일 리포트:` 로그 확인
3. GET `/api/orders/batch/report/status` → `status: "completed"`, `report` 객체 확인

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| PORT | 3000 | 서버 포트 |
| REDIS_HOST | localhost | Redis 호스트 |
| REDIS_PORT | 6379 | Redis 포트 |
| CACHE_TTL | 300 | 캐시 TTL (초) |
| DB_PATH | ./data/store.db | SQLite 경로 |

## GitHub Actions

- `main`/`master` 브랜치 push 시 Docker 이미지 빌드 및 GHCR 푸시
- PR 시에는 빌드만 수행 (푸시 없음)
- VPS/로컬 서버 배포: `deploy/` 스크립트 + SSH 키 사용 (선택)

## 배포 전략 요약

| 전략 | 파일 | 특징 |
|------|------|------|
| Blue-Green | docker-compose.deploy.yml | blue/green 교대, 빠른 롤백 |
| Rolling | docker-compose.rolling.yml | 여러 복제본, 순차 업데이트 |

## 배포 연습 가이드

**상세 단계는 [docs/DEPLOY_GUIDE.md](docs/DEPLOY_GUIDE.md) 참고**

- 로컬 Blue-Green 연습: `.\scripts\practice-bluegreen.ps1 init`
- GitHub Actions → GHCR 푸시: `main` 브랜치 push
- 실제 서버 배포: Oracle Cloud Free + SSH

## 라이선스

MIT
