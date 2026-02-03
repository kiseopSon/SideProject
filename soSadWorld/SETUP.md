# soSadWorld 프로젝트 설정 가이드

## 1. 인프라 실행

Docker Compose를 사용하여 필요한 인프라 서비스들을 실행합니다.

```bash
docker-compose up -d
```

실행되는 서비스:
- PostgreSQL (포트 5432)
- Redis (포트 6379)
- Consul (포트 8500)
- Keycloak (포트 8090)
- Zipkin (포트 9411)

## 2. Keycloak 설정

### 2.1 Keycloak 접속
- URL: http://localhost:8090
- 관리자 계정: admin / admin

### 2.2 Realm 생성
1. 왼쪽 상단 "Master" 클릭 → "Create Realm" 선택
2. Realm name: `sosadworld`
3. "Create" 클릭

### 2.3 Client 생성
1. 왼쪽 메뉴: Clients → "Create client"
2. Client ID: `sosadworld-client`
3. Client protocol: `openid-connect`
4. "Next" 클릭
5. Settings:
   - Access Type: `public` 또는 `confidential` (선택)
   - Valid Redirect URIs: `http://localhost:3000/*`
   - Web Origins: `http://localhost:3000`
6. "Save" 클릭

### 2.4 사용자 생성 (테스트용)
1. 왼쪽 메뉴: Users → "Add user"
2. Username 입력
3. "Save" 클릭
4. "Credentials" 탭 → 비밀번호 설정

## 3. Ollama 설정

### 3.1 Ollama 설치
https://ollama.ai/download 에서 다운로드 및 설치

### 3.2 모델 다운로드
```bash
ollama pull llama2
# 또는 한국어 지원 모델 (있는 경우)
ollama pull mistral
```

### 3.3 모델 테스트
```bash
ollama run llama2 "안녕하세요"
```

### 3.4 application.yml 설정
`ai-analysis-service/src/main/resources/application.yml`에서 모델명 확인:
```yaml
ollama:
  base-url: http://localhost:11434
  model: llama2  # 다운로드한 모델명으로 변경
```

## 4. 데이터베이스 초기화

PostgreSQL에 필요한 데이터베이스 생성:
```bash
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE keycloak;"
```

(이미 docker-compose.yml에서 자동 생성될 수 있음)

## 5. 서비스 실행 순서

1. 인프라 서비스 실행 (Docker Compose)
2. Keycloak 설정 완료
3. Ollama 실행 확인
4. 백엔드 서비스 실행 (순서 무관)
5. 프론트엔드 실행

## 6. 확인 사항

- Consul UI: http://localhost:8500 (서비스 등록 상태)
- Zipkin UI: http://localhost:9411 (분산 추적)
- Keycloak Admin: http://localhost:8090
- 각 서비스 Health Check:
  - Gateway: http://localhost:8080/actuator/health
  - Diary Service: http://localhost:8081/actuator/health
  - AI Analysis Service: http://localhost:8082/actuator/health
  - Analysis Result Service: http://localhost:8083/actuator/health

## 7. 문제 해결

### Ollama 연결 실패
- Ollama가 실행 중인지 확인: `ollama list`
- 포트 확인: 기본 포트 11434

### Keycloak 연결 실패
- Keycloak이 완전히 시작될 때까지 대기 (약 1-2분)
- Keycloak 로그 확인: `docker-compose logs keycloak`

### 서비스 간 통신 실패
- Consul에 서비스가 등록되었는지 확인
- Gateway 라우팅 설정 확인
