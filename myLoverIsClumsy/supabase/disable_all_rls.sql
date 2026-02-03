-- 모든 테이블의 RLS 완전 비활성화
-- 개발 중에만 사용하세요!
-- 이 파일을 Supabase SQL Editor에서 한 번에 실행하세요

-- ============================================
-- 모든 테이블의 RLS 비활성화
-- ============================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE couples DISABLE ROW LEVEL SECURITY;
ALTER TABLE couple_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_push_tokens DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 모든 정책 삭제
-- ============================================
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Couples can view each other" ON couples;
DROP POLICY IF EXISTS "Couples can create" ON couples;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own tokens" ON user_push_tokens;
DROP POLICY IF EXISTS "Users can manage own codes" ON couple_codes;

-- ============================================
-- 확인
-- ============================================
-- RLS 상태 확인
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '❌ 활성화됨'
        ELSE '✅ 비활성화됨'
    END as status
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('users', 'couples', 'couple_codes', 'tasks', 'notifications', 'user_push_tokens')
ORDER BY tablename;

-- 정책 확인 (모두 삭제되어야 함)
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;

-- 성공 메시지
SELECT '✅ 모든 RLS가 비활성화되고 정책이 삭제되었습니다!' as status;
