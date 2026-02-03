-- RLS 정책 완전 수정
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. users 테이블의 모든 기존 정책 삭제
-- ============================================
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- ============================================
-- 2. 새로운 RLS 정책 생성
-- ============================================

-- SELECT: 자신의 데이터만 볼 수 있음
CREATE POLICY "Users can view own data" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- UPDATE: 자신의 데이터만 수정할 수 있음
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  USING (auth.uid() = id);

-- INSERT: 자신의 프로필을 생성할 수 있음 (회원가입용)
-- auth.uid()가 id와 일치하면 허용
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. 정책 확인
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- ============================================
-- 4. RLS가 활성화되어 있는지 확인
-- ============================================
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- 성공 메시지
SELECT 'RLS 정책이 성공적으로 수정되었습니다!' as status;
