-- Database Trigger를 사용한 자동 프로필 생성
-- 이 방법은 RLS 정책을 우회하여 자동으로 프로필을 생성합니다
-- Supabase SQL Editor에서 실행하세요

-- 1. Trigger 함수 생성
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

-- 2. Trigger 생성 (auth.users에 INSERT 시 자동 실행)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. 확인
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
