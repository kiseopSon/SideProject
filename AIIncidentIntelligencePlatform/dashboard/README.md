# AIOps Dashboard

인시던트 실시간 모니터링 대시보드

## 실행 방법

```bash
# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 패키지 설치
pip install -r requirements.txt

# 서비스 실행
uvicorn main:app --reload --port 8080
```

## 접속

브라우저에서 http://localhost:8080 접속

## API 엔드포인트

- `GET /`: 대시보드 메인 페이지
- `GET /api/stats`: 인시던트 통계 조회
- `GET /api/incidents?limit=20`: 최근 인시던트 목록 조회
- `GET /api/incidents/{incident_id}`: 인시던트 상세 정보 조회

## 문제 해결

### 404 오류

1. Dashboard 서비스가 실행 중인지 확인
2. 포트 8080이 사용 중인지 확인
3. 브라우저 콘솔에서 정확한 오류 메시지 확인

### 데이터가 표시되지 않음

1. Redis가 실행 중인지 확인: `docker ps | findstr redis`
2. Notification Service가 리포트를 Redis에 저장하고 있는지 확인
3. 테스트 리포트 전송: `python scripts/test-notification.py`
