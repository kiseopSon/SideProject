# 디버깅 체크리스트

## 현재 상태 확인

✅ INSERT 정책: `WITH CHECK (true)` - 완전히 허용됨
✅ Trigger 위치: `auth.users` - 올바른 위치
❓ Trigger 함수: 확인 필요
❓ 실제 오류: 확인 필요

## 다음 단계

### 1. 실제 오류 메시지 확인

앱에서 회원가입을 시도할 때:
- 터미널의 **전체 오류 메시지** 확인
- 특히 다음을 확인:
  - 오류 코드 (예: `42501`, `PGRST116` 등)
  - 오류 메시지 전체 내용
  - 어떤 단계에서 실패하는지 (Auth 생성? 프로필 생성?)

### 2. Trigger 함수 테스트

Supabase SQL Editor에서 `supabase/test_trigger_function.sql` 실행

### 3. 수동 INSERT 테스트

Supabase SQL Editor에서 직접 테스트:

```sql
-- 테스트용 UUID 생성
SELECT gen_random_uuid() as test_id;

-- 실제 사용자 ID로 테스트 (auth.users에서)
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;

-- 해당 ID로 users 테이블에 INSERT 시도
INSERT INTO public.users (id, email, name, partner_id)
VALUES (
    '위에서 가져온 ID',
    'test@example.com',
    'Test User',
    NULL
);
```

### 4. RLS 완전 비활성화 (최후의 수단)

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### 5. 로그 확인

Supabase 대시보드에서:
- **Logs** → **Postgres Logs** 확인
- Trigger 실행 로그 확인
- 오류 로그 확인

## 가능한 원인

1. **Trigger 함수 오류**: 함수 내부에서 오류 발생
2. **권한 문제**: 함수 실행 권한 부족
3. **타이밍 문제**: Trigger 실행 전에 코드가 프로필을 조회
4. **다른 RLS 정책**: 다른 정책이 차단
5. **테이블 구조 문제**: 컬럼이 없거나 타입 불일치

## 빠른 해결

가장 빠른 방법은 RLS를 완전히 비활성화하는 것입니다:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

이렇게 하면 모든 정책을 우회합니다.

## 확인 요청

다음 정보를 알려주세요:
1. 터미널의 **전체 오류 메시지** (특히 오류 코드)
2. Supabase Logs의 오류 메시지
3. `test_trigger_function.sql` 실행 결과

이 정보가 있으면 정확한 원인을 파악할 수 있습니다!
