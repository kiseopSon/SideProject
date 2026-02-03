-- tasks 테이블 RLS 정책 확인 및 수정
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. 기존 정책 확인
-- ============================================
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'tasks';

-- ============================================
-- 2. tasks 테이블 RLS 비활성화 (개발 중에만)
-- ============================================
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. 또는 INSERT 정책 완전 허용
-- ============================================
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
-- CREATE POLICY "Users can create own tasks" ON tasks
--   FOR INSERT 
--   WITH CHECK (true);

-- ============================================
-- 4. 확인
-- ============================================
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '❌ 활성화됨'
        ELSE '✅ 비활성화됨'
    END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'tasks';

-- 성공 메시지
SELECT '✅ tasks 테이블 RLS가 비활성화되었습니다!' as status;
