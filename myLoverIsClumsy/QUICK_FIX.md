# Android 앱이 표시되지 않는 문제 해결

## 즉시 시도할 것

### 1. 터미널 오류 확인
터미널에서 빨간색 오류 메시지를 확인하세요. 특히:
- "Missing Supabase environment variables"
- "Network request failed"
- "Cannot read property..."

### 2. 서버 재시작 (캐시 클리어)
```bash
# 현재 서버 중지 (Ctrl+C)
# 그 다음 캐시 클리어하며 재시작
npx expo start -c
```

### 3. .env 파일 확인
프로젝트 루트에 `.env` 파일이 있고, 내용이 올바른지 확인:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **확인사항:**
- `=` 앞뒤 공백 없음
- 따옴표 없음
- 각 줄 끝에 공백 없음

### 4. 패키지 재설치
```bash
# node_modules 삭제
rm -rf node_modules

# 재설치
npm install

# 서버 시작
npm start
```

### 5. Android 에뮬레이터 확인
- Android Studio에서 에뮬레이터가 실행 중인지 확인
- Expo Go 앱이 설치되어 있는지 확인
- 에뮬레이터를 재시작

### 6. 웹에서 먼저 테스트
Android 문제를 우회하여 웹에서 테스트:

```bash
npm run web
```

웹에서 작동하면 코드는 정상이며 Android 설정 문제일 가능성이 높습니다.

## 일반적인 원인

1. **환경 변수 미설정** (가장 흔함)
   - `.env` 파일이 없거나 잘못 설정됨
   - 해결: `.env` 파일 확인 및 수정 후 서버 재시작

2. **캐시 문제**
   - 해결: `npx expo start -c`로 캐시 클리어

3. **패키지 설치 문제**
   - 해결: `rm -rf node_modules && npm install`

4. **Android 에뮬레이터 문제**
   - 해결: 에뮬레이터 재시작 또는 새로 생성

## 여전히 안 되면

터미널의 **전체 오류 메시지**를 복사해서 알려주세요. 특히:
- 빨간색 에러 메시지
- 노란색 경고 메시지
- "Error:", "Warning:"으로 시작하는 메시지
