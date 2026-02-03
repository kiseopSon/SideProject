# RLS 정책 오류 최종 해결 방법

## 문제 상황
INSERT 정책이 있는데도 "new row violates row-level security policy" 오류가 계속 발생합니다.

## 해결 방법 (2가지)

### 방법 1: Database Trigger 사용 (추천) ⭐

이 방법은 RLS 정책을 우회하여 자동으로 프로필을 생성합니다.

1. **Supabase SQL Editor** 열기
2. `supabase/auto_profile_trigger.sql` 파일의 내용 복사
3. 실행

이렇게 하면:
- 회원가입 시 자동으로 `users` 테이블에 프로필 생성
- RLS 정책 문제 완전 해결
- 코드에서 INSERT 할 필요 없음

### 방법 2: RLS 정책 수정

정책이 제대로 작동하지 않는다면:

1. **Supabase SQL Editor** 열기
2. 다음 SQL 실행:

```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- 새 정책 생성
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

3. 정책 확인:
```sql
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';
```

## 추천: 방법 1 (Trigger 사용)

Database Trigger를 사용하면:
- ✅ RLS 정책 문제 완전 해결
- ✅ 코드가 더 간단해짐
- ✅ 자동으로 프로필 생성
- ✅ 더 안정적

## 확인

1. Trigger 생성 후:
   - Supabase 대시보드 → **Database** → **Triggers** 확인
   - `on_auth_user_created` 트리거가 있는지 확인

2. 테스트:
   - 앱에서 회원가입 시도
   - `users` 테이블에 자동으로 레코드 생성되는지 확인

## 코드 변경 사항

`services/authService.ts`를 수정하여:
- Trigger가 프로필을 생성하도록 대기
- Trigger가 작동하지 않으면 수동으로 생성 시도
- 더 나은 오류 메시지 제공

## 여전히 안 되면

1. Supabase 대시보드에서:
   - **Authentication** → **Policies** 확인
   - **Database** → **Triggers** 확인
   - **Table Editor** → **users** 테이블 확인

2. 터미널의 전체 오류 메시지 확인

3. Supabase 로그 확인:
   - 대시보드 → **Logs** → **Postgres Logs**
