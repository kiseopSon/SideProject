-- 개발 중 RLS 완전 비활성화
-- 이 파일을 Supabase SQL Editor에서 실행하세요
-- ⚠️ 개발 중에만 사용하세요!

-- ============================================
-- RLS 완전 비활성화
-- ============================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 확인
-- ============================================
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '❌ RLS 활성화됨'
        ELSE '✅ RLS 비활성화됨'
    END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- 성공 메시지
SELECT '✅ RLS가 비활성화되었습니다. 이제 모든 INSERT가 허용됩니다!' as status;
