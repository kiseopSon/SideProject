# 빌드 실패 디버깅 가이드

## 현재 상황

### ✅ 해결된 문제
- 환경 변수 충돌 해결 (충돌 메시지 없음)
- 환경 변수 정상 로드됨:
  ```
  Environment variables with visibility "Plain text" and "Sensitive" loaded from the "preview" environment on EAS: EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_SUPABASE_URL.
  ```
- 프로젝트 파일 업로드 완료

### ❌ 남은 문제
- 빌드가 여전히 실패: `Error: build command failed.`
- 상세 에러 메시지가 없음

## 디버깅 단계

### 1단계: 빌드 상태 확인

빌드가 실제로 실패했는지, 아니면 아직 진행 중인지 확인하세요.

터미널에서 빌드 ID를 확인하거나, EAS 웹사이트에서 확인:

```bash
# 빌드 목록 확인
eas build:list --platform android --limit 5
```

### 2단계: EAS 웹사이트에서 상세 로그 확인

1. **프로젝트 페이지 접속:**
   ```
   https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy
   ```

2. **Builds 탭 클릭**

3. **최근 빌드 클릭**

4. **전체 로그 확인:**
   - 빌드 로그를 아래로 스크롤하여 전체 내용 확인
   - 에러 메시지 찾기
   - 빌드가 어느 단계에서 실패했는지 확인

### 3단계: 확인할 내용

빌드 로그에서 다음을 확인하세요:

#### 환경 변수 확인 메시지
```
🔍 app.config.js - 환경 변수 확인:
  process.env.EXPO_PUBLIC_SUPABASE_URL: ✅ 있음 (...)
  또는
  process.env.EXPO_PUBLIC_SUPABASE_URL: ❌ 없음
```

#### 일반적인 빌드 실패 원인

1. **메모리 부족 (Out of Memory)**
   - `OutOfMemoryError` 메시지 확인
   - 해결: 빌드 설정에서 메모리 할당량 늘리기

2. **타임아웃 (Timeout)**
   - `timeout` 또는 `timed out` 메시지 확인
   - 해결: 빌드 타임아웃 설정 늘리기

3. **의존성 오류 (Dependency Error)**
   - `npm install` 또는 `yarn install` 에러 확인
   - 해결: `package.json` 확인, 의존성 재설치

4. **네이티브 모듈 빌드 오류**
   - Android Gradle 빌드 에러 확인
   - 해결: 네이티브 모듈 호환성 확인

5. **코드 오류 (Syntax Error, Type Error)**
   - TypeScript 컴파일 에러 확인
   - 해결: 로컬에서 `npx expo-doctor` 실행

6. **자산 파일 누락**
   - 이미지 파일 경로 오류 확인
   - 해결: `assets` 폴더 구조 확인

### 4단계: 로컬에서 문제 확인

빌드 전에 로컬에서 문제를 확인:

```bash
# Expo 프로젝트 상태 확인
npx expo-doctor

# TypeScript 타입 체크
npx tsc --noEmit

# 의존성 확인
npm ls

# 로컬 빌드 테스트 (가능한 경우)
npx expo prebuild --platform android
```

## 다음 단계

1. **EAS 웹사이트에서 빌드 로그 전체 확인**
2. **에러 메시지 복사하여 알려주세요**
3. **빌드가 어느 단계에서 실패했는지 확인**

빌드 로그의 에러 메시지를 공유해주시면, 더 구체적인 해결 방법을 제시할 수 있습니다.

## 참고

- 빌드 로그는 EAS 웹사이트에서만 전체 내용을 확인할 수 있습니다
- 터미널 출력은 일부만 표시될 수 있습니다
- 빌드가 진행 중일 수도 있으므로, 웹사이트에서 상태를 확인하세요
