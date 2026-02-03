# 웹에서 환경 변수 수정하기

## 문제
Secret 변수는 편집할 수 없으므로 삭제 후 재생성해야 합니다.

## 해결 방법

### 1. 기존 EXPO_PUBLIC_SUPABASE_URL 삭제

1. https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy 접속
2. **Settings** → **Secrets** 메뉴
3. `EXPO_PUBLIC_SUPABASE_URL` 찾기
4. **Delete** 버튼 클릭
5. 확인

### 2. 새 EXPO_PUBLIC_SUPABASE_URL 생성

1. 같은 페이지에서 **Create Secret** 버튼 클릭
2. 다음 정보 입력:
   - **Name**: `EXPO_PUBLIC_SUPABASE_URL`
   - **Value**: `https://rwnzjxqybphkopcbvkid.supabase.co`
   - **Visibility**: Secret
   - **Environments**: preview, production, development 모두 체크
3. **Create** 클릭

### 3. 확인

다음 두 개의 secret이 있어야 합니다:
- ✅ EXPO_PUBLIC_SUPABASE_URL = `https://rwnzjxqybphkopcbvkid.supabase.co`
- ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. 다시 빌드

터미널에서:
```bash
eas build --platform android --profile preview
```

## 참고

- Secret 변수는 편집할 수 없으므로 삭제 후 재생성해야 합니다
- 환경 변수는 preview, production, development 모두에 적용되도록 설정하세요
