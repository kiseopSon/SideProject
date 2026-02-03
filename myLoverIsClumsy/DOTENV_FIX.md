# dotenv 패키지 누락 문제 해결

## 문제 발견

빌드가 실패하는 원인을 확인한 결과:

- ❌ `app.config.js`에서 `dotenv` 패키지를 사용하고 있었지만
- ❌ `package.json`에 `dotenv`가 설치되어 있지 않았습니다
- ❌ 이로 인해 빌드 시 `app.config.js` 실행 중 오류 발생 가능

## 해결

### 1. dotenv 패키지 설치

```bash
npm install dotenv --save-dev
```

### 2. app.config.js 정리

하드코딩된 기본값 부분을 제거하여 코드를 정리했습니다.

### 수정 내용

- ✅ `dotenv` 패키지 설치 완료
- ✅ `app.config.js`에서 불필요한 하드코딩된 기본값 제거
- ✅ 코드 정리

## 다음 단계

변경 사항을 커밋하고 다시 빌드하세요:

```bash
git add package.json app.config.js
git commit -m "Fix: Add dotenv package"
eas build --platform android --profile preview
```

## 예상 결과

빌드가 성공해야 합니다:

1. ✅ 환경 변수 정상 로드됨
2. ✅ `app.config.js` 오류 없음
3. ✅ 빌드 성공

## 확인 사항

빌드 로그에서 다음을 확인하세요:

```
🔍 app.config.js - 환경 변수 확인:
  process.env.EXPO_PUBLIC_SUPABASE_URL: ✅ 있음 (...)
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY: ✅ 있음 (...)
  최종 supabaseUrl: ✅ 설정됨 (...)
  최종 supabaseAnonKey: ✅ 설정됨 (...)
```

"✅ 있음" 또는 "✅ 설정됨"이 나오면 정상입니다!
