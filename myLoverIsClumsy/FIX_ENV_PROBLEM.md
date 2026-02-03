# 환경 변수 문제 해결 - 최종 방법

## 현재 상황
- 앱에서 `URL 설정: false`, `Key 설정: false`, `Placeholder: true` 표시
- EAS 환경 변수가 실제로 설정되지 않음
- 웹사이트에서 환경 변수를 찾을 수 없음

## 해결 방법 1: 웹사이트에서 직접 설정 (권장)

### 올바른 경로:
1. https://expo.dev 접속 및 로그인
2. 우측 상단 프로필 클릭 → **"Projects"** 선택
3. **"my-lover-is-clumsy"** 프로젝트 클릭
4. 왼쪽 사이드바에서 **"Settings"** 클릭
5. **"Environment variables"** 또는 **"Secrets"** 메뉴 찾기
   - 또는 **"Build configuration"** → **"Environment variables"**
6. **"Add Variable"** 버튼 클릭

### 설정할 값:
**.env 파일에서 복사:**
- URL: `https://rwnzjxqybphkopcbvkid.supabase.co`
- Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bnpqeHF5YnBoa29wY2J2a2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NzU5NzUsImV4cCI6MjA4MzQ1MTk3NX0.oZprrAcj0aG2IJ6gDmii8ZyQfz6v15V_wSu9M3cPp68`

### 중요 사항:
- **Visibility**: "Sensitive" 또는 "Plain text" 선택 (⚠️ "Secret" 아님!)
- **Environments**: `preview`, `production` 모두 체크
- **Name**: 정확히 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 해결 방법 2: 테스트용 임시 하드코딩 (빠른 테스트용)

환경 변수 설정이 어려우시면, 테스트용으로 `app.config.js`에 직접 값을 넣을 수 있습니다.
**⚠️ 주의: 이 방법은 보안상 좋지 않으므로 테스트 후 반드시 제거하세요!**
