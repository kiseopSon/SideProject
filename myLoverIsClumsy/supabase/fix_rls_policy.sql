-- RLS 정책 수정: users 테이블에 INSERT 정책 추가
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요

-- 기존 INSERT 정책이 있는지 확인하고 삭제 (있다면)
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- users 테이블에 INSERT 정책 추가
-- 사용자는 자신의 프로필을 생성할 수 있음
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 확인: 모든 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';
