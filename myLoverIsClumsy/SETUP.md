# My Lover is Clumsy - 설정 가이드

## 1. 프로젝트 초기 설정

### 패키지 설치
```bash
npm install
```

### Expo CLI 설치 (전역)
```bash
npm install -g expo-cli
```

## 2. Supabase 설정

### 2.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트 생성
2. 프로젝트 설정에서 URL과 Anon Key 복사

### 2.2 데이터베이스 스키마 설정
1. Supabase 대시보드에서 SQL Editor 열기
2. `supabase/schema.sql` 파일의 내용을 복사하여 실행
3. Authentication 설정에서 Email 인증 활성화

### 2.3 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_PROJECT_ID=your_expo_project_id
```

## 3. Expo 프로젝트 설정

### 3.1 Expo 프로젝트 ID 확인
```bash
npx expo whoami
```

프로젝트 ID는 `app.json`의 `expo.slug` 또는 Expo 대시보드에서 확인할 수 있습니다.

### 3.2 푸시 알림 설정
- iOS: Apple Developer 계정 필요
- Android: Firebase Cloud Messaging 설정 필요

자세한 내용은 [Expo Notifications 문서](https://docs.expo.dev/versions/latest/sdk/notifications/) 참고

## 4. 앱 실행

### 개발 서버 시작
```bash
npm start
```

### 특정 플랫폼 실행
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 5. 주요 기능 테스트

1. **회원가입/로그인**: 이메일과 비밀번호로 계정 생성
2. **커플 연결**: 연결 코드 생성 및 입력
3. **할일 등록**: 시간대별 할일 추가
4. **알림**: 할일 시간에 알림 수신 확인
5. **완료 체크**: 할일 완료 시 상대방 알림 확인

## 6. 문제 해결

### Supabase 연결 오류
- 환경 변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 알림이 작동하지 않음
- 디바이스에서 알림 권한이 허용되었는지 확인
- Expo 프로젝트 ID가 올바르게 설정되었는지 확인
- 실제 디바이스에서 테스트 (시뮬레이터에서는 제한적)

### 빌드 오류
- `node_modules` 삭제 후 재설치: `rm -rf node_modules && npm install`
- Expo 캐시 클리어: `npx expo start -c`
