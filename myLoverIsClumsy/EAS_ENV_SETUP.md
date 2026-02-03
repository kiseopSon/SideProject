# EAS 빌드 환경 변수 설정 가이드

## 문제
APK 빌드 시 `.env` 파일이 포함되지 않아 환경 변수가 없어 앱이 크래시합니다.

## 해결 방법: EAS Secrets 설정

### 1. Supabase URL과 Key 확인
`.env` 파일에서 다음 값들을 확인하세요:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 2. EAS Secrets에 환경 변수 추가

터미널에서 다음 명령어를 실행하세요 (실제 값으로 교체):

```bash
# Supabase URL 설정
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --type string --value "https://your-project.supabase.co"

# Supabase Anon Key 설정
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --type string --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

또는 웹에서 설정:
1. https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy 접속
2. Settings > Secrets 메뉴
3. "Create Secret" 클릭
4. 이름과 값 입력

### 3. 다시 빌드

환경 변수 설정 후 다시 빌드:

```bash
eas build --platform android --profile preview
```

## 확인 방법

빌드 전에 환경 변수가 설정되었는지 확인:

```bash
eas secret:list
```
