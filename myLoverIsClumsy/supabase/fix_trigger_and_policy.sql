-- Trigger와 RLS 정책 완전 수정
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. 기존 Trigger 삭제 (잘못된 위치 포함)
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- 2. Trigger 함수 생성 (SECURITY DEFINER로 RLS 우회)
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
  ON CONFLICT (id) DO NOTHING; -- 이미 있으면 무시
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
  AFTER INSERT ON auth.users  -- ⭐ auth 스키마의 users 테이블!
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. RLS 정책 수정 (백업용)
-- ============================================
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (true);  -- 개발 중에는 완전히 허용

-- ============================================
-- 6. 확인
-- ============================================
-- Trigger 확인 (올바른 위치인지 확인)
SELECT 
    '✅ Trigger' as type,
    trigger_name as name,
    event_object_schema || '.' || event_object_table as table_name,
    CASE 
        WHEN event_object_schema = 'auth' AND event_object_table = 'users'
        THEN '✅ 올바른 위치'
        ELSE '❌ 잘못된 위치'
    END as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'

UNION ALL

-- 정책 확인
SELECT 
    '✅ Policy' as type,
    policyname as name,
    tablename as table_name,
    '정책 존재' as status
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';

-- 성공 메시지
SELECT '✅ 모든 설정이 완료되었습니다!' as final_status;
