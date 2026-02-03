# Trigger 테이블 위치 수정

## 문제
Trigger가 `public.users` 테이블에 생성되어 있어서 작동하지 않습니다.

## 해결
Trigger는 **`auth.users`** 테이블에 생성되어야 합니다!

## 즉시 해결

### Supabase SQL Editor에서 실행

`supabase/fix_trigger_table.sql` 파일의 내용을 실행하세요.

또는 다음 SQL 실행:

```sql
-- 1. 잘못된 위치의 Trigger 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Trigger 함수 생성
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

-- 3. 함수 권한 부여
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 4. 올바른 테이블(auth.users)에 Trigger 생성 ⭐
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users  -- ⭐ 중요: auth.users!
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 5. INSERT 정책 수정 (백업용)
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (true);
```

## 확인

```sql
-- Trigger가 올바른 위치에 있는지 확인
SELECT 
    trigger_name,
    event_object_schema,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

다음과 같이 표시되어야 합니다:
- `event_object_schema`: `auth` ✅
- `event_object_table`: `users` ✅

**현재는 `public.users`에 있어서 작동하지 않았습니다!**

## 작동 원리

1. 사용자가 회원가입 → **`auth.users`** 테이블에 INSERT
2. Trigger 자동 실행 (auth.users에 있으므로)
3. `public.users` 테이블에 프로필 생성
4. RLS 우회 (SECURITY DEFINER)

## 테스트

1. 앱에서 서버 재시작: `npx expo start -c`
2. 회원가입 시도
3. Supabase Table Editor → `public.users` 테이블 확인
4. 자동으로 레코드가 생성되었는지 확인

## 중요 사항

- ✅ Trigger는 **`auth.users`**에 생성되어야 함
- ✅ 함수는 `SECURITY DEFINER`로 실행되어야 함
- ✅ `public.users`가 아닌 `auth.users`에 Trigger 생성!

`supabase/fix_trigger_table.sql` 파일을 실행하면 올바른 위치에 Trigger가 생성됩니다!
