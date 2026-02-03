# RLS 정책 오류 해결: "new row violates row-level security policy"

## 문제
회원가입 시 "new row violates row-level security policy for table users" 오류가 발생합니다.

## 원인
Supabase의 Row Level Security (RLS)가 활성화되어 있지만, `users` 테이블에 **INSERT 정책이 없어서** 회원가입이 차단됩니다.

## 해결 방법

### 방법 1: 빠른 수정 (추천)

Supabase SQL Editor에서 다음 SQL 실행:

```sql
-- users 테이블에 INSERT 정책 추가
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

### 방법 2: 전체 정책 다시 설정

`supabase/fix_rls_policy.sql` 파일의 내용을 Supabase SQL Editor에서 실행하세요.

### 방법 3: 완전한 스키마 재실행

`supabase/complete_schema.sql` 파일을 실행하면 모든 정책이 올바르게 설정됩니다.

⚠️ **주의**: 기존 데이터가 있다면 백업 후 실행하세요.

## 확인

정책 추가 후:
1. Supabase 대시보드 → **Authentication** → **Policies** 메뉴에서 확인
2. `users` 테이블에 다음 정책이 있는지 확인:
   - ✅ "Users can view own data" (SELECT)
   - ✅ "Users can update own data" (UPDATE)
   - ✅ "Users can insert own data" (INSERT) ← **이게 중요!**

## 테스트

1. 앱에서 서버 재시작: `npx expo start -c`
2. 회원가입 다시 시도
3. 정상적으로 작동하는지 확인

## 추가 정보

RLS 정책은 다음과 같이 작동합니다:
- `auth.uid() = id`: 현재 로그인한 사용자의 ID가 레코드의 ID와 일치할 때만 허용
- 회원가입 시 `auth.uid()`는 새로 생성된 사용자 ID와 같아야 함

## 여전히 안 되면

1. Supabase 대시보드에서 **Authentication** → **Policies** 확인
2. `users` 테이블의 모든 정책 목록 확인
3. INSERT 정책이 있는지 확인
4. 터미널의 전체 오류 메시지 확인
