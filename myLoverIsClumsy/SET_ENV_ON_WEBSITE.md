# EAS 환경 변수 웹사이트에서 설정하는 방법

## 올바른 링크 (프로젝트별 환경 변수)

**프로젝트 설정**에서 환경 변수를 설정해야 합니다:

1. https://expo.dev 접속 및 로그인
2. 우측 상단 프로필 클릭 → **Projects** 선택
3. **my-lover-is-clumsy** 프로젝트 클릭
4. 왼쪽 메뉴에서 **Settings** 클릭
5. **Environment variables** 또는 **Variables** 메뉴 찾기
   - 또는 URL: https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy/settings/environment-variables

## 환경 변수 추가

**"Add Variable"** 또는 **"Create Variable"** 버튼 클릭 후:

### 첫 번째 변수:
- **Name**: `EXPO_PUBLIC_SUPABASE_URL`
- **Value**: `https://rwnzjxqybphkopcbvkid.supabase.co`
- **Visibility**: **"Sensitive"** 또는 **"Plain text"** 선택 (⚠️ 중요: "Secret" 아님!)
- **Environments**: `preview`, `production` 체크
- **Create** 클릭

### 두 번째 변수:
- **Name**: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bnpqeHF5YnBoa29wY2J2a2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NzU5NzUsImV4cCI6MjA4MzQ1MTk3NX0.oZprrAcj0aG2IJ6gDmii8ZyQfz6v15V_wSu9M3cPp68`
- **Visibility**: **"Sensitive"** 또는 **"Plain text"** 선택
- **Environments**: `preview`, `production` 체크
- **Create** 클릭

## 확인

설정 후 다시 빌드하면 환경 변수가 포함됩니다.
