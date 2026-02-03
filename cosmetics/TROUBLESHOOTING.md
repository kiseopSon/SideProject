# 문제 해결 가이드 🔧

## 발생한 오류들 설명

### 1. CORS 오류 (가장 중요)
```
Access to XMLHttpRequest at 'http://localhost:8000/api/analyze' from origin 'http://localhost:5175' 
has been blocked by CORS policy
```

**원인**: 백엔드 서버가 프론트엔드의 요청을 차단하고 있습니다.

**해결 방법**:
1. 백엔드 서버가 실행 중인지 확인하세요
2. 포트 번호가 올바른지 확인하세요 (프론트엔드: 5175, 백엔드: 8000)
3. 백엔드 서버를 재시작하세요 (변경사항 적용)

### 2. 404 오류
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**원인**: 
- 백엔드 서버가 실행되지 않았거나
- API 경로가 잘못되었을 수 있습니다

**해결 방법**:
1. 백엔드 서버 실행 확인: `http://localhost:8000` 에 접속하여 확인
2. API 경로 확인: `/api/analyze` 가 올바른지 확인

### 3. 네트워크 오류
```
net::ERR_FAILED
```

**원인**: 서버에 연결할 수 없습니다.

**해결 방법**:
1. 백엔드 서버가 실행 중인지 확인
2. 방화벽이나 보안 프로그램이 포트를 차단하지 않는지 확인

### 4. 메시지 채널 오류
```
A listener indicated an asynchronous response by returning true, but the message channel closed
```

**원인**: 브라우저 확장 프로그램(특히 CORS 관련)이 문제를 일으킬 수 있습니다.

**해결 방법**:
- 브라우저 확장 프로그램을 비활성화하거나
- 시크릿 모드로 테스트해보세요

## 서버 실행 확인 방법

### 백엔드 서버 확인
브라우저나 터미널에서 다음 URL에 접속:
```bash
curl http://localhost:8000
# 또는 브라우저에서 http://localhost:8000 접속
```

응답이 오면 서버가 정상 실행 중입니다.

### API 엔드포인트 확인
```bash
curl http://localhost:8000/api/analyze -X POST -H "Content-Type: application/json" -d "{\"ingredients\":\"테스트\",\"skin_type\":\"oily\"}"
```

## 단계별 해결 절차

1. **백엔드 서버 실행**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **프론트엔드 서버 실행** (새 터미널)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **브라우저에서 확인**
   - 프론트엔드: http://localhost:5175 (또는 표시된 포트)
   - 백엔드: http://localhost:8000

4. **CORS 오류가 계속되면**
   - 백엔드 서버를 재시작하세요
   - 브라우저 캐시를 지우고 새로고침하세요
   - 시크릿 모드로 테스트해보세요

## 현재 설정된 포트

- **백엔드**: 8000 (변경 가능)
- **프론트엔드**: 5175 (Vite가 자동으로 다음 사용 가능한 포트 선택)

## 추가된 성분 데이터

다음 성분들이 데이터베이스에 추가되었습니다:
- 정제수
- 암모늄라우릴설페이트
- 소듐라우레스설페이트
- 소듐라우릴설페이트
- 구주소나무싹추출물

