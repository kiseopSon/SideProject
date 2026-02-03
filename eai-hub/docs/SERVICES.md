# EAI Hub 관리 서비스 가이드

EAI Hub가 관리하는 서비스 목록, 포트 배정, 연결 방식, 아키텍처를 설명합니다.

---

## 서비스 포트 매핑

| 서비스 ID | 서비스명 | 포트 | 타입 | 접근 방식 |
|-----------|----------|------|------|-----------|
| ai-incident | AI Incident Intelligence Platform | 9000 | microservice | 프록시 (`/api/ai-incident/`) |
| ball-bounce | Ball Bounce Game | 9001 | web | 프록시 (`/api/ball-bounce/`) |
| coffee-gateway | Coffee Gateway Service | 9002 | microservice | 프록시 (`/api/coffee/`) |
| cosmetics | Cosmetics Ingredient Analyzer | 9003 | api | 프록시 (`/api/cosmetics/`) |
| deffender-game | Deffender Game | 9004 | mobile | **직접 접속** (`호스트:9004`) |
| my-lover-is-clumsy | My Lover Is Clumsy | 9005 | mobile | 프록시 또는 직접 |
| regex-generator | Regex Generator | - | desktop | 다운로드 전용 |
| sosadworld-gateway | SoSadWorld Gateway Service | 9006 | microservice | 프록시 (`/api/sosadworld/`) |

> **EAI Hub**: 포트 **8000** (기본값, `.env`에서 변경 가능)

---

## 연결 방식

### 1. 프록시 경유 (Proxy)

대부분의 서비스는 EAI Hub를 통해 **단일 진입점**으로 접근합니다.

```
클라이언트 → http://호스트:8000/api/{service_id}/{path} → EAI Hub → http://localhost:{port}/{path}
```

| 서비스 | 접속 URL 예시 |
|--------|---------------|
| ball-bounce | `http://localhost:8000/api/ball-bounce/` |
| coffee-gateway | `http://localhost:8000/api/coffee/` |
| cosmetics | `http://localhost:8000/api/cosmetics/` |
| sosadworld-gateway | `http://localhost:8000/api/sosadworld/` |

**특징**
- `proxy_base_path: true` (ball-bounce): Vite `base` 경로 사용, 전체 경로를 백엔드로 전달
- 그 외: 루트 기준으로 경로 전달, HTML 내 절대 경로(`/assets/` 등)를 프록시 경로로 자동 치환

### 2. 직접 접속 (Direct Access)

Expo/Metro 번들러는 프록시 경로에서 제대로 동작하지 않아, **직접 URL**로 접속합니다.

```
클라이언트 → http://호스트:8000/api/deffender-game/ → 307 리다이렉트 → http://호스트:9004/
```

| 서비스 | 접속 URL | 비고 |
|--------|----------|------|
| deffender-game | `http://localhost:9004/` (로컬) | `direct_access: true` |
| | `http://외부도메인:9004/` (외부) | 포트 포워딩 필요 |

**외부 접속 시**: iptime 등에서 **포트 9004** 포워딩 설정 필요 (외부 포트 → 내부 192.168.0.x:9004)

### 3. 다운로드 전용 (Desktop)

API가 없는 데스크톱 앱은 **실행 파일 다운로드**로 제공됩니다.

| 서비스 | 다운로드 경로 |
|--------|---------------|
| regex-generator | `http://localhost:8000/api/download/regex-generator` |

---

## EAI Hub 아키텍처

```
                              ┌─────────────────────────────────────┐
                              │           EAI Hub (Port 8000)         │
                              │  ┌─────────────────────────────────┐ │
                              │  │  FastAPI + Service Registry      │ │
                              │  │  - 인증/세션                      │ │
                              │  │  - 대시보드 (/dashboard)          │ │
                              │  │  - API Gateway (/api/*)          │ │
                              │  └─────────────────────────────────┘ │
                              │  ┌──────────┐ ┌──────────┐ ┌───────┐ │
                              │  │ Proxy    │ │ Health   │ │ Auth  │ │
                              │  │ Router   │ │ Checker  │ │       │ │
                              │  └────┬─────┘ └────┬─────┘ └───────┘ │
                              └──────┼────────────┼─────────────────┘
                                     │            │
         ┌───────────────────────────┼────────────┼───────────────────────────┐
         │                           │            │                           │
         ▼                           ▼            ▼                           ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ ai-incident      │    │ ball-bounce      │    │ coffee-gateway   │    │ cosmetics        │
│ :9000            │    │ :9001 (Vite)     │    │ :9002           │    │ :9003            │
│ /api/ai-incident │    │ /api/ball-bounce │    │ /api/coffee     │    │ /api/cosmetics   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                           │                    │
         │                           │                    │
         ▼                           ▼                    ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ deffender-game   │    │ my-lover-is-     │    │ sosadworld-      │
│ :9004 (Expo)     │    │ clumsy :9005     │    │ gateway :9006    │
│ 직접 접속 → :9004 │    │ /api/my-lover-   │    │ /api/sosadworld  │
└─────────────────┘    │ is-clumsy/       │    └─────────────────┘
                        └─────────────────┘
```

### 핵심 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| **Service Registry** | `services.json` 로드, 포트 자동/수동 할당, 서비스 조회 |
| **Proxy Router** | `/api/{service_id}/{path}` 요청을 해당 서비스로 프록시 |
| **Health Checker** | 주기적 헬스체크, 대시보드 상태 표시 |
| **Auth** | 로그인/세션, 대시보드 접근 제어 |

### 요청 흐름

1. **프록시 요청**: `GET /api/ball-bounce/` → Proxy Router → `http://localhost:9001/` (ball-bounce는 `proxy_base_path`로 `http://localhost:9001/api/ball-bounce/`로 전달)
2. **직접 접속**: `GET /api/deffender-game/` → 307 리다이렉트 → `http://호스트:9004/`
3. **헬스체크**: Health Checker가 주기적으로 각 서비스 `base_url` 또는 `health_check_url` 호출

---

## 프로젝트 구조

```
eai-hub/
├── main.py                 # FastAPI 앱, 라우팅, 인증
├── app/
│   ├── config.py           # HOST, PORT, 타임아웃 등
│   ├── models.py           # ServiceInfo, HealthCheckResponse
│   ├── service_registry.py # 서비스 로드, 포트 할당
│   ├── health_checker.py   # 주기적 헬스체크
│   └── proxy.py            # 프록시 라우팅, HTML 경로 치환
├── static/
│   ├── dashboard.html      # 통합 대시보드
│   └── downloads/          # 데스크톱 앱 실행 파일
├── services.json           # 서비스 정의 (포트, metadata)
└── docs/
    └── SERVICES.md         # 본 문서
```

---

## 서비스 메타데이터 옵션

`services.json`의 `metadata`에서 사용하는 옵션:

| 옵션 | 설명 | 예시 |
|------|------|------|
| `port` | 고정 포트 (미지정 시 9000부터 자동 할당) | `9001` |
| `proxy_base_path` | Vite 등 base 경로 사용 시 `true` | `true` (ball-bounce) |
| `direct_access` | Expo 등 프록시 미지원 시 직접 URL 리다이렉트 | `true` (deffender-game) |
| `health_path` | 헬스체크 경로 (기본 `/`) | `/health`, `/actuator/health` |
| `download_file` | 데스크톱 앱 실행 파일명 | `RegexGenerator.exe` |

---

## 외부 접속 (DDNS + 포트 포워딩)

외부에서 접속하려면:

1. **EAI Hub (8000)**: iptime 포트 포워딩 (예: 외부 80/8080 → 내부 8000)
2. **deffender-game (9004)**: `direct_access` 서비스는 별도 포트 포워딩 필요 (외부 9004 → 내부 9004)
3. **그 외 서비스**: EAI Hub 8000만 포워딩하면 프록시로 모두 접근 가능
