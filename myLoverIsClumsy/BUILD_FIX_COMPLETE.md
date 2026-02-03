# 빌드 충돌 문제 해결

## 문제 발견

빌드 로그에서 다음 메시지가 발견되었습니다:

```
Environment variables with visibility "Plain text" and "Sensitive" loaded from the "preview" environment on EAS: EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_SUPABASE_URL.
Environment variables loaded from the "preview" build profile "env" configuration: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY.
The following environment variables are defined in both the "preview" build profile "env" configuration and the "preview" environment on EAS: EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_SUPABASE_URL. The values from the build profile configuration will be used.
```

### 문제 원인
- ✅ EAS 환경 변수는 정상적으로 로드됨
- ❌ `eas.json`의 `env` 섹션이 EAS 환경 변수와 충돌
- ❌ 빌드 프로필 설정 값이 사용되어 빌드 실패

## 해결

`eas.json`에서 `preview`와 `production` 프로필의 `env` 섹션을 제거했습니다.

### 수정 전:
```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "${EXPO_PUBLIC_SUPABASE_URL}",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "${EXPO_PUBLIC_SUPABASE_ANON_KEY}"
      }
    }
  }
}
```

### 수정 후:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    }
  }
}
```

이제 EAS 환경 변수만 사용됩니다.

## 다음 단계

다시 빌드하세요:

```bash
eas build --platform android --profile preview
```

### 예상 빌드 로그

다음과 같은 메시지만 나와야 합니다 (충돌 메시지 없음):

```
Environment variables with visibility "Plain text" and "Sensitive" loaded from the "preview" environment on EAS: EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_SUPABASE_URL.
```

충돌 메시지는 더 이상 나오지 않아야 합니다.

### 빌드 로그에서 확인할 내용

빌드 로그에서 다음 메시지를 찾으세요:

```
🔍 app.config.js - 환경 변수 확인:
  process.env.EXPO_PUBLIC_SUPABASE_URL: ✅ 있음 (...)
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY: ✅ 있음 (...)
  최종 supabaseUrl: ✅ 설정됨 (...)
  최종 supabaseAnonKey: ✅ 설정됨 (...)
```

**"✅ 있음"이 나오면:** 환경 변수가 정상적으로 설정된 것입니다!

## 참고

- `eas.json`의 `env` 섹션은 빌드 프로필별로 다른 값을 설정할 때 사용됩니다
- 하지만 EAS 환경 변수를 사용하는 경우, `env` 섹션을 제거하고 EAS 환경 변수만 사용하는 것이 더 깔끔합니다
- EAS 환경 변수는 프로젝트 또는 계정 레벨에서 관리할 수 있습니다
