# EAS Build 설정 가이드 - 앱 실행 오류 해결

## ⚠️ 중요: 환경 변수 설정

앱이 설치 후 바로 종료되는 경우, **EAS 환경 변수**가 앱에 제대로 포함되지 않았을 가능성이 높습니다.

### 문제 원인
- `EXPO_PUBLIC_SUPABASE_URL`과 `EXPO_PUBLIC_SUPABASE_ANON_KEY`는 **앱 코드 내부**에 번들되어야 합니다
- EAS에서 **"Secret"** visibility로 설정된 변수는 **빌드 스크립트에서만** 사용되고 **앱 번들에는 포함되지 않습니다**

### 해결 방법

1. **Expo 웹사이트** 접속: https://expo.dev
2. 로그인 후 **my-lover-is-clumsy** 프로젝트 선택
3. **Project settings** → **Environment variables** (또는 **Secrets**) 이동
4. 다음 변수 확인 및 수정:

   | 변수 이름 | 권장 Visibility | 적용 환경 |
   |-----------|----------------|-----------|
   | `EXPO_PUBLIC_SUPABASE_URL` | **Sensitive** 또는 **Plain text** | preview, production |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Sensitive** 또는 **Plain text** | preview, production |

5. **"Secret"**으로 설정되어 있다면:
   - 해당 변수 **삭제**
   - **새로 생성**할 때 **"Sensitive"** 선택
   - 값 입력: `.env` 파일이나 Supabase 대시보드에서 복사

6. **다시 빌드**:
   ```bash
   eas build --platform android --profile preview
   ```

### 확인 방법
빌드 로그에서 다음 메시지 확인:
- `No environment variables with visibility "Plain text" and "Sensitive" found` → 환경 변수가 앱에 포함되지 **않음** (문제!)
- 환경 변수가 설정되어 있으면 위 메시지가 **나오지 않아야** 합니다

## 수정된 크래시 방지 코드

다음 수정으로 앱 안정성이 개선되었습니다:
- `app/_layout.tsx`: SplashScreen, auth 초기화 에러 처리 강화
- `lib/supabase.ts`: SecureStore 접근 에러 처리, placeholder fallback
- `services/authService.ts`: getCurrentUser() 전체 try-catch

## 새 앱 아이콘

"My덤벙이" 테마의 핑크 그라데이션 + 하트 디자인 아이콘으로 교체되었습니다.
- `assets/icon.png` - 앱 아이콘
- `assets/adaptive-icon.png` - Android 적응형 아이콘
- `assets/splash.png` - 스플래시 화면

아이콘을 다시 생성하려면: `node scripts/generate-icons.js`
