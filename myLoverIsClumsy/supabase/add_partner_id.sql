-- users 테이블에 partner_id 컬럼 추가
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요

-- 1. partner_id 컬럼이 있는지 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'partner_id';

-- 2. partner_id 컬럼이 없으면 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'partner_id'
    ) THEN
        ALTER TABLE users ADD COLUMN partner_id UUID REFERENCES users(id);
        RAISE NOTICE 'partner_id 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'partner_id 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 3. users 테이블 전체 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
