# app.config.js에서 직접 환경 변수 설정 (임시 해결책)

## 현재 문제
- 웹사이트에서 환경 변수 설정 페이지를 찾을 수 없음
- EAS CLI로 설정했지만 확인이 어려움
- 앱에서 여전히 환경 변수가 없다고 나옴

## 임시 해결책: app.config.js에 직접 값 하드코딩

**⚠️ 주의: 이 방법은 테스트용이며, 보안상 좋지 않습니다.**
**⚠️ 하지만 EAS Build에서만 작동하고, 로컬 개발에서는 작동하지 않을 수 있습니다.**

### 수정 내용

`app.config.js`에 기본값을 추가했습니다. 하지만 **EAS Build에서는 이 값이 사용되지 않을 수 있습니다** 왜냐하면:
- EAS Build는 빌드 시점에 `app.config.js`를 실행하지만
- `.env` 파일은 포함되지 않습니다
- 하드코딩된 값도 보안상 제한될 수 있습니다

## 올바른 해결책: 빌드 시 환경 변수 확인

### 1. 빌드 실행
```bash
eas build --platform android --profile preview
```

### 2. 빌드 로그 확인

빌드 로그에서 다음 메시지를 찾으세요:

```
🔍 app.config.js - 환경 변수 확인:
  process.env.EXPO_PUBLIC_SUPABASE_URL: ✅ 있음 (...)
  또는
  process.env.EXPO_PUBLIC_SUPABASE_URL: ❌ 없음
```

**만약 "❌ 없음"이 나오면:**
- EAS Secrets에 환경 변수가 설정되지 않은 것
- 빌드 시점에 환경 변수가 주입되지 않은 것

### 3. 웹사이트에서 확인하는 다른 방법

1. **프로젝트 대시보드 접속:**
   - https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy

2. **Builds 탭 확인:**
   - 프로젝트 페이지에서 "Builds" 탭 클릭
   - 최근 빌드에서 "Environment variables" 또는 "Configuration" 확인

3. **프로젝트 설정 메뉴 찾기:**
   - 프로젝트 페이지에서 다양한 메뉴 클릭해서 확인:
     - "Settings"
     - "Configuration"  
     - "Build Configuration"
     - "Secrets"
     - "Variables"

## 최종 확인 방법

빌드를 실행하고 빌드 로그에서 환경 변수 상태를 확인하는 것이 가장 확실한 방법입니다.
