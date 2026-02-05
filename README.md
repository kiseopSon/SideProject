# EAI Hub - Enterprise Application Integration Hub

## 개요

EAI Hub는 여러 서비스를 하나의 중앙 허브에서 통합 관리하는 API Gateway입니다. 
모든 서비스에 대한 단일 진입점을 제공하고, 서비스 디스커버리, 헬스체크, 프록시 라우팅 기능을 제공합니다.
<img width="2816" height="1536" alt="eai-hub_image" src="https://github.com/user-attachments/assets/2e12883a-ff91-4b88-92ae-b387ba0af119" />

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
uvicorn main:app --host 0.0.0.0 --port 9000 --reload
```

### 4. 접속

- **대시보드**: http://localhost:9000/dashboard
- **API 문서**: http://localhost:9000/docs
- **서비스 목록**: http://localhost:9000/api/services
- **헬스체크**: http://localhost:9000/api/health

## 통합된 서비스

1. **AI Incident Intelligence Platform** (포트: 8000, 8080, 9093)
   - Python FastAPI 기반 인시던트 처리 플랫폼
   - API 접두사: `/api/ai-incident`

2. **Ball Bounce Game** (포트: 5173)
   - React/TypeScript 기반 웹 게임

3. **Coffee Gateway Service** (포트: 8080, 8081, 8761)
   - Java Spring Cloud 기반 마이크로서비스
   - API 접두사: `/api/coffee`

4. **Cosmetics Ingredient Analyzer** (포트: 8000, 3000)
   - Python FastAPI + React 기반 성분 분석 서비스
   - API 접두사: `/api/cosmetics`

5. **Deffender Game** (포트: 19006)
   - React Native/Expo 기반 모바일 게임

6. **My Lover Is Clumsy** (포트: 19000)
   - React Native/Expo + Supabase 기반 앱

7. **Regex Generator**
   - Python 데스크톱 앱 (API 없음)

8. **SoSadWorld Gateway Service** (포트: 8080, 8082, 18500)
   - Java Spring Cloud + Consul 기반 감정 분석 서비스
   - API 접두사: `/api/sosadworld`

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
- `GET /api/ai-incident/api/v1/classify` → `http://localhost:8000/api/v1/classify`
- `GET /api/coffee/experiments` → `http://localhost:8080/experiments`

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
                    ┌─────────────┐
                    │   EAI Hub   │
                    │  (Port 9000)│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌─────▼─────┐      ┌─────▼─────┐
   │ Service │       │  Service  │      │  Service  │
   │    1    │       │     2     │      │     ...   │
   └─────────┘       └───────────┘      └───────────┘
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
├── requirements.txt       # Python 의존성
└── README.md             # 문서
```

## 라이선스

MIT
