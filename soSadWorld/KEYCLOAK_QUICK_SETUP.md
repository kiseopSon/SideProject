# Keycloak 빠른 설정 가이드

## 1. Keycloak 접속
- URL: http://localhost:8090
- 관리자 계정: `admin` / `admin`

## 2. Realm 생성 (필수)

1. 왼쪽 상단 "Master" 클릭
2. "Create Realm" 선택
3. Realm name: **`sosadworld`** 입력
4. "Create" 버튼 클릭

## 3. Client 생성 (필수)

1. 왼쪽 메뉴 "Clients" 클릭
2. 오른쪽 상단 "Create client" 클릭
3. **Client ID**: `sosadworld-client` 입력
4. Client protocol: `openid-connect` (기본값)
5. "Next" 클릭
6. **Login settings**에서:
   - Root URL: `http://localhost:3000`
   - Home URL: `http://localhost:3000`
   - Valid redirect URIs: (각 URI를 한 줄씩 입력)
     ```
     http://localhost:3000/*
     http://localhost:3000
     ```
   - Valid post logout redirect URIs: (각 URI를 한 줄씩 입력)
     ```
     http://localhost:3000/*
     http://localhost:3000
     ```
   - Web origins: (각 URI를 한 줄씩 입력)
     ```
     http://localhost:3000
     *
     ```
7. "Save" 클릭

## 4. 사용자 생성 (테스트용)

1. 왼쪽 메뉴 "Users" 클릭
2. "Add user" 클릭
3. Username: 원하는 사용자명 입력 (예: `testuser`)
4. "Create" 클릭
5. "Credentials" 탭 클릭
6. "Set password" 클릭
7. Password 입력
8. Temporary: **OFF** (영구 비밀번호)
9. "Save" 클릭

## 5. 확인

브라우저에서 다음 URL 접속하여 설정 확인:
```
http://localhost:8090/realms/sosadworld/.well-known/openid-configuration
```

JSON이 정상적으로 표시되면 설정 완료!
