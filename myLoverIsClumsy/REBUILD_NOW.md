# ⚠️ 중요: 반드시 다시 빌드하세요!

## 문제
환경 변수를 EAS Secrets에 설정했지만, **이전에 빌드한 APK에는 환경 변수가 포함되지 않았습니다**.

## 해결 방법: 다시 빌드

환경 변수는 **빌드 시점**에 앱 번들에 포함됩니다. 따라서 환경 변수를 설정한 후에는 **반드시 다시 빌드**해야 합니다.

### 1. 빌드 명령어 실행

```bash
eas build --platform android --profile preview
```

### 2. 빌드 로그 확인

빌드 로그에서 다음을 확인하세요:

✅ **정상적인 경우:**
- 환경 변수 관련 오류 메시지가 없음
- 빌드가 성공적으로 완료됨

❌ **문제가 있는 경우:**
- `No environment variables with visibility "Plain text" and "Sensitive" found` 메시지
- → 환경 변수가 앱 번들에 포함되지 않음

### 3. 새 APK 설치

빌드가 완료되면:
1. **이전 APK 삭제** (중요!)
2. **새 APK 다운로드 및 설치**
3. 앱 실행 후 회원가입 테스트

### 4. 로그 확인

앱 실행 후 Android 로그를 확인하세요:

```bash
# Android 로그 확인 (앱 실행 후)
adb logcat | Select-String "Supabase|환경 변수|EXPO_PUBLIC"
```

다음과 같은 로그가 보여야 합니다:
```
🔍 Supabase 환경 변수 상태:
  URL 설정됨: true
  URL 값: https://rwnzjxqybphkopcbvkid.supabase.co...
  Key 설정됨: true
  Placeholder 사용 중: false
```

만약 `Placeholder 사용 중: true`가 보이면:
- 환경 변수가 아직 포함되지 않았음
- 다시 빌드 필요

## 빠른 확인

빌드 전에 환경 변수가 제대로 설정되었는지 확인:

```bash
# 환경 변수 목록 확인
eas env:list preview --non-interactive

# 또는 웹에서 확인
# https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy/variables
```

## 여전히 문제가 있으면

1. 빌드 로그 전체 복사
2. 앱 실행 후 `adb logcat` 로그 복사
3. 두 로그를 함께 확인
