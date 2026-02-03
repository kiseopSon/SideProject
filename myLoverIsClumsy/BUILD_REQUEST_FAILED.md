# 빌드 요청 실패 문제

## 현재 상황

- ✅ 파일 업로드 완료: "✔ Uploaded to EAS 1s"
- ❌ 빌드 요청이 목록에 없음: 방금 실행한 빌드가 웹사이트에 보이지 않음
- ❌ 터미널: "Error: build command failed."
- ⚠️ Free 플랜 경고 메시지

## 문제 원인

빌드 요청이 서버에 전달되지 않았거나, 빌드가 시작되기 전에 실패했을 가능성이 높습니다.

### 가능한 원인:

1. **EAS CLI 네트워크 문제**
   - 파일 업로드는 성공했지만 빌드 요청 전송 실패
   - 네트워크 타임아웃

2. **Free 플랜 제한**
   - 빌드 큐에서 대기 시간 초과
   - 빌드 요청 자체가 거부됨

3. **EAS 서버 문제**
   - 일시적인 서버 오류
   - 빌드 요청 처리 실패

4. **프로젝트 설정 문제**
   - `eas.json` 설정 오류
   - 필수 파일 누락

## 해결 방법

### 방법 1: 빌드 재시도

일시적인 문제일 수 있으므로, 잠시 후 다시 빌드:

```bash
eas build --platform android --profile preview
```

### 방법 2: 상세 로그 확인

더 자세한 에러 메시지를 확인:

```bash
eas build --platform android --profile preview --verbose
```

또는

```bash
DEBUG=* eas build --platform android --profile preview
```

### 방법 3: 프로젝트 상태 확인

빌드 전에 프로젝트 상태 확인:

```bash
# TypeScript 타입 체크
npx tsc --noEmit

# Expo 프로젝트 상태 확인
npx expo-doctor

# Git 상태 확인
git status
```

### 방법 4: EAS CLI 업데이트

EAS CLI 버전이 오래되었을 수 있습니다:

```bash
npm install -g eas-cli@latest
eas --version
```

### 방법 5: 수동으로 빌드 트리거

만약 CLI가 작동하지 않는다면, EAS 웹사이트에서 수동으로 빌드를 트리거할 수 있는지 확인하세요.

## 확인할 내용

1. **EAS 웹사이트에서 확인:**
   - 빌드 페이지 새로고침
   - 빌드가 "pending" 상태로 나타나는지 확인
   - 빌드 큐 확인

2. **네트워크 상태:**
   - 인터넷 연결 확인
   - 방화벽 설정 확인

3. **EAS 계정 상태:**
   - Free 플랜 제한 확인
   - 계정 상태 확인

## 다음 단계

1. **잠시 대기 후 재시도** (1-2분 후)
2. **상세 로그로 다시 빌드**
3. **EAS CLI 업데이트**
4. **프로젝트 상태 확인**

빌드를 다시 시도하고, 여전히 실패하면 상세 에러 메시지를 공유해주세요!
