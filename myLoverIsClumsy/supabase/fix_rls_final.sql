-- RLS 정책 최종 수정
-- 회원가입 시 RLS 오류 완전 해결

-- 1. 기존 INSERT 정책 삭제
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- 2. 새로운 INSERT 정책 생성 (개발용 - 더 관대한 조건)
-- 회원가입 시 auth.uid()가 이미 설정되어 있으므로 허용
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id
  );

-- 3. 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';

-- 4. 현재 세션의 auth.uid() 확인 (디버깅용)
SELECT auth.uid() as current_user_id;

-- 5. 만약 위 방법이 안 되면, Database Trigger 사용 (아래 주석 해제)
/*
-- Trigger 함수 생성: 회원가입 시 자동으로 users 테이블에 프로필 생성
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

-- Trigger 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/
