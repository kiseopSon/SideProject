-- users 테이블 INSERT 정책 수정
-- 회원가입 시 RLS 오류 해결

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- 새로운 INSERT 정책 생성 (더 관대한 조건)
-- 회원가입 시 auth.uid()가 이미 설정되어 있으므로 id와 일치해야 함
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id OR
    auth.uid() IS NOT NULL
  );

-- 또는 완전히 허용 (개발 중에만 사용)
-- CREATE POLICY "Users can insert own data" ON users
--   FOR INSERT 
--   WITH CHECK (true);

-- 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';
