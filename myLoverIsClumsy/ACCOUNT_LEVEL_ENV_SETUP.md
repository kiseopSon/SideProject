# 계정 레벨 환경 변수 설정 가이드

## 현재 상황
- ✅ 계정 레벨 페이지: `https://expo.dev/accounts/sonkiseop/settings/environment-variables` - 페이지는 열림 (값 없음)
- ❌ 프로젝트 레벨 페이지: 페이지 자체가 없음

## 해결: 계정 레벨에 직접 설정

### 단계별 안내

#### 1단계: 페이지 접속
```
https://expo.dev/accounts/sonkiseop/settings/environment-variables
```

#### 2단계: 변수 추가 버튼 클릭
- **"Add Variable"** 또는
- **"Create Variable"** 또는  
- **"New Variable"** 버튼 클릭

#### 3단계: 첫 번째 변수 설정

**EXPO_PUBLIC_SUPABASE_URL:**

| 항목 | 값 |
|------|-----|
| **Name** | `EXPO_PUBLIC_SUPABASE_URL` |
| **Value** | `https://rwnzjxqybphkopcbvkid.supabase.co` |
| **Visibility** | **"Sensitive"** 또는 **"Plain text"** 선택 ⚠️ "Secret" 아님! |
| **Environments** | `preview`, `production` 체크 |
| **Action** | **Create** 또는 **Save** 클릭 |

#### 4단계: 두 번째 변수 설정

또 다시 **"Add Variable"** 버튼 클릭

**EXPO_PUBLIC_SUPABASE_ANON_KEY:**

| 항목 | 값 |
|------|-----|
| **Name** | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| **Value** | `.env` 파일에서 전체 Key 복사 (매우 긴 문자열)<br>`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| **Visibility** | **"Sensitive"** 선택 |
| **Environments** | `preview`, `production` 체크 |
| **Action** | **Create** 또는 **Save** 클릭 |

### ⚠️ 중요 사항

1. **Visibility 선택:**
   - ✅ **"Sensitive"** 권장 (값이 마스킹되어 표시됨)
   - ✅ **"Plain text"** 가능 (값이 그대로 표시됨)
   - ❌ **"Secret"** 선택하지 마세요! (Secret은 빌드 스크립트에서만 사용, 앱 번들에 포함되지 않음)

2. **Environments 선택:**
   - 반드시 `preview`와 `production` 모두 체크
   - `development`도 필요하면 체크

3. **Name 정확히 입력:**
   - 정확히 `EXPO_PUBLIC_SUPABASE_URL` (대소문자 구분)
   - 정확히 `EXPO_PUBLIC_SUPABASE_ANON_KEY` (대소문자 구분)
   - `EXPO_PUBLIC_` 접두사가 있어야 앱 번들에 포함됩니다!

### 확인 방법

설정 후:
1. 페이지에서 두 개의 변수가 목록에 보여야 함
2. Visibility가 "Sensitive" 또는 "Plain text"로 표시되어야 함
3. Environments에 `preview`, `production`이 표시되어야 함

### 다음 단계: 다시 빌드

환경 변수를 설정한 후 **반드시 다시 빌드**해야 합니다:

```bash
eas build --platform android --profile preview
```

### 빌드 로그 확인

빌드 로그에서 다음 메시지를 찾으세요:

```
🔍 app.config.js - 환경 변수 확인:
  process.env.EXPO_PUBLIC_SUPABASE_URL: ✅ 있음 (...)
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY: ✅ 있음 (...)
  최종 supabaseUrl: ✅ 설정됨 (...)
  최종 supabaseAnonKey: ✅ 설정됨 (...)
```

**만약 "❌ 없음"이 나오면:**
- 계정 레벨 환경 변수가 프로젝트 빌드에 포함되지 않았을 수 있음
- 이 경우 다른 방법을 시도해야 함

## 참고

- 계정 레벨 환경 변수는 모든 프로젝트에서 사용 가능합니다
- 프로젝트 레벨 환경 변수가 있으면 프로젝트 레벨이 우선순위가 높습니다
- 하지만 프로젝트 레벨 페이지가 없으므로, 계정 레벨에 설정하는 것이 현재 최선의 방법입니다
