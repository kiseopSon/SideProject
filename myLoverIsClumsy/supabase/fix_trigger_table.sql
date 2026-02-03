-- Trigger를 올바른 테이블(auth.users)에 생성
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. 잘못된 위치의 Trigger 삭제
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- 2. Trigger 함수 확인 및 재생성
-- ============================================
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

-- ============================================
-- 3. 함수 권한 부여
-- ============================================
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ============================================
-- 4. 올바른 테이블(auth.users)에 Trigger 생성 ⭐
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users  -- ⭐ auth.users가 중요!
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. INSERT 정책 수정 (백업용)
-- ============================================
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (true);  -- 개발 중에는 완전히 허용

-- ============================================
-- 6. 확인
-- ============================================
-- Trigger가 올바른 테이블에 있는지 확인
SELECT 
    trigger_name,
    event_object_table,
    event_object_schema,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 성공 메시지
SELECT 
    CASE 
        WHEN event_object_table = 'users' AND event_object_schema = 'auth' 
        THEN '✅ Trigger가 올바른 위치(auth.users)에 생성되었습니다!'
        ELSE '❌ Trigger 위치를 확인하세요'
    END as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
