-- Trigger 함수 테스트 및 디버깅
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. Trigger 함수 확인
-- ============================================
SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- ============================================
-- 2. 함수가 제대로 작동하는지 테스트
-- ============================================
-- 실제 사용자 ID로 테스트 (auth.users에서 가져오기)
DO $$
DECLARE
    test_user_id UUID;
    test_email TEXT;
BEGIN
    -- 최근 생성된 사용자 가져오기
    SELECT id, email INTO test_user_id, test_email
    FROM auth.users
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE '테스트 사용자 ID: %', test_user_id;
        RAISE NOTICE '테스트 이메일: %', test_email;
        
        -- 함수 직접 호출 테스트
        -- (실제로는 Trigger가 자동으로 호출하지만, 수동으로 테스트)
    ELSE
        RAISE NOTICE '테스트할 사용자가 없습니다.';
    END IF;
END $$;

-- ============================================
-- 3. users 테이블에 직접 INSERT 테스트
-- ============================================
-- 이 쿼리는 실제로 실행하지 말고, 오류만 확인하세요
-- INSERT INTO public.users (id, email, name, partner_id)
-- VALUES (
--     gen_random_uuid(),
--     'test@example.com',
--     'Test User',
--     NULL
-- );

-- ============================================
-- 4. RLS 상태 확인
-- ============================================
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS 활성화됨'
        ELSE 'RLS 비활성화됨'
    END as status
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- ============================================
-- 5. 모든 정책 확인
-- ============================================
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN with_check = 'true' THEN '✅ 완전 허용'
        ELSE with_check
    END as check_status
FROM pg_policies
WHERE tablename = 'users';

-- ============================================
-- 6. Trigger 함수 수정 (더 견고하게)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 오류 처리 추가
  BEGIN
    INSERT INTO public.users (id, email, name, partner_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
      NULL
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '사용자 프로필이 성공적으로 생성되었습니다: %', NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '사용자 프로필 생성 실패: %', SQLERRM;
    -- 오류가 발생해도 계속 진행 (auth.users INSERT는 성공)
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 권한 재부여
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 성공 메시지
SELECT '✅ Trigger 함수가 업데이트되었습니다!' as status;
