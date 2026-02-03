# auth.uid()가 null인 문제 해결

## 문제 원인
회원가입 시점에 `auth.uid()`가 `null`이어서 RLS 정책이 차단합니다.

## 해결 방법: Database Trigger 사용 (권장) ⭐

Trigger는 `SECURITY DEFINER`로 실행되므로 RLS를 우회할 수 있습니다.

### 1단계: Trigger 생성

Supabase SQL Editor에서 `supabase/fix_trigger_and_policy.sql` 파일의 내용을 실행하세요.

또는 다음 SQL 실행:

```sql
-- Trigger 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, partner_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 권한 부여
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Trigger 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
```

### 2단계: RLS 정책 수정 (백업용)

Trigger가 작동하지 않을 경우를 대비:

```sql
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (true);  -- 개발 중에는 완전히 허용
```

### 3단계: 확인

```sql
-- Trigger 확인
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 정책 확인
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';
```

## 테스트

1. 앱에서 서버 재시작: `npx expo start -c`
2. 회원가입 시도
3. Trigger가 자동으로 프로필을 생성하는지 확인
4. Supabase Table Editor → users 테이블에서 확인

## 작동 원리

1. 사용자가 회원가입 → `auth.users` 테이블에 INSERT
2. Trigger 자동 실행 → `public.users` 테이블에 프로필 생성
3. Trigger는 `SECURITY DEFINER`로 실행되므로 RLS 우회
4. 코드에서 프로필 조회 → 정상 작동

## 여전히 안 되면

### 방법 1: RLS 완전 비활성화 (개발 중에만)

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### 방법 2: INSERT 정책 완전 허용

```sql
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (true);
```

## 추천 순서

1. **먼저**: `supabase/fix_trigger_and_policy.sql` 실행 (가장 확실함)
2. 안 되면: RLS 비활성화 (개발 중에만)
3. 그래도 안 되면: Supabase 로그 확인

`supabase/fix_trigger_and_policy.sql` 파일을 실행하면 Trigger와 정책이 모두 설정됩니다!
