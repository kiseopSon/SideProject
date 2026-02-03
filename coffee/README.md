# ☕ Coffee Brew Lab

커피 추출 실험을 이벤트 로그로 기록하고, 최근 결과와 통계를 빠르게 확인하는 개인 실험 플랫폼

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  API Gateway    │────▶│ Experiment Svc  │────▶│     Kafka       │
│    :8080        │     │    :8081        │     │    :9092        │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         │              ┌─────────────────┐              │
         └─────────────▶│ Statistics Svc  │◀─────────────┤
                        │    :8083        │              │
                        └─────────────────┘              │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Eureka Server  │     │ Event Consumer  │────▶│ Elasticsearch   │
│    :8761        │     │    :8082        │     │    :9200        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │     Redis       │
                        │    :6379        │
                        └─────────────────┘
```

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
coffee-brew-lab/
├── common/                    # 공통 모듈 (DTO, Event)
├── discovery-service/         # Eureka Server (서비스 디스커버리)
├── gateway-service/           # API Gateway
├── experiment-service/        # 실험 기록 서비스 (Kafka Producer)
├── event-consumer-service/    # 이벤트 소비 서비스 (Kafka Consumer)
├── statistics-service/        # 통계 조회 서비스 (Redis Cache)
├── docker-compose.yml         # 전체 인프라 설정
└── docker-compose.dev.yml     # 개발용 경량 설정
```

## 🚀 Quick Start

### 1. 인프라 실행 (Docker)

```bash
# 개발용 경량 인프라 실행
docker-compose -f docker-compose.dev.yml up -d

# 또는 전체 인프라 실행 (모니터링 UI 포함)
docker-compose up -d
```

### 2. 서비스 실행 순서

```bash
# 1. Discovery Service 실행
cd discovery-service
../gradlew bootRun

# 2. Gateway Service 실행
cd gateway-service
../gradlew bootRun

# 3. Experiment Service 실행
cd experiment-service
../gradlew bootRun

# 4. Event Consumer Service 실행
cd event-consumer-service
../gradlew bootRun

# 5. Statistics Service 실행
cd statistics-service
../gradlew bootRun
```

### 3. Gradle Wrapper 생성 (최초 1회)

```bash
gradle wrapper
```

## 📡 API Endpoints

### Experiment Service (via Gateway :8080)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/experiments` | 새 실험 생성 |
| GET | `/api/experiments` | 최근 실험 목록 조회 |
| GET | `/api/experiments/{id}` | 실험 상세 조회 |
| PUT | `/api/experiments/{id}/complete` | 실험 완료 처리 |
| DELETE | `/api/experiments/{id}` | 실험 삭제 |

### Statistics Service (via Gateway :8080)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/statistics` | 전체 통계 조회 |
| GET | `/api/statistics/recent` | 최근 실험 조회 |
| GET | `/api/statistics/top-rated` | 높은 평점 실험 조회 |
| GET | `/api/statistics/search/flavor?query=` | 풍미 노트로 검색 |
| GET | `/api/statistics/search/brew-method?method=` | 추출 방법으로 검색 |
| GET | `/api/statistics/search/coffee-bean?bean=` | 원두로 검색 |

## 📝 Sample API Requests

### 실험 생성

```bash
curl -X POST http://localhost:8080/api/experiments \
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
curl -X PUT http://localhost:8080/api/experiments/{id}/complete \
  -H "Content-Type: application/json" \
  -d '{
    "tasteScore": 8.5,
    "flavorNotes": "Floral, Citrus, Bright acidity",
    "notes": "Perfect extraction, slightly longer bloom time recommended"
  }'
```

### 통계 조회

```bash
curl http://localhost:8080/api/statistics
```

## 🔧 Monitoring URLs

| Service | URL |
|---------|-----|
| Eureka Dashboard | http://localhost:8761 |
| Kafka UI | http://localhost:8090 |
| Redis Commander | http://localhost:8091 |
| Kibana | http://localhost:5601 |
| H2 Console (Experiment) | http://localhost:8081/h2-console |

## ⚙️ Configuration

각 서비스의 설정은 `src/main/resources/application.yml`에서 변경 가능합니다.

### 주요 설정 항목

- **Kafka**: `spring.kafka.bootstrap-servers`
- **Redis**: `spring.data.redis.host`
- **Elasticsearch**: `spring.elasticsearch.uris`
- **Eureka**: `eureka.client.service-url.defaultZone`

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
| roastLevel | 로스팅 레벨 | Light, Medium, Dark |
| grindSize | 분쇄도 | 1-10 (숫자가 클수록 굵음) |
| waterTemperature | 물 온도 | 80-100°C |
| coffeeAmount | 커피 양 | 양수 (g) |
| waterAmount | 물 양 | 양수 (ml) |
| brewMethod | 추출 방법 | V60, Aeropress, French Press, etc. |
| extractionTime | 추출 시간 | 양수 (초) |
| tasteScore | 맛 점수 | 1-10 |

## 📄 License

This project is for personal use.

