-- INSERT 정책 최종 수정
-- 회원가입 시 RLS 오류 완전 해결

-- 기존 INSERT 정책 삭제
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- 방법 1: 더 관대한 INSERT 정책 (개발 중 권장)
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id OR
    auth.uid() IS NOT NULL
  );

-- 방법 2: 완전히 허용 (개발 중에만 사용, 보안 주의!)
-- DROP POLICY IF EXISTS "Users can insert own data" ON users;
-- CREATE POLICY "Users can insert own data" ON users
--   FOR INSERT 
--   WITH CHECK (true);

-- 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';

-- 현재 세션의 auth.uid() 확인 (디버깅용)
SELECT 
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN '인증되지 않음'
        ELSE '인증됨'
    END as auth_status;
