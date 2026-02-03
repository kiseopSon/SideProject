# EAS Secrets 환경 변수 설정 가이드 (단계별)

## ⚠️ 중요: 이 설정 없이는 앱이 작동하지 않습니다!

## 1단계: Supabase 정보 확인

Supabase 대시보드에서 다음 정보를 확인하세요:

1. **Supabase 대시보드 접속**: https://supabase.com/dashboard
2. 프로젝트 선택
3. 왼쪽 사이드바에서 **Settings** (⚙️) 클릭
4. **API** 메뉴 클릭
5. 다음 정보를 복사:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co` 형식
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 형식 (매우 긴 문자열)

## 2단계: EAS 웹사이트에서 환경 변수 설정 (가장 쉬운 방법)

### 방법 1: 웹사이트에서 직접 설정

1. **Expo 웹사이트 접속**: https://expo.dev
2. 로그인 후 **프로젝트 선택**: `my-lover-is-clumsy`
3. 왼쪽 메뉴에서 **Environment variables** 또는 **Secrets** 클릭
   - 또는 URL: https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy/variables
4. **"Create Secret"** 또는 **"Add Variable"** 버튼 클릭
5. 첫 번째 변수 추가:
   - **Name**: `EXPO_PUBLIC_SUPABASE_URL`
   - **Value**: Supabase Project URL (예: `https://abcdefghijklmnop.supabase.co`)
   - **Visibility**: **"Sensitive"** 선택 (⚠️ 중요!)
   - **Environments**: `preview`, `production` 체크
   - **"Create"** 클릭
6. 두 번째 변수 추가:
   - **"Create Secret"** 또는 **"Add Variable"** 버튼 다시 클릭
   - **Name**: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Supabase anon public key (매우 긴 문자열 전체 복사)
   - **Visibility**: **"Sensitive"** 선택 (⚠️ 중요!)
   - **Environments**: `preview`, `production` 체크
   - **"Create"** 클릭

### ⚠️ 중요 사항:
- **Visibility를 "Sensitive"로 설정해야 합니다!** (Plain text도 가능하지만 보안상 Sensitive 권장)
- **"Secret"으로 설정하면 안 됩니다!** (Secret은 빌드 스크립트에서만 사용됨)
- 두 변수 모두 `preview`와 `production` 환경에 추가

## 3단계: 설정 확인

터미널에서 확인:

```bash
eas secret:list
```

다음과 같이 두 개가 보여야 합니다:
- `EXPO_PUBLIC_SUPABASE_URL` (Sensitive)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Sensitive)

## 4단계: 다시 빌드

환경 변수 설정 후 **반드시 다시 빌드**해야 합니다:

```bash
eas build --platform android --profile preview
```

## 문제 해결

### "Create Secret" 버튼이 보이지 않는 경우
- 프로젝트가 올바르게 선택되었는지 확인
- URL 직접 접속: https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy/variables

### 값 입력 후 "Create" 버튼이 작동하지 않는 경우
- URL에 `https://`가 포함되었는지 확인
- Key에 공백이나 줄바꿈이 없는지 확인
- 다시 시도

### 빌드 후에도 여전히 오류가 발생하는 경우
1. 빌드가 완료될 때까지 대기
2. 이전 APK 삭제 후 새로 다운로드
3. 앱 재설치

## 빠른 확인 명령어

```bash
# 환경 변수 목록 확인
eas secret:list

# 특정 변수 확인 (값은 표시되지 않지만 존재 여부 확인 가능)
eas secret:list | Select-String "EXPO_PUBLIC_SUPABASE"
```
