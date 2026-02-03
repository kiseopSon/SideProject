# RLS 권한 문제 최종 해결 방법

## 현재 상황
INSERT 정책이 `(auth.uid() = id)`로 설정되어 있지만 여전히 권한 오류가 발생합니다.

## 원인
회원가입 시점에 `auth.uid()`가 아직 완전히 설정되지 않았거나, 정책 조건이 너무 엄격할 수 있습니다.

## 해결 방법 (2가지)

### 방법 1: INSERT 정책 수정 (빠른 해결)

Supabase SQL Editor에서 실행:

```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- 더 관대한 INSERT 정책 생성
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id OR
    auth.uid() IS NOT NULL
  );
```

### 방법 2: 완전한 설정 재실행 (권장) ⭐

`supabase/setup_complete.sql` 파일의 **전체 내용**을 Supabase SQL Editor에서 실행하세요.

이 파일은 다음을 포함합니다:
- ✅ `partner_id` 컬럼 추가
- ✅ Trigger 함수 생성 및 권한 부여
- ✅ Trigger 생성
- ✅ RLS 정책 재설정 (더 관대한 INSERT 정책 포함)

## 확인

정책 수정 후 확인:

```sql
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';
```

`with_check`가 다음과 같이 표시되어야 합니다:
- `(auth.uid() = id OR auth.uid() IS NOT NULL)` ✅

## 테스트

1. 앱에서 서버 재시작: `npx expo start -c`
2. 회원가입 시도
3. 정상 작동 확인

## 여전히 안 되면

### 임시 해결책 (개발 중에만 사용)

```sql
-- INSERT 정책을 완전히 허용 (보안 주의!)
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (true);
```

⚠️ **주의**: 프로덕션에서는 사용하지 마세요!

## 추천 순서

1. **먼저**: `supabase/setup_complete.sql` 실행 (가장 확실함)
2. 안 되면: INSERT 정책만 수정 (`supabase/fix_insert_policy_final.sql`)
3. 그래도 안 되면: 임시 해결책 사용 (개발 중에만)

## 디버깅

문제를 정확히 파악하려면:

```sql
-- 현재 세션의 auth.uid() 확인
SELECT auth.uid() as current_user_id;

-- users 테이블의 모든 정책 확인
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';
```

가장 확실한 방법은 **`supabase/setup_complete.sql`을 한 번에 실행**하는 것입니다!
