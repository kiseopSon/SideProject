# soSadWorld - 우울 일기 분석 프로젝트

## 프로젝트 소개
우울한 사람들을 위한 일기 분석 및 감정 상태 모니터링 시스템

## 기술 스택

### Backend
- Spring Boot 3.x
- Spring Cloud 2023.x
- Spring Cloud Gateway
- Spring Cloud Consul (Service Discovery)
- Spring Cloud Config
- Spring Security + Keycloak (SSO)
- Spring Cloud Sleuth + Zipkin (분산 추적)
- PostgreSQL
- Redis
- Ollama (로컬 AI 모델)

### Frontend
- React + TypeScript + Vite
- Axios
- Recharts (감정 비율 시각화)

### Infrastructure
- Docker Compose
- Keycloak
- Consul
- Zipkin

## 서비스 구조

```
soSadWorld/
├── gateway-service/          # API Gateway
├── diary-service/            # 일기 저장 서비스
├── ai-analysis-service/      # AI 감정 분석 서비스
├── analysis-result-service/  # 분석 결과 서비스
├── frontend/                 # React 프론트엔드
└── docker-compose.yml        # 인프라 설정
```

## 사전 요구사항

- Java 17+
- Node.js 18+ (프론트엔드용)
- Docker & Docker Compose
- Ollama (로컬 설치 필요)

## Ollama 설정

로컬 PC에 Ollama가 설치되어 있어야 합니다. 

1. Ollama 설치: https://ollama.ai/download
2. 감정 분석에 적합한 모델 다운로드 (예: llama2, mistral 등)
```bash
ollama pull llama2
# 또는 다른 모델
ollama pull mistral
```

3. `ai-analysis-service/src/main/resources/application.yml`에서 모델명 설정:
```yaml
ollama:
  base-url: http://localhost:11434
  model: llama2  # 다운로드한 모델명으로 변경
```

## 실행 방법

1. Docker Compose로 인프라 실행
```bash
docker-compose up -d
```

2. Keycloak 설정 (최초 1회)
   - http://localhost:8090 접속
   - Admin 콘솔 로그인 (admin/admin)
   - Realm 생성: `sosadworld`
   - Client 생성 및 설정
   - 각 서비스의 `application.yml`에서 issuer-uri 확인/수정

3. 각 서비스 실행 (개발 모드)

**방법 1: 스크립트 사용 (권장)**
```powershell
# PowerShell에서 실행
.\start-backend-services.ps1

# 또는 배치 파일 실행
start-backend-services.bat
```

**방법 2: 수동 실행**
각 서비스를 별도 터미널에서 실행:
```bash
# Gateway (포트 8080)
cd gateway-service && ./gradlew bootRun

# Diary Service (포트 8081)
cd diary-service && ./gradlew bootRun

# AI Analysis Service (포트 8082)
cd ai-analysis-service && ./gradlew bootRun

# Analysis Result Service (포트 8083)
cd analysis-result-service && ./gradlew bootRun
```

**Windows에서는:**
```cmd
# Gateway (포트 8080)
cd gateway-service && gradlew.bat bootRun

# Diary Service (포트 8081)
cd diary-service && gradlew.bat bootRun

# AI Analysis Service (포트 8082)
cd ai-analysis-service && gradlew.bat bootRun

# Analysis Result Service (포트 8083)
cd analysis-result-service && gradlew.bat bootRun
```

4. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

## 주요 기능

- 일기 작성 및 저장 (특수문자 자동 제거)
- AI 기반 감정 분석 (우울/기쁨/화남 %)
- 현재 상황 및 문제가 될 만한 행실 분석
- 정신과 치료 필요 여부 판단
- 분석 결과 시각화 (차트)

## 서비스 포트

- Gateway: 8080
- Diary Service: 8081
- AI Analysis Service: 8082
- Analysis Result Service: 8083
- Frontend: 3000
- Keycloak: 8090
- Consul: 8500
- Zipkin: 9411

## 개발 참고사항

- SSO 통합을 위해 Keycloak Realm 및 Client 설정 필요
- Ollama 모델은 로컬에서 실행되어야 함
- 분산 추적은 Zipkin UI (http://localhost:9411)에서 확인 가능
- Consul UI (http://localhost:8500)에서 서비스 등록 상태 확인 가능

## 상세 설정 가이드

자세한 설정 방법은 다음 문서를 참고하세요:
- [SETUP.md](SETUP.md) - 전체 설정 가이드
- [KEYCLOAK_SETUP.md](KEYCLOAK_SETUP.md) - Keycloak 상세 설정
- [OLLAMA_SETUP.md](OLLAMA_SETUP.md) - Ollama 상세 설정
