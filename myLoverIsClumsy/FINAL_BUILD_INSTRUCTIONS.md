# 🔥 최종 빌드 가이드 - 환경 변수 포함

## ✅ 완료된 작업

1. **app.config.js 생성** - 환경 변수를 명시적으로 포함
2. **lib/supabase.ts 수정** - 여러 방법으로 환경 변수 로드 시도
3. **EAS Secrets 설정** - sensitive visibility로 환경 변수 설정

## ⚠️ 중요: 반드시 다시 빌드하세요!

### 빌드 명령어

```bash
eas build --platform android --profile preview
```

### 빌드 전 확인 사항

1. **EAS Secrets 확인** (웹사이트 또는 CLI)
   ```bash
   # 환경 변수 목록 확인
   eas env:list preview --non-interactive
   ```
   
   다음 두 개가 보여야 합니다:
   - `EXPO_PUBLIC_SUPABASE_URL` (sensitive)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (sensitive)

2. **app.config.js 파일 존재 확인**
   ```bash
   # 파일 확인
   Test-Path app.config.js
   ```

3. **app.json 이름 변경 확인**
   - `app.json`은 `app.json.old`로 변경되었습니다
   - `app.config.js`가 사용됩니다

### 빌드 후 확인

1. **빌드 로그 확인**
   - 환경 변수 관련 오류 메시지가 없어야 함
   - 빌드가 성공적으로 완료되어야 함

2. **새 APK 설치**
   - 이전 APK 삭제
   - 새 APK 다운로드 및 설치

3. **앱 실행 후 로그 확인**
   ```bash
   # Android 로그 확인
   adb logcat | Select-String "Supabase|환경 변수|Placeholder"
   ```
   
   다음과 같이 보여야 합니다:
   ```
   🔍 Supabase 환경 변수 상태:
     URL 설정됨: true
     URL 값: https://rwnzjxqybphkopcbvkid.supabase.co...
     Key 설정됨: true
     Placeholder 사용 중: false  ← 이것이 false여야 합니다!
   ```

   만약 `Placeholder 사용 중: true`가 보이면:
   - 빌드 로그 확인 필요
   - EAS Secrets 재확인 필요

## 문제 해결

### 여전히 "network request failed" 에러가 발생하면

1. **빌드 로그 확인**
   - 빌드 시 환경 변수가 포함되었는지 확인
   - `No environment variables...` 메시지가 있는지 확인

2. **EAS Secrets 재확인**
   - 웹사이트에서 확인: https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy/variables
   - Visibility가 "Sensitive" 또는 "Plain text"인지 확인
   - "Secret"으로 설정되어 있으면 삭제 후 재생성

3. **app.config.js 확인**
   - `extra` 섹션에 `supabaseUrl`과 `supabaseAnonKey`가 있는지 확인

4. **로컬 테스트**
   ```bash
   # 로컬에서 환경 변수 테스트
   node -e "require('./app.config.js')"
   ```

## 빠른 체크리스트

- [ ] `app.config.js` 파일 존재
- [ ] `app.json` 파일 이름 변경됨 (또는 삭제)
- [ ] EAS Secrets에 환경 변수 설정됨 (sensitive)
- [ ] 빌드 실행: `eas build --platform android --profile preview`
- [ ] 새 APK 다운로드 및 설치
- [ ] 앱 실행 후 로그 확인 (`Placeholder 사용 중: false` 확인)
