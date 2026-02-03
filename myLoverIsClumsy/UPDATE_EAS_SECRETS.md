# EAS Secrets 업데이트 가이드

## 문제
EXPO_PUBLIC_SUPABASE_URL이 더미 값으로 설정되어 있습니다.

## 해결 방법: 웹에서 직접 업데이트

### 1. Expo 대시보드 접속
https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy 접속

### 2. Secrets 메뉴로 이동
- Settings (설정) 클릭
- Secrets 메뉴 클릭

### 3. EXPO_PUBLIC_SUPABASE_URL 업데이트
- 기존 `EXPO_PUBLIC_SUPABASE_URL` 찾기
- Edit (편집) 클릭
- 값 변경: `https://rwnzjxqybphkopcbvkid.supabase.co`
- Save (저장)

### 4. 확인
다음 두 개의 secret이 있어야 합니다:
- ✅ EXPO_PUBLIC_SUPABASE_URL = `https://rwnzjxqybphkopcbvkid.supabase.co`
- ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5. 다시 빌드
```bash
eas build --platform android --profile preview
```

## 또는 터미널에서 업데이트

```bash
# 기존 값 삭제 (확인 필요)
eas env:delete --name EXPO_PUBLIC_SUPABASE_URL

# 새 값으로 생성
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://rwnzjxqybphkopcbvkid.supabase.co" --scope project --type string
```
