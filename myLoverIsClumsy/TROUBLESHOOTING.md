# 문제 해결 가이드

## Android에서 앱이 표시되지 않는 경우

### 1. 환경 변수 확인

가장 흔한 원인은 `.env` 파일이 제대로 설정되지 않은 경우입니다.

#### 확인 방법:
```powershell
# PowerShell에서 .env 파일 내용 확인
Get-Content .env
```

#### 올바른 형식:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_PROJECT_ID=my-lover-is-clumsy
```

⚠️ **주의사항:**
- `=` 앞뒤 공백 없음
- 따옴표 없음
- 각 줄이 올바르게 입력됨

### 2. Expo 서버 재시작

`.env` 파일을 수정한 후에는 반드시 서버를 재시작해야 합니다:

```bash
# 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
npm start
```

### 3. Metro 번들러 캐시 클리어

```bash
# 서버 중지 후
npx expo start -c
```

### 4. 터미널 오류 메시지 확인

터미널에서 빨간색 오류 메시지를 확인하세요. 일반적인 오류:

#### "Missing Supabase environment variables"
→ `.env` 파일이 없거나 잘못 설정됨

#### "Network request failed"
→ Supabase URL이 잘못되었거나 인터넷 연결 문제

#### "Invalid API key"
→ Supabase Anon Key가 잘못됨

### 5. Android 에뮬레이터/디바이스 확인

#### 에뮬레이터가 실행 중인지 확인:
```bash
# Android Studio에서 AVD Manager 열기
# 또는 명령어로 확인
adb devices
```

#### Expo Go 앱 설치 확인:
- 실제 Android 디바이스: Play Store에서 "Expo Go" 설치
- 에뮬레이터: Play Store에서 "Expo Go" 설치 필요

### 6. 로그 확인

Android에서 로그를 확인하려면:

```bash
# Android 로그 확인
npx react-native log-android

# 또는 Expo 로그
npx expo start --android
```

### 7. 단계별 체크리스트

- [ ] `.env` 파일이 프로젝트 루트에 존재
- [ ] `.env` 파일 내용이 올바름 (공백, 따옴표 확인)
- [ ] `npm install` 완료
- [ ] Expo 서버 재시작 (`npm start`)
- [ ] Android 에뮬레이터/디바이스 연결됨
- [ ] Expo Go 앱이 설치됨
- [ ] 터미널에 오류 메시지 없음

### 8. 완전 초기화 (최후의 수단)

```bash
# 1. node_modules 삭제
rm -rf node_modules

# 2. 패키지 재설치
npm install

# 3. Expo 캐시 클리어
npx expo start -c

# 4. Android 빌드 캐시 클리어 (에뮬레이터에서)
# Android Studio > Tools > AVD Manager > 에뮬레이터 우클릭 > Wipe Data
```

### 9. 대안: 웹에서 먼저 테스트

Android 문제를 우회하여 웹에서 먼저 테스트:

```bash
npm run web
```

웹에서 작동하면 코드는 정상이며, Android 설정 문제일 가능성이 높습니다.

## 추가 도움말

문제가 계속되면 다음 정보를 확인하세요:

1. **터미널 전체 오류 메시지** (스크린샷)
2. **.env 파일 내용** (민감 정보 제외)
3. **package.json의 dependencies**
4. **Node.js 버전** (`node -v`)
5. **Expo 버전** (`npx expo --version`)
