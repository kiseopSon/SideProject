# 환경 변수 문제 최종 해결

## 문제
- 계정 레벨(`/accounts/sonkiseop/settings/environment-variables`)에 환경 변수가 없음
- 앱에서 여전히 환경 변수가 없다고 나옴

## 해결

### 1. ✅ eas.json 수정 완료
`preview` 프로필에 `env` 섹션 추가했습니다.

### 2. ✅ 환경 변수 재설정 완료
EAS CLI로 다음 환경 변수를 **프로젝트 레벨**에 생성했습니다:
- `EXPO_PUBLIC_SUPABASE_URL` (preview, production)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (preview, production)

### 3. ⚠️ 중요: 올바른 웹사이트 경로

**계정 레벨 (X) - 여기는 비어있음:**
- https://expo.dev/accounts/sonkiseop/settings/environment-variables

**프로젝트 레벨 (O) - 여기서 확인해야 함:**
- https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy/settings/environment-variables

또는:
1. https://expo.dev 접속
2. Projects 클릭
3. my-lover-is-clumsy 프로젝트 클릭
4. Settings → Environment variables (또는 Secrets)

## 다음 단계: 반드시 다시 빌드!

환경 변수가 빌드에 포함되려면 **다시 빌드**해야 합니다:

```bash
eas build --platform android --profile preview
```

## 빌드 로그 확인

빌드 로그에서 다음을 확인하세요:

```
🔍 app.config.js - 환경 변수 확인:
  process.env.EXPO_PUBLIC_SUPABASE_URL: ✅ 있음 (...)
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY: ✅ 있음 (...)
  최종 supabaseUrl: ✅ 설정됨 (...)
  최종 supabaseAnonKey: ✅ 설정됨 (...)
```

만약 "❌ 없음"이 나오면:
- EAS Secrets가 빌드에 포함되지 않은 것
- 빌드 로그 전체를 확인해야 함

## 확인 명령어

환경 변수가 제대로 설정되었는지 확인:

```bash
# preview 환경 변수 확인
eas env:list preview --scope project

# production 환경 변수 확인  
eas env:list production --scope project
```

(대화형 입력이 필요할 수 있음)
