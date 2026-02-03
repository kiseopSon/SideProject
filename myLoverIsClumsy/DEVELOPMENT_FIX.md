# 개발 중 빠른 해결 방법

## 문제
Trigger가 올바른 위치에 있지만 여전히 작동하지 않습니다.

## 즉시 해결 (개발 중)

### 방법 1: INSERT 정책 완전 허용 (가장 빠름) ⭐

Supabase SQL Editor에서 실행:

```sql
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (true);
```

또는 `supabase/disable_rls_temporarily.sql` 파일 실행

### 방법 2: RLS 완전 비활성화 (더 확실함)

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

⚠️ **주의**: 개발 중에만 사용하세요!

## 확인

```sql
-- 정책 확인
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';

-- RLS 상태 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
```

## 테스트

1. 앱에서 서버 재시작: `npx expo start -c`
2. 회원가입 시도
3. 정상 작동 확인

## 왜 이 방법이 작동하는가?

- `WITH CHECK (true)`는 모든 INSERT를 허용
- RLS가 비활성화되면 정책을 완전히 우회
- 개발 중에는 이 방법이 가장 빠르고 확실함

## 프로덕션 배포 전

나중에 프로덕션에 배포할 때는:
1. RLS 다시 활성화
2. 적절한 정책 설정
3. Trigger가 제대로 작동하는지 확인

지금은 개발 중이므로 `WITH CHECK (true)`로 완전히 허용하는 것이 가장 빠른 해결책입니다!
