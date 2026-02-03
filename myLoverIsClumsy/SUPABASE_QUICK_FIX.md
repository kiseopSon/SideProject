# Supabase 스키마 빠른 수정 가이드

## 문제: "could not find the partner_id column" 오류가 계속 발생

## 해결 방법

### 방법 1: Supabase SQL Editor에서 직접 실행 (가장 확실함)

1. **Supabase 대시보드** 열기
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. **New query** 클릭
4. 다음 SQL 실행:

```sql
-- users 테이블에 partner_id 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id);

-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

5. **Run** 버튼 클릭
6. 결과 확인 - `partner_id` 컬럼이 있는지 확인

### 방법 2: Table Editor에서 확인

1. **Table Editor** 메뉴 클릭
2. **users** 테이블 선택
3. 컬럼 목록 확인:
   - `id` ✅
   - `email` ✅
   - `name` ✅
   - `partner_id` ❌ (없으면 추가 필요)
   - `created_at` ✅

### 방법 3: 전체 스키마 다시 실행

만약 테이블이 제대로 생성되지 않았다면:

1. **SQL Editor** 열기
2. `supabase/schema.sql` 파일의 **전체 내용** 복사
3. SQL Editor에 붙여넣기
4. **Run** 실행

⚠️ **주의**: 기존 데이터가 있다면 백업 후 실행하세요.

### 방법 4: 수동으로 컬럼 추가

Table Editor에서:
1. **users** 테이블 선택
2. 상단 **"Add column"** 클릭
3. 다음 정보 입력:
   - **Name**: `partner_id`
   - **Type**: `uuid`
   - **Foreign key**: `users(id)` 선택
   - **Nullable**: ✅ 체크
4. **Save** 클릭

## 확인

수정 후 앱에서:
1. 서버 재시작: `npx expo start -c`
2. 회원가입 다시 시도
3. 오류가 사라졌는지 확인

## 여전히 안 되면

터미널의 **전체 오류 메시지**를 복사해서 알려주세요.

특히:
- Supabase 오류 메시지
- 어떤 컬럼을 찾지 못하는지
- 어떤 작업 중에 발생하는지 (회원가입, 로그인 등)
