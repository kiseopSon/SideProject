# EAI Hub - Enterprise Application Integration Hub

## 개요

EAI Hub는 여러 서비스를 하나의 중앙 허브에서 통합 관리하는 API Gateway입니다. 
모든 서비스에 대한 단일 진입점을 제공하고, 서비스 디스커버리, 헬스체크, 프록시 라우팅 기능을 제공합니다.

## 주요 기능

- 🚪 **중앙 API Gateway**: 모든 서비스에 대한 단일 진입점
- 🔍 **서비스 디스커버리**: 등록된 서비스 자동 관리
- 💚 **헬스체크**: 주기적 서비스 상태 모니터링
- 🔄 **프록시 라우팅**: 요청을 적절한 서비스로 자동 라우팅
- 📊 **통합 대시보드**: 모든 서비스 상태를 한눈에 확인
- ⚡ **실시간 모니터링**: 서비스 응답시간 및 상태 추적

## 설치 및 실행

### 1. 의존성 설치

```powershell
cd eai-hub
pip install -r requirements.txt
```

### 2. 환경 변수 설정 (선택사항)

`.env` 파일을 생성하거나 `.env.example`을 복사하여 수정:

```powershell
copy .env.example .env
```

### 3. 서비스 실행

```powershell
python main.py
```

또는 uvicorn 직접 실행:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. 접속

- **대시보드**: http://localhost:8000/dashboard
- **API 문서**: http://localhost:8000/docs
- **서비스 목록**: http://localhost:8000/api/services
- **헬스체크**: http://localhost:8000/api/health

## 통합된 서비스

| 서비스 ID | 서비스명 | 포트 | API 접두사 | 비고 |
|-----------|----------|------|------------|------|
| ai-incident | AI Incident Intelligence Platform | 9000 | `/api/ai-incident` | - |
| ball-bounce | Ball Bounce Game | 9001 | `/api/ball-bounce/` | proxy_base_path |
| coffee-gateway | Coffee Brew Lab | 9002 | `/api/coffee-gateway` | 대시보드·폼·검색·히스토리 |
| statistics | Coffee Statistics API | 9002 | `/api/statistics` | dashboard_hidden |
| experiments | Experiments API | 8101 | `/api/experiments` | gateway 경유, dashboard_hidden |
| coffee-eureka | Coffee Eureka (Discovery) | 8100 | `/api/coffee-eureka` | dashboard_hidden |
| cosmetics | Cosmetics Ingredient Analyzer | 9003 | `/api/cosmetics` | - |
| deffender-game | Deffender Game | 9004 | - | 직접 접속 (direct_access) |
| my-lover-is-clumsy | My Lover Is Clumsy | 9005 | - | - |
| regex-generator | Regex Generator | - | - | 다운로드 전용 |
| sosadworld-gateway | SoSadWorld Gateway Service | 9006 | `/api/sosadworld` | - |

> EAI Hub 기본 포트: **8000** (`.env`에서 변경 가능)

### Coffee Brew Lab (커피 추출 실험)

Coffee Brew Lab은 `/api/coffee-gateway/` 경로로 접근합니다. statistics-service(9002)가 대시보드·폼·검색·히스토리를 제공하며, `/api/experiments` 요청은 내부적으로 Gateway(8101)로 프록시됩니다.

| 경로 | 설명 |
|------|------|
| `/api/coffee-gateway/` | 실험 입력 폼 (루트) |
| `/api/coffee-gateway/dashboard` | 대시보드 |
| `/api/coffee-gateway/experiment-form` | 새 실험 작성 |
| `/api/coffee-gateway/complete-form` | 실험 완료 (맛 평가) |
| `/api/coffee-gateway/search-page` | Elasticsearch 기반 실험 검색 |
| `/api/coffee-gateway/history-page` | 날짜별 실험 히스토리 |

**루트 경로 리다이렉트**: `/dashboard`, `/complete-form`, `/experiment-form`, `/search-page`, `/history-page` → `/api/coffee-gateway/...` 로 자동 리다이렉트

## API 사용법

### 서비스 목록 조회

```bash
GET /api/services
```

### 특정 서비스 정보 조회

```bash
GET /api/services/{service_id}
```

### 전체 서비스 헬스체크

```bash
GET /api/health
```

### 특정 서비스 헬스체크

```bash
GET /api/health/{service_id}
```

### 서비스 프록시 접근

```bash
GET /api/{service_id}/{path}
POST /api/{service_id}/{path}
# ... 기타 HTTP 메서드
```

예시:
- `GET /api/ai-incident/api/v1/classify` → `http://localhost:9000/api/v1/classify`
- `GET /api/coffee-gateway/dashboard` → `http://localhost:9002/dashboard` (Coffee Brew Lab)
- `POST /api/coffee-gateway/api/experiments` → statistics(9002) → Gateway(8101) 프록시

## 서비스 설정

서비스는 `services.json` 파일에서 관리됩니다. 새로운 서비스를 추가하거나 기존 서비스를 수정하려면 이 파일을 편집하세요.

```json
{
  "services": [
    {
      "id": "service-id",
      "name": "Service Name",
      "description": "Service Description",
      "type": "api|web|mobile|desktop|microservice",
      "base_url": "http://localhost:PORT",
      "health_check_url": "http://localhost:PORT/health",
      "api_prefix": "/api/service-prefix",
      "enabled": true,
      "metadata": {
        "ports": [8000],
        "tech": ["Python", "FastAPI"]
      }
    }
  ]
}
```

## 아키텍처

```
                              ┌─────────────────────────────────────┐
                              │           EAI Hub (Port 8000)        │
                              │  FastAPI + Service Registry + Proxy   │
                              │  로그인·대시보드·프록시 라우팅·헬스체크   │
                              └──────────────────┬──────────────────┘
                                                 │
     ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
     │              │              │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────┐
│ai-incident│  │ball-bounce│  │coffee-gateway│  │cosmetics │  │deffender │  │sosadworld-   │  │  ...    │
│  :9000   │  │  :9001   │  │   :9002     │  │  :9003   │  │  :9004   │  │gateway :9006 │  │         │
│          │  │(Vite SPA)│  │(Statistics) │  │          │  │(직접접속) │  │              │  │         │
└─────────┘  └──────────┘  └──────┬───────┘  └──────────┘  └──────────┘  └──────────────┘  └─────────┘
                                  │
                    Coffee 내부: /api/experiments → Gateway(8101) 프록시
```

## 개발

### 프로젝트 구조

```
eai-hub/
├── main.py                 # 메인 애플리케이션
├── app/
│   ├── __init__.py
│   ├── config.py          # 설정 관리
│   ├── models.py          # 데이터 모델
│   ├── service_registry.py # 서비스 레지스트리
│   ├── health_checker.py  # 헬스체크 관리
│   └── proxy.py           # 프록시 라우팅
├── static/
│   └── dashboard.html     # 통합 대시보드
├── services.json          # 서비스 설정 파일
├── docs/
│   └── SERVICES.md        # 서비스 상세 가이드
├── requirements.txt       # Python 의존성
└── README.md             # 문서
```

## 라이선스

MIT
