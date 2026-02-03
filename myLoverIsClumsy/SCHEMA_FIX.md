# 데이터베이스 스키마 오류 해결

## 문제
"could not find the partner_id column of users in the schema cache" 오류가 발생했습니다.

## 원인
Supabase 데이터베이스는 `snake_case` (예: `partner_id`)를 사용하지만, 코드에서 `camelCase` (예: `partnerId`)를 사용하여 불일치가 발생했습니다.

## 해결 방법

### 1단계: Supabase에서 스키마 확인

Supabase 대시보드에서:
1. **Table Editor** 메뉴 클릭
2. **users** 테이블 확인
3. `partner_id` 컬럼이 있는지 확인

### 2단계: 스키마 수정 (필요한 경우)

`partner_id` 컬럼이 없다면 Supabase SQL Editor에서 실행:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id);
```

또는 `supabase/fix_schema.sql` 파일의 내용을 실행하세요.

### 3단계: 코드 수정 완료

모든 서비스 파일을 `snake_case`로 수정했습니다:
- ✅ `services/authService.ts` - `partner_id`, `user_id` 사용
- ✅ `services/taskService.ts` - `user_id`, `scheduled_time` 등 사용
- ✅ `services/notificationService.ts` - `user_id` 사용

### 4단계: 앱 재시작

```bash
# 서버 재시작
npx expo start -c
```

## 확인 사항

회원가입을 다시 시도해보세요. 이제 정상적으로 작동해야 합니다.

여전히 오류가 발생하면:
1. Supabase 대시보드에서 `users` 테이블 구조 확인
2. `partner_id` 컬럼이 있는지 확인
3. 터미널의 오류 메시지 확인
