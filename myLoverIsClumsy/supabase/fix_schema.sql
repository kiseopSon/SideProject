-- 기존 users 테이블에 partner_id 컬럼이 없는 경우 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id);

-- 기존 테이블 확인 및 수정 스크립트
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요

-- 1. users 테이블 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- 2. partner_id 컬럼이 없으면 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'partner_id'
    ) THEN
        ALTER TABLE users ADD COLUMN partner_id UUID REFERENCES users(id);
    END IF;
END $$;

-- 3. 모든 테이블 구조 확인
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
