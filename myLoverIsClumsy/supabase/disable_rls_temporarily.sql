-- 개발 중 RLS 일시적으로 비활성화 또는 완전 허용
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- ============================================
-- 방법 1: INSERT 정책 완전 허용 (권장)
-- ============================================
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (true);  -- 모든 INSERT 허용

-- ============================================
-- 방법 2: RLS 완전 비활성화 (더 확실함, 개발 중에만)
-- ============================================
-- 주석을 해제하여 실행하세요
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 확인
-- ============================================
-- 정책 확인
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';

-- RLS 상태 확인
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- 성공 메시지
SELECT '✅ INSERT 정책이 완전히 허용되었습니다!' as status;
