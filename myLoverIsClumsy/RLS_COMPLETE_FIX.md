# RLS 정책 완전 수정 가이드

## 문제
회원가입 시 "데이터베이스 권한 문제입니다" 오류가 발생합니다.

## 해결 방법

### 1단계: RLS 정책 완전 재설정

Supabase SQL Editor에서 `supabase/fix_rls_complete.sql` 파일의 내용을 실행하세요.

또는 다음 SQL을 직접 실행:

```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- 새 정책 생성
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 2단계: 정책 확인

```sql
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'users';
```

다음 3개 정책이 있어야 합니다:
- ✅ "Users can view own data" (SELECT)
- ✅ "Users can update own data" (UPDATE)
- ✅ "Users can insert own data" (INSERT)

### 3단계: Trigger 확인

Trigger가 제대로 작동하는지 확인:

```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### 4단계: 테스트

1. 앱에서 서버 재시작: `npx expo start -c`
2. 회원가입 시도
3. 오류가 해결되었는지 확인

## 여전히 안 되면

### 방법 A: RLS 일시적으로 비활성화 (개발 중에만)

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

⚠️ **주의**: 프로덕션에서는 사용하지 마세요!

### 방법 B: INSERT 정책을 더 관대하게

```sql
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (true);
```

⚠️ **주의**: 보안이 약해집니다. 개발 중에만 사용하세요.

### 방법 C: Trigger만 사용

코드에서 수동 INSERT를 제거하고 Trigger만 사용:

1. `services/authService.ts`에서 수동 INSERT 부분 제거
2. Trigger가 자동으로 프로필 생성하도록 의존

## 확인 체크리스트

- [ ] RLS 정책 3개 모두 존재
- [ ] INSERT 정책의 `with_check`가 `auth.uid() = id`
- [ ] Trigger `on_auth_user_created` 존재
- [ ] `users` 테이블에 `partner_id` 컬럼 존재
- [ ] Supabase Authentication에서 Email 인증 활성화됨

## 디버깅

문제를 정확히 파악하려면:

```sql
-- 현재 세션의 auth.uid() 확인
SELECT auth.uid() as current_user_id;

-- users 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';
```

## 최종 해결책

만약 위 방법들이 모두 실패하면:

1. **Supabase 대시보드** → **Authentication** → **Policies**
2. `users` 테이블의 모든 정책 확인
3. INSERT 정책이 정확히 `auth.uid() = id` 조건인지 확인
4. 정책을 삭제하고 다시 생성

또는 Supabase 지원팀에 문의하세요.
