# Keycloak 설정 가이드

## 1. Keycloak 접속

1. Docker Compose 실행 후 Keycloak이 시작될 때까지 대기 (약 1-2분)
2. 브라우저에서 http://localhost:8090 접속
3. 관리자 계정으로 로그인:
   - Username: `admin`
   - Password: `admin`

## 2. Realm 생성

### 2.1 Realm 생성
1. 왼쪽 상단 "Master" 드롭다운 클릭
2. "Create Realm" 선택
3. Realm name: `sosadworld` 입력
4. "Create" 버튼 클릭

### 2.2 Realm 설정 확인
- 생성 후 자동으로 `sosadworld` Realm으로 전환됨
- 왼쪽 상단에 "sosadworld" 표시 확인

## 3. Client 생성 및 설정

### 3.1 Client 생성
1. 왼쪽 메뉴에서 "Clients" 클릭
2. 오른쪽 상단 "Create client" 버튼 클릭
3. Client ID: `sosadworld-client` 입력
4. Client protocol: `openid-connect` 선택 (기본값)
5. "Next" 버튼 클릭

### 3.2 Client 설정
**Capability config:**
- Client authentication: `OFF` (Public client)
- Authorization: `OFF`
- Authentication flow overrides: `OFF`
- "Next" 버튼 클릭

**Login settings:**
- Root URL: `http://localhost:3000`
- Home URL: `http://localhost:3000`
- Valid redirect URIs: 
  ```
  http://localhost:3000/*
  http://localhost:3000
  ```
- Valid post logout redirect URIs:
  ```
  http://localhost:3000/*
  http://localhost:3000
  ```
- Web origins:
  ```
  http://localhost:3000
  *
  ```
- "Save" 버튼 클릭

### 3.3 Client 설정 확인 및 수정
1. Clients 목록에서 `sosadworld-client` 클릭
2. Settings 탭에서 확인:
   - Access Type: `public`
   - Standard Flow Enabled: `ON`
   - Direct Access Grants Enabled: `ON`
   - Valid Redirect URIs가 올바르게 설정되었는지 확인

## 4. 사용자 생성

### 4.1 사용자 추가
1. 왼쪽 메뉴에서 "Users" 클릭
2. 오른쪽 상단 "Add user" 버튼 클릭
3. Username: 원하는 사용자명 입력 (예: `testuser`)
4. Email: 이메일 주소 입력 (선택사항)
5. Email verified: `ON` (이메일 입력한 경우)
6. "Create" 버튼 클릭

### 4.2 비밀번호 설정
1. 생성된 사용자의 "Credentials" 탭 클릭
2. "Set password" 버튼 클릭
3. Password: 원하는 비밀번호 입력
4. Password confirmation: 동일한 비밀번호 재입력
5. Temporary: `OFF` (영구 비밀번호 설정)
6. "Save" 버튼 클릭
7. 확인 팝업에서 "Save" 클릭

## 5. 백엔드 서비스 설정 확인

각 서비스의 `application.yml`에서 Keycloak 설정 확인:

### 5.1 Issuer URI 확인
모든 백엔드 서비스에서 다음 설정 확인:
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8090/realms/sosadworld
```

### 5.2 Realm 공개 키 확인
브라우저에서 다음 URL 접속하여 설정이 올바른지 확인:
```
http://localhost:8090/realms/sosadworld/.well-known/openid-configuration
```

정상적으로 JSON 응답이 오면 설정이 올바릅니다.

## 6. 테스트

### 6.1 Token 발급 테스트
```bash
curl -X POST "http://localhost:8090/realms/sosadworld/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=sosadworld-client" \
  -d "username=testuser" \
  -d "password=yourpassword" \
  -d "grant_type=password"
```

응답에서 `access_token`이 반환되면 정상입니다.

### 6.2 서비스 연결 테스트
1. 위의 토큰을 복사
2. 백엔드 API에 Authorization 헤더로 전송:
```bash
curl -H "Authorization: Bearer <access_token>" \
  http://localhost:8080/api/diaries
```

## 7. 트러블슈팅

### Keycloak이 시작되지 않음
- Docker 로그 확인: `docker-compose logs keycloak`
- PostgreSQL 연결 확인: `docker-compose ps`

### 토큰 검증 실패
- Issuer URI 확인: `http://localhost:8090/realms/sosadworld`
- Realm 이름 확인: `sosadworld`
- Client 설정 확인: Valid Redirect URIs, Web Origins

### CORS 오류
- Web Origins에 `*` 또는 프론트엔드 URL 추가
- Valid Redirect URIs 확인

## 8. 프로덕션 환경 참고사항

프로덕션 환경에서는:
- 관리자 비밀번호 변경 필수
- HTTPS 사용 필수
- Client를 confidential로 설정 고려
- Realm 설정 최적화 (토큰 만료 시간 등)
