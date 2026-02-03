# AI Incident Intelligence Platform

로그를 사람이 읽지 않아도, 장애 원인과 조치를 말해주는 시스템

---

## 📋 기술 스택

### 인프라 (Docker)
- **Kafka** (9092): 이벤트 스트리밍 플랫폼 (Event Store)
- **Zookeeper** (2181): Kafka 의존성
- **Elasticsearch** (9200): 검색/분석 엔진
- **Redis** (6379): 실시간 상태 저장소
- **Prometheus** (9090): 메트릭 수집 및 저장
- **Grafana** (3000): 메트릭 시각화 대시보드
- **Loki** (3100): 로그 수집
- **Promtail**: 로그 수집 에이전트

### 애플리케이션
- **LLM Layer** (8000): FastAPI 기반 LLM 서비스
- **Event Processor**: Kafka 이벤트 처리 (백그라운드)
- **Notification Service**: 알림 처리 (백그라운드)
- **Metrics Exporter** (9093): Redis → Prometheus 메트릭 변환
- **Dashboard** (8080): FastAPI 기반 인시던트 대시보드

### LLM
- **Ollama** (11434): 로컬 LLM 서버 (완전 무료)
- **모델**: `deepseek-coder:6.7b` (코딩 전용 모델)

### 언어/프레임워크
- **Python 3.10+**: 모든 애플리케이션 서비스
- **FastAPI**: LLM Layer, Dashboard
- **OpenTelemetry**: 텔레메트리 수집

---

## ⚙️ 설정

### 1. 환경 변수 설정

`.env` 파일 생성 (프로젝트 루트):

```env
# Ollama (LLM - 완전 무료!)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-coder:6.7b

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC=incidents
KAFKA_REPORT_TOPIC=incident-reports

# Elasticsearch
ELASTICSEARCH_HOST=localhost:9200

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Slack Webhook (선택사항)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email SMTP (선택사항)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=team@example.com
```

### 2. Ollama 설치 및 모델 다운로드

1. **Ollama 설치**
   - https://ollama.com/download 에서 다운로드 및 설치

2. **모델 다운로드**
   ```powershell
   ollama pull deepseek-coder:6.7b
   ```

3. **확인**
   ```powershell
   ollama list
   ```

### 3. Python 의존성 설치

**LLM Layer** (가상환경 사용):
```powershell
cd llm-layer
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Event Processor, Metrics Exporter, Dashboard** (시스템 Python 사용):
```powershell
# Event Processor
cd event-processor
pip install -r requirements.txt

# Metrics Exporter
cd ..\metrics-exporter
pip install -r requirements.txt

# Dashboard
cd ..\dashboard
pip install -r requirements.txt
```

---

## 🚀 실행 순서

### 1단계: 인프라 서비스 시작 (Docker)

```powershell
docker-compose up -d
```

**확인**:
```powershell
docker-compose ps
```

모든 서비스가 `Up` 상태여야 합니다.

### 2단계: Ollama 확인

```powershell
# Ollama 서버 확인
curl http://localhost:11434/api/tags

# 또는 브라우저에서
# http://localhost:11434
```

### 3단계: 애플리케이션 서비스 시작

**LLM Layer** (가상환경):
```powershell
cd llm-layer
.\venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Event Processor** (시스템 Python):
```powershell
cd event-processor
python main.py
```

**Metrics Exporter** (시스템 Python):
```powershell
cd metrics-exporter
python main.py
```

**Dashboard** (시스템 Python):
```powershell
cd dashboard
python main.py
```

**Notification Service** (시스템 Python, 선택사항):
```powershell
cd notification
python main.py
```

### 4단계: 서비스 상태 확인

**웹 UI 접속**:
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090
- LLM API Docs: http://localhost:8000/docs
- Dashboard: http://localhost:8080

**API 테스트**:
```powershell
# LLM Layer 헬스 체크
curl http://localhost:8000/

# Prometheus 메트릭 확인
curl http://localhost:9090/api/v1/targets
```

---

## 🎯 각 서비스의 역할

### 인프라 서비스

| 서비스 | 역할 | 포트 |
|--------|------|------|
| **Kafka** | 이벤트 스트리밍 플랫폼. 모든 인시던트 이벤트를 영구 저장 (Event Store) | 9092 |
| **Zookeeper** | Kafka의 메타데이터 관리 (내부 의존성) | 2181 |
| **Elasticsearch** | 인시던트 데이터 검색 및 분석. CQRS Read 모델 저장 | 9200 |
| **Redis** | 실시간 인시던트 상태 저장. Metrics Exporter가 여기서 데이터 읽음 | 6379 |
| **Prometheus** | 메트릭 수집 및 저장. LLM Layer, Event Processor, Metrics Exporter에서 메트릭 수집 | 9090 |
| **Grafana** | Prometheus 메트릭을 시각화하여 대시보드 제공 | 3000 |
| **Loki** | 로그 수집 및 저장 | 3100 |
| **Promtail** | 로그 파일을 읽어서 Loki로 전송 | - |

### 애플리케이션 서비스

| 서비스 | 역할 | 포트 |
|--------|------|------|
| **LLM Layer** | 인시던트 분류, 근본 원인 분석, 리포트 생성. Ollama를 사용하여 LLM 체이닝 수행 | 8000 |
| **Event Processor** | Kafka에서 이벤트를 소비하여 Elasticsearch와 Redis에 저장 (CQRS 패턴) | - |
| **Notification Service** | Kafka에서 리포트를 소비하여 Slack/Email 알림 전송 | - |
| **Metrics Exporter** | Redis의 인시던트 데이터를 Prometheus 메트릭 형식으로 변환하여 `/metrics` 엔드포인트 제공 | 9093 |
| **Dashboard** | 실시간 인시던트 대시보드 웹 UI 제공 | 8080 |

### 외부 서비스

| 서비스 | 역할 | 포트 |
|--------|------|------|
| **Ollama** | 로컬 LLM 서버. `deepseek-coder:6.7b` 모델 실행 | 11434 |

---

## 📊 아키텍처 흐름

```
[Application / Infra]
   ↓ (Log / Error / Metric)
Kafka (Event Store)
   ↓
Event Processor
   ├─ Elasticsearch (검색/분석)
   └─ Redis (실시간 상태)
        ↓
   Metrics Exporter
        ↓
   Prometheus
        ↓
   Grafana (시각화)

LLM Layer (FastAPI)
   ├─ Ollama (deepseek-coder:6.7b)
   ├─ Incident Classifier
   ├─ Root Cause Analyzer
   └─ Incident Reporter
        ↓
   Kafka (Report Topic)
        ↓
   Notification Service
        ├─ Slack
        └─ Email
```

---

## 🔗 주요 접속 링크

### 웹 UI
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **LLM API 문서**: http://localhost:8000/docs
- **인시던트 대시보드**: http://localhost:8080

### API 엔드포인트
- **인시던트 분류**: `POST http://localhost:8000/api/v1/classify`
- **근본 원인 분석**: `POST http://localhost:8000/api/v1/analyze`
- **인시던트 리포트**: `POST http://localhost:8000/api/v1/report`
- **LLM 체인 실행**: `POST http://localhost:8000/api/v1/chain`

### 메트릭 엔드포인트
- **LLM Layer**: http://localhost:8000/metrics
- **Event Processor**: http://localhost:9091/metrics
- **Metrics Exporter**: http://localhost:9093/metrics

