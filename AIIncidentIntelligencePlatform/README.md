# AI Incident Intelligence Platform

인시던트 분석 및 모니터링을 위한 AIOps 플랫폼입니다.  
다른 프로젝트들(ballBounce, coffee, cosmetics 등)의 로그를 **수집·분석·분류·모니터링**하고, **결과만 eai-hub**에 전달합니다.

## 아키텍처

```
[다른 프로젝트들]
  ballBounce, coffee, cosmetics, deffenderGame, myDressRoom, stock-scalper 등
        │
        │  로그 전송 (Kafka 또는 HTTP API)
        ▼
┌─────────────────────────────────────────────────────────────┐
│           AI Incident Intelligence Platform                  │
│                                                              │
│  수집 → 분석 → 분류 → 모니터링 (모두 여기서 수행)              │
│  • Ingest: 로그 수신 (Kafka / HTTP)                          │
│  • Event Processor: 이벤트 처리, LLM 호출                     │
│  • LLM Layer: 분류, 근본 원인 분석                           │
│  • Dashboard: 실시간 모니터링                                │
└─────────────────────────────────────────────────────────────┘
        │
        │  결과만 전달 (인시던트 리포트, 분석 결과)
        ▼
┌─────────────────────────────────────────────────────────────┐
│  eai-hub                                                      │
│  결과 수신 (오케스트레이션, 다른 프로젝트에 전파 등)           │
└─────────────────────────────────────────────────────────────┘
```

## 포트 구성

### 애플리케이션 서비스

| 서비스 | 포트 | URL |
|--------|------|-----|
| Dashboard | 9000 | http://localhost:9000 |
| LLM Layer | 9200 | http://localhost:9200 |
| Event Processor | 9091 | http://localhost:9091/metrics |
| Metrics Exporter | 9093 | http://localhost:9093/metrics |

### Docker 인프라

| 서비스 | 포트 | URL |
|--------|------|-----|
| Prometheus | 9201 | http://localhost:9201 |
| Grafana | 9202 | http://localhost:9202 |
| Elasticsearch | 9203 | http://localhost:9203 |
| Kafka | 9094 | localhost:9094 |
| Redis | 6380 | localhost:6380 |
| Zookeeper | 2182 | localhost:2182 |
| Loki | 3100 | localhost:3100 |

> **참고**: Kafka(9094), Redis(6380), Zookeeper(2182)는 기본 포트(9092, 6379, 2181) 충돌 시 변경된 값입니다.

## 서비스별 접속 안내

| 서비스 | 브라우저 접속 | 설명 |
|--------|---------------|------|
| **Elasticsearch** (9203) | ✅ JSON 응답 | 정상. 클러스터 정보가 JSON으로 표시됨 |
| **Grafana** (9202) | ✅ 웹 UI | 로그인: admin / admin. 대시보드 자동 생성됨 |
| **Prometheus** (9201) | ✅ 웹 UI | 쿼리, 타겟 확인 가능 |
| **Loki** (3100) | ⚠️ 404 | 정상. Loki는 웹 UI 없음. Grafana Explore에서 로그 조회 |
| **Redis** (6380) | ⚠️ ERR_EMPTY_RESPONSE | 정상. HTTP 미지원. `redis-cli -p 6380` 사용 |
| **Zookeeper** (2182) | ⚠️ ERR_EMPTY_RESPONSE | 정상. HTTP 미지원. 전용 프로토콜 사용 |
| **Kafka** (9094) | ⚠️ ERR_EMPTY_RESPONSE | 정상. HTTP 미지원. Producer/Consumer로만 접속 |

## 실행 순서

### 1단계: 사전 준비

1. **Ollama 설치 및 모델 준비**
   ```powershell
   ollama pull deepseek-coder:6.7b
   ```

2. **환경 변수 설정**
   - `.env` 파일 생성 (`env.example` 복사)
   - `OLLAMA_MODEL=deepseek-coder:6.7b` 확인
   - `ELASTICSEARCH_URL=http://localhost:9203` 확인
   - `REDIS_URL=redis://localhost:6380` 확인
   - `KAFKA_BOOTSTRAP_SERVERS=localhost:9094` 확인

3. **Python 의존성 설치**
   ```powershell
   py -m pip install -r llm-layer/requirements.txt
   py -m pip install -r event-processor/requirements.txt
   py -m pip install -r metrics-exporter/requirements.txt
   py -m pip install -r dashboard/requirements.txt
   py -m pip install -r notification/requirements.txt
   ```

### 2단계: Docker 인프라 실행

```powershell
docker-compose up -d
docker-compose ps
```

**포함 서비스**: Zookeeper, Kafka, Elasticsearch, Redis, Prometheus, Grafana, Loki, Promtail

인프라가 완전히 뜰 때까지 1~2분 대기 후 다음 단계로 진행합니다.

### 3단계: 애플리케이션 서비스 실행

| 순서 | 서비스 | 명령어 | 포트 |
|------|--------|--------|------|
| 1 | Event Processor | `cd event-processor && py main.py` | 9091 |
| 2 | Metrics Exporter | `cd metrics-exporter && py main.py` | 9093 |
| 3 | LLM Layer | `cd llm-layer && uvicorn main:app --host 0.0.0.0 --port 9200` | 9200 |
| 4 | Dashboard | `cd dashboard && py main.py` | 9000 |
| 5 | Notification Service | `cd notification && py main.py` | - |

각 서비스는 별도 터미널에서 실행하거나 백그라운드로 실행합니다.

### 4단계: 동작 확인

| 확인 항목 | URL |
|-----------|-----|
| LLM Layer | http://localhost:9200 |
| Dashboard | http://localhost:9000 |
| Prometheus | http://localhost:9201 |
| Grafana | http://localhost:9202 |
| Elasticsearch | http://localhost:9203 |

## 환경 변수

`.env` 파일 생성 시 `env.example`을 복사하고 다음 항목을 확인하세요.

| 변수 | 설명 | 예시 |
|------|------|------|
| KAFKA_BOOTSTRAP_SERVERS | Kafka 주소 | localhost:9094 |
| ELASTICSEARCH_URL | Elasticsearch 주소 | http://localhost:9203 |
| REDIS_URL | Redis 주소 | redis://localhost:6380 |
| OLLAMA_MODEL | Ollama 모델명 | deepseek-coder:6.7b |
| LLM_LAYER_PORT | LLM Layer 포트 | 9200 |
| DASHBOARD_PORT | Dashboard 포트 | 9000 |
| EAI_HUB_URL | eai-hub 결과 수신 URL | http://localhost:8080/api/incidents |

## 데이터 흐름 (eai-hub 연동)

| 단계 | 서비스 | 역할 |
|------|--------|------|
| 1. 수집 | LLM Layer `/api/v1/ingest` | 다른 프로젝트가 POST로 로그 전송 → Kafka `events` 토픽 |
| 2. 처리 | Event Processor | Kafka 소비 → LLM 분류 호출 → Redis/ES 저장 → Kafka `incident-reports` 발행 |
| 3. 결과 전달 | Notification Service | `incident-reports` 소비 → **eai-hub로 POST** |

**eai-hub 연동**: `.env`에 `EAI_HUB_URL` 설정 시, Notification Service가 인시던트 결과를 해당 URL로 전달합니다.

## 구성 점검 (eai-hub 목적 기준)

| 구성요소 | 상태 | 비고 |
|----------|------|------|
| 로그 수집 | ✅ | `POST /api/v1/ingest` (다른 프로젝트 → Kafka) |
| 분석/분류 | ✅ | Event Processor → LLM Layer `/api/v1/classify` |
| 모니터링 | ✅ | Dashboard, Prometheus, Grafana |
| **결과 전달** | ✅ | Notification Service → `EAI_HUB_URL` POST |

eai-hub에서 결과를 받으려면: eai-hub에 `POST {EAI_HUB_URL}` 수신 API를 구현하고, Notification Service 실행 시 `EAI_HUB_URL`을 eai-hub 주소로 설정하세요.

## 기술 스택

- **LLM**: Ollama (deepseek-coder:6.7b)
- **인프라**: Kafka, Elasticsearch, Redis
- **모니터링**: Prometheus, Grafana, Loki
- **애플리케이션**: FastAPI (Python)
