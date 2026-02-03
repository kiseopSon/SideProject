# 오류 해결 가이드 🔧

## 발생한 오류들

### 1. ModuleNotFoundError: No module named 'requests'
**원인**: 필요한 Python 패키지가 설치되지 않았습니다.

**해결 방법**:
```bash
cd backend
python -m pip install -r requirements.txt
```

또는 개별 설치:
```bash
python -m pip install requests beautifulsoup4 lxml schedule
```

### 2. CORS 오류
**원인**: 백엔드 서버가 재시작되지 않았거나 실행되지 않았습니다.

**해결 방법**:
1. 백엔드 서버 실행:
```bash
cd backend
uvicorn main:app --reload
```

2. 서버가 실행 중인지 확인:
   - 브라우저에서 `http://localhost:8000` 접속
   - 또는 `http://localhost:8000/docs` 접속 (API 문서)

### 3. 500 Internal Server Error
**원인**: 서버 내부 오류 (코드 오류 또는 모듈 누락)

**해결 방법**:
1. 터미널에서 서버 로그 확인
2. 필요한 패키지가 모두 설치되었는지 확인
3. 서버 재시작

### 4. net::ERR_CONNECTION_RESET
**원인**: 서버가 응답하지 않거나 종료되었습니다.

**해결 방법**: 백엔드 서버를 재시작하세요.

## 단계별 해결 절차

### Step 1: 패키지 설치
```bash
cd backend
python -m pip install -r requirements.txt
```

### Step 2: 백엔드 서버 시작
```bash
cd backend
uvicorn main:app --reload
```

서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 3: 프론트엔드 확인
프론트엔드는 이미 실행 중이어야 합니다. 만약 실행되지 않았다면:
```bash
cd frontend
npm install
npm run dev
```

### Step 4: 테스트
1. 브라우저에서 `http://localhost:5175` 접속
2. 성분표 입력하여 테스트

## 일반적인 문제들

### Python 가상환경 사용 (권장)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 포트 충돌
만약 8000 포트가 이미 사용 중이면:
```bash
uvicorn main:app --reload --port 8001
```

그리고 `frontend/src/services/api.ts`에서 포트를 수정:
```typescript
const API_BASE_URL = 'http://localhost:8001'
```

## 문제가 계속되면

1. 터미널 로그 확인
2. 브라우저 개발자 도구의 Network 탭에서 정확한 오류 메시지 확인
3. 서버 로그에서 Python 오류 메시지 확인

