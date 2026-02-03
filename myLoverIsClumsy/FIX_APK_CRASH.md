# APK 크래시 문제 해결

## 문제 원인
앱이 실행하자마자 크래시하는 이유는 **환경 변수가 빌드에 포함되지 않았기 때문**입니다.

`.env` 파일은 `.gitignore`에 포함되어 있어 빌드에 포함되지 않습니다.

## 해결 방법

### 1. .env 파일에서 실제 값 확인

프로젝트 루트의 `.env` 파일을 열어서 다음 값들을 확인하세요:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 2. EAS Secrets에 환경 변수 설정

터미널에서 다음 명령어를 실행하세요 (**실제 값으로 교체**):

```bash
# 기존 더미 값 삭제
eas secret:delete --id a2b018d4-7448-478c-9955-911561c539e3

# 실제 Supabase URL 설정 (실제 값으로 교체!)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --type string --value "https://your-actual-project-id.supabase.co"

# Supabase Anon Key 설정 (실제 값으로 교체!)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --type string --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. 다시 빌드

환경 변수 설정 후 다시 빌드:

```bash
eas build --platform android --profile preview
```

## 빠른 해결 방법

`.env` 파일이 있다면, 다음 명령어로 한 번에 설정할 수 있습니다:

```powershell
# .env 파일에서 값 읽기
$envContent = Get-Content .env
$supabaseUrl = ($envContent | Select-String "EXPO_PUBLIC_SUPABASE_URL=").ToString().Split("=")[1]
$supabaseKey = ($envContent | Select-String "EXPO_PUBLIC_SUPABASE_ANON_KEY=").ToString().Split("=")[1]

# EAS Secrets에 설정
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --type string --value $supabaseUrl
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --type string --value $supabaseKey
```

## 확인

환경 변수가 제대로 설정되었는지 확인:

```bash
eas secret:list
```

두 개의 secret이 보여야 합니다:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
