-- 완전한 설정 스크립트
-- 이 파일을 Supabase SQL Editor에서 한 번에 실행하세요
-- 순서대로 실행하면 모든 문제가 해결됩니다

-- ============================================
-- 1. users 테이블에 partner_id 컬럼 추가 (없다면)
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id);

-- ============================================
-- 2. Trigger 함수 생성
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
  );
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
-- 4. Trigger 생성
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. RLS 정책 재설정
-- ============================================
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- 새 정책 생성
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- INSERT 정책: 개발 중에는 더 관대하게
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id OR
    auth.uid() IS NOT NULL
  );

-- ============================================
-- 6. 확인 쿼리
-- ============================================
-- Trigger 확인
SELECT 
    'Trigger' as type,
    trigger_name as name,
    event_object_table as table_name
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'

UNION ALL

-- 정책 확인
SELECT 
    'Policy' as type,
    policyname as name,
    tablename as table_name
FROM pg_policies
WHERE tablename = 'users'

UNION ALL

-- 컬럼 확인
SELECT 
    'Column' as type,
    column_name as name,
    'users' as table_name
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'partner_id';

-- 성공 메시지
SELECT '✅ 모든 설정이 완료되었습니다!' as status;
