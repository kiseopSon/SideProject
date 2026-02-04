# ☕ Coffee Brew Lab

커피 추출 실험을 이벤트 로그로 기록하고, 최근 결과와 통계를 빠르게 확인하는 개인 실험 플랫폼

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EAI Hub (8000) - 선택적 진입점                              │
│                    /api/coffee-gateway/* → statistics-service (9002)                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                          │
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  API Gateway    │────▶│ Experiment Svc  │────▶│     Kafka       │
│    :8101        │     │    :8102        │     │    :9092        │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                          │                     │
         │  /api/experiments/**     │                     │
         │  /api/statistics/**      │                     │
         │  /dashboard, /experiment-form,                 │
         │  /complete-form, /search-page,                  │
         │  /history-page, /       │                     │
         └─────────────────────────┼─────────────────────┤
                                  │                     │
                                  ▼                     ▼
         ┌─────────────────────────────────────────────────────────────┐
         │              Statistics Service (:9002)                        │
         │  - 대시보드, 실험 폼, 완료 폼, 검색, 히스토리 (HTML)              │
         │  - /api/statistics/* (통계·검색·히스토리 API)                    │
         │  - /api/experiments → Gateway(8101) 프록시 (ExperimentProxyController) │
         │  - Elasticsearch 검색, Redis 캐시                               │
         └─────────────────────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Eureka Server  │     │ Event Consumer   │     │ Elasticsearch   │
│    :8100        │     │    :8103        │     │    :9200        │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │     Redis       │
                        │    :6379        │
                        └─────────────────┘
```

**접속 경로**
- **Gateway 직접**: `http://localhost:8101/` (대시보드, 폼, API)
- **Statistics 직접**: `http://localhost:9002/` (동일)
- **EAI Hub 경유**: `http://localhost:8000/api/coffee-gateway/` → 9002 프록시

## 🛠️ Tech Stack

- **Spring Boot 3.2** - Application Framework
- **Spring Cloud 2023.0** - Microservices (Eureka, Gateway)
- **Apache Kafka** - Event Streaming
- **Redis** - Caching & Fast Data Access
- **Elasticsearch** - Log Search & Analytics
- **H2/PostgreSQL** - Primary Database
- **Docker Compose** - Container Orchestration

## 📁 Project Structure

```
coffee/
├── common/                    # 공통 모듈 (DTO, Event)
├── discovery-service/         # Eureka Server (서비스 디스커버리)
├── gateway-service/           # API Gateway (라우팅)
├── experiment-service/        # 실험 CRUD (Kafka Producer)
├── event-consumer-service/    # 이벤트 소비 (Kafka → ES/Redis)
├── statistics-service/       # 통계·대시보드·폼·검색 (ExperimentProxy 포함)
├── docker-compose.dev.yml    # 개발용 인프라 (Kafka, Redis, ES)
└── gradle/                   # Gradle Wrapper
```

### statistics-service 주요 컴포넌트

| Controller | 역할 |
|------------|------|
| DashboardController | 대시보드 HTML |
| ExperimentFormController | 새 실험 입력 폼 |
| CompleteFormController | 실험 완료(맛 평가) 폼 |
| SearchController | Elasticsearch 기반 검색 페이지 |
| HistoryController | 날짜별 히스토리 페이지 |
| ExperimentProxyController | `/api/experiments` → Gateway(8101) 프록시 |
| StatisticsController | `/api/statistics/*` 통계·검색·히스토리 API |

## 🚀 Quick Start

### 1. 인프라 실행 (Docker)

```bash
# 개발용 경량 인프라 실행 (Kafka, Redis, Elasticsearch)
docker-compose -f docker-compose.dev.yml up -d
```

### 2. 서비스 실행 순서

```bash
# 프로젝트 루트에서 실행
./gradlew :discovery-service:bootRun    # 1. Discovery (8100)
./gradlew :gateway-service:bootRun      # 2. Gateway (8101)
./gradlew :experiment-service:bootRun   # 3. Experiment (8102)
./gradlew :event-consumer-service:bootRun # 4. Event Consumer (8103)
./gradlew :statistics-service:bootRun # 5. Statistics (9002)
```

### 3. 접속 URL

| 접속 경로 | URL | 용도 |
|-----------|-----|------|
| **Gateway** | http://localhost:8101/ | API·HTML 통합 진입점 |
| **Statistics 직접** | http://localhost:9002/ | 대시보드·폼 직접 접속 |
| **EAI Hub 경유** | http://localhost:8000/api/coffee-gateway/ | EAI Hub에서 Coffee 서비스 접속 시 |

### 4. Gradle Wrapper 생성 (최초 1회)

```bash
gradle wrapper
```

## 📡 API Endpoints

### Experiment API (via Gateway :8101 또는 Statistics :9002 프록시)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/experiments` | 새 실험 생성 |
| GET | `/api/experiments` | 최근 실험 목록 조회 |
| GET | `/api/experiments/{id}` | 실험 상세 조회 |
| PUT | `/api/experiments/{id}/complete` | 실험 완료 처리 |
| DELETE | `/api/experiments/{id}` | 실험 삭제 |

> Statistics(9002)에서 직접 접속 시 `/api/experiments`는 Gateway(8101)로 프록시됩니다.

### Statistics API (via Gateway :8101 또는 직접 :9002)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/statistics` | 전체 통계 조회 |
| GET | `/api/statistics/recent` | 최근 실험 조회 |
| GET | `/api/statistics/top-rated` | 높은 평점 실험 조회 |
| GET | `/api/statistics/search?query=` | 통합 검색 (Elasticsearch) |
| GET | `/api/statistics/search/flavor?query=` | 풍미 노트로 검색 |
| GET | `/api/statistics/search/brew-method?method=` | 추출 방법으로 검색 |
| GET | `/api/statistics/search/coffee-bean?bean=` | 원두로 검색 |
| GET | `/api/statistics/experiments` | 필터·정렬 기반 실험 목록 |
| GET | `/api/statistics/history/date?date=` | 날짜별 히스토리 |
| GET | `/api/statistics/history/month?year=&month=` | 월별 통계 |
| GET | `/api/statistics/history/week?year=&week=` | 주별 실험 목록 |

### HTML 페이지 (Statistics Service)

| 경로 | 설명 |
|------|------|
| `/` | 실험 입력 폼 (experiment-form) |
| `/dashboard` | 대시보드 |
| `/experiment-form` | 새 실험 입력 |
| `/complete-form` | 실험 완료 (맛 평가) |
| `/search-page` | Elasticsearch 기반 검색 |
| `/history-page` | 날짜별 히스토리 |

## 📝 Sample API Requests

### 실험 생성

```bash
curl -X POST http://localhost:8101/api/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "coffeeBean": "Ethiopia Yirgacheffe",
    "roastLevel": "Light",
    "grindSize": 5.0,
    "waterTemperature": 93.0,
    "coffeeAmount": 18.0,
    "waterAmount": 300.0,
    "brewMethod": "V60",
    "extractionTime": 180
  }'
```

### 실험 완료

```bash
curl -X PUT http://localhost:8101/api/experiments/{id}/complete \
  -H "Content-Type: application/json" \
  -d '{
    "tasteScore": 8.5,
    "flavorNotes": "Floral, Citrus, Bright acidity",
    "notes": "Perfect extraction"
  }'
```

### 통계 조회

```bash
curl http://localhost:8101/api/statistics
```

### 검색 (Elasticsearch)

```bash
curl "http://localhost:9002/api/statistics/search?query=citrus&page=0&size=10"
```

## 🔧 Configuration

각 서비스의 설정은 `src/main/resources/application.yml`에서 변경 가능합니다.

### 포트 구성

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Discovery | 8100 | Eureka 서버 |
| Gateway | 8101 | API 게이트웨이 |
| Experiment | 8102 | 실험 CRUD |
| Event Consumer | 8103 | Kafka → ES/Redis |
| Statistics | 9002 | 통계·대시보드·폼·검색 |

### statistics-service 주요 설정

- **gateway.port**: 8101 (ExperimentProxyController가 `/api/experiments` 프록시 대상)
- **gateway.host**: localhost

## 📦 Build

```bash
# 전체 빌드
./gradlew build

# 특정 서비스만 빌드
./gradlew :experiment-service:build
```

## 🧪 실험 파라미터 가이드

| 파라미터 | 설명 | 범위 |
|----------|------|------|
| coffeeBean | 원두 종류 | 문자열 |
| roastLevel | 로스팅 레벨 | 1-8 (라이트~이탈리안) |
| grindSize | 분쇄도 | 1-10 (숫자가 클수록 굵음) |
| waterTemperature | 물 온도 | 80-100°C |
| coffeeAmount | 커피 양 | 양수 (g) |
| waterAmount | 물 양 | 양수 (ml) |
| brewMethod | 추출 방법 | 브루잉, 모카포트, 에스프레소머신 |
| extractionTime | 추출 시간 | 양수 (초) |
| tasteScore | 맛 점수 | 1-10 |
| sournessHot/Cold, sweetnessHot/Cold, bitternessHot/Cold | 뜨거울 때/식었을 때 맛 | 1-10 |

## 📄 License

This project is for personal use.
