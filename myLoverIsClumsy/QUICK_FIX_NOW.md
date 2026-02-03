# 즉시 해결 방법

## 현재 상태
- ✅ INSERT 정책: `WITH CHECK (true)` - 완전히 허용됨
- ✅ Trigger 위치: `auth.users` - 올바른 위치
- ❓ 여전히 작동하지 않음

## 가장 확실한 해결책

### RLS 완전 비활성화 (개발 중에만)

Supabase SQL Editor에서 실행:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

이렇게 하면:
- ✅ 모든 RLS 정책을 완전히 우회
- ✅ 모든 INSERT/UPDATE/SELECT 허용
- ✅ 가장 확실한 방법

또는 `supabase/disable_rls_completely.sql` 파일 실행

## 확인

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
```

`rowsecurity`가 `false`여야 합니다.

## 테스트

1. 앱에서 서버 재시작: `npx expo start -c`
2. 회원가입 시도
3. 정상 작동 확인

## 프로덕션 배포 전

나중에 프로덕션에 배포할 때는:

```sql
-- RLS 다시 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 적절한 정책 설정
-- (Trigger가 작동하면 INSERT 정책은 필요 없을 수 있음)
```

지금은 개발 중이므로 RLS를 완전히 비활성화하는 것이 가장 빠른 해결책입니다!

위 SQL을 실행한 후 회원가입을 다시 시도해보세요.
