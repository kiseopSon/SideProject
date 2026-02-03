# Trigger 생성 단계별 가이드

## 1단계: Supabase SQL Editor 열기

1. Supabase 대시보드 로그인
2. 왼쪽 사이드바에서 **SQL Editor** 클릭
3. **New query** 버튼 클릭

## 2단계: Trigger 함수 생성

다음 SQL을 복사해서 붙여넣기:

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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Run** 버튼 클릭 → 성공 메시지 확인

## 3단계: Trigger 생성

다음 SQL을 복사해서 붙여넣기:

```sql
-- Trigger 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Run** 버튼 클릭 → 성공 메시지 확인

## 4단계: Trigger 확인

다음 SQL로 확인:

```sql
-- Trigger 목록 확인
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

또는 Supabase 대시보드에서:
- **Database** → **Triggers** 메뉴 확인
- `on_auth_user_created` 트리거가 보여야 함

## 5단계: 함수 확인

```sql
-- 함수 목록 확인
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```

## 문제 해결

### "permission denied" 오류가 나면

```sql
-- 함수에 필요한 권한 부여
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
```

### "relation does not exist" 오류가 나면

`users` 테이블이 생성되지 않았을 수 있습니다. 먼저 `supabase/schema.sql`을 실행하세요.

### Trigger가 보이지 않으면

1. 페이지 새로고침
2. **Database** → **Triggers** 메뉴 다시 확인
3. SQL로 직접 확인 (4단계 SQL 실행)

## 테스트

Trigger 생성 후:
1. 앱에서 회원가입 시도
2. Supabase **Table Editor** → **users** 테이블 확인
3. 자동으로 레코드가 생성되었는지 확인
