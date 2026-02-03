# 서비스 실행 가이드

## 1. Keycloak 설정 (먼저 완료 필요)

[KEYCLOAK_QUICK_SETUP.md](KEYCLOAK_QUICK_SETUP.md) 참고하여 설정 완료

## 2. 백엔드 서비스 실행

### 방법 1: 스크립트 사용 (권장)

**PowerShell 스크립트:**
```powershell
.\start-backend-services.ps1
```

**배치 파일:**
```cmd
start-backend-services.bat
```

스크립트를 실행하면 각 서비스가 별도 PowerShell/CMD 창에서 자동으로 실행됩니다.

**서비스 중지:**
```powershell
.\stop-backend-services.ps1
```

또는

```cmd
stop-backend-services.bat
```

### 방법 2: 수동 실행

각 서비스를 별도 터미널에서 실행합니다.

**실행 순서 (의존성 고려):**
1. Diary Service (포트 8081)
2. AI Analysis Service (포트 8082)
3. Analysis Result Service (포트 8083)
4. Gateway Service (포트 8080) - 마지막에 실행

**터미널 1 - Diary Service:**
```bash
cd diary-service
./gradlew bootRun
# Windows: gradlew.bat bootRun
```

**터미널 2 - AI Analysis Service:**
```bash
cd ai-analysis-service
./gradlew bootRun
# Windows: gradlew.bat bootRun
```

**터미널 3 - Analysis Result Service:**
```bash
cd analysis-result-service
./gradlew bootRun
# Windows: gradlew.bat bootRun
```

**터미널 4 - Gateway Service:**
```bash
cd gateway-service
./gradlew bootRun
# Windows: gradlew.bat bootRun
```

## 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

## 확인 방법

- Consul UI: http://localhost:18500 (서비스 등록 확인)
- Zipkin UI: http://localhost:9411 (분산 추적 확인)
- Gateway Health: http://localhost:8080/actuator/health
- Frontend: http://localhost:3000
