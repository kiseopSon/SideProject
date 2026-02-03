# EAS Secrets 환경 변수 설정 (바로 실행)

## 현재 상황
- `.env` 파일에 Supabase 정보가 있음
- EAS Secrets에 이름은 있지만 값이 제대로 설정되지 않았을 수 있음
- 웹사이트에서 "아무것도 없다"고 표시됨

## 해결 방법: EAS CLI로 직접 설정

터미널에서 다음 명령어를 실행하세요:

### 1. 기존 secret 삭제 (선택사항)
```bash
# 기존 변수 삭제 (오류가 나면 무시해도 됩니다)
eas secret:delete --scope project --name EXPO_PUBLIC_SUPABASE_URL
eas secret:delete --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### 2. 새로운 secret 생성

**중요**: 아래 값들을 `.env` 파일의 실제 값으로 교체하세요!

```bash
# Supabase URL 설정
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --type string --value "https://rwnzjxqybphkopcbvkid.supabase.co" --visibility sensitive --environments preview,production

# Supabase Anon Key 설정 (아래 전체 한 줄로 입력)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --type string --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bnpqeHF5YnBoa29wY2J2a2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NzU5NzUsImV4cCI6MjA4MzQ1MTk3NX0.oZprrAcj0aG2IJ6gDmii8ZyQfz6v15V_wSu9M3cPp68" --visibility sensitive --environments preview,production
```

### 3. 확인

```bash
eas secret:list
```

두 개의 secret이 보여야 합니다:
- `EXPO_PUBLIC_SUPABASE_URL` (sensitive, preview, production)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (sensitive, preview, production)

### 4. 다시 빌드

```bash
eas build --platform android --profile preview
```

## 자동 스크립트 (PowerShell)

`.env` 파일이 있다면 다음 스크립트를 실행하세요:

```powershell
# .env 파일에서 값 읽기
$envContent = Get-Content .env -Raw
$urlLine = ($envContent -split "`n" | Where-Object { $_ -match "EXPO_PUBLIC_SUPABASE_URL=" })[0]
$keyLine = ($envContent -split "`n" | Where-Object { $_ -match "EXPO_PUBLIC_SUPABASE_ANON_KEY=" })[0]

$url = $urlLine -replace "EXPO_PUBLIC_SUPABASE_URL=", "" -replace "`r", "" -replace "`n", ""
$key = $keyLine -replace "EXPO_PUBLIC_SUPABASE_ANON_KEY=", "" -replace "`r", "" -replace "`n", ""

Write-Host "URL: $url"
Write-Host "Key: $($key.Substring(0, 50))..."

# 기존 secret 삭제 시도 (오류 무시)
eas secret:delete --scope project --name EXPO_PUBLIC_SUPABASE_URL 2>$null
eas secret:delete --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY 2>$null

# 새로운 secret 생성
Write-Host "`n[1/2] EXPO_PUBLIC_SUPABASE_URL 생성 중..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --type string --value $url --visibility sensitive --environments preview,production

Write-Host "`n[2/2] EXPO_PUBLIC_SUPABASE_ANON_KEY 생성 중..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --type string --value $key --visibility sensitive --environments preview,production

Write-Host "`n✅ 완료! 다음 명령어로 빌드하세요:"
Write-Host "eas build --platform android --profile preview"
```
