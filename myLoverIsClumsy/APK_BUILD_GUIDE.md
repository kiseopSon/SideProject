# APK 빌드 가이드

## 문제 상황
- Windows에서는 `--local` 빌드가 지원되지 않음
- EAS Build는 클라우드 빌드만 가능 (로그인 필요)

## 해결 방법

### 방법 1: 웹 브라우저에서 EAS 프로젝트 생성 (권장)

1. **Expo 웹사이트 접속**
   - https://expo.dev 접속
   - 로그인 (sonkiseop 계정)

2. **프로젝트 생성**
   - 대시보드에서 "Create a project" 클릭
   - 프로젝트 이름: `my-lover-is-clumsy`
   - Slug: `my-lover-is-clumsy`

3. **터미널에서 빌드**
   ```bash
   eas build --platform android --profile preview
   ```

### 방법 2: 수동으로 EAS 프로젝트 연결

터미널에서 다음 명령어를 실행하고 "y" 입력:

```bash
eas build --platform android --profile preview
```

프롬프트가 나오면:
- "Would you like to automatically create an EAS project?" → **y** 입력

### 방법 3: Android Studio로 직접 빌드 (로그인 불필요, 복잡)

1. Android Studio 설치
2. 프로젝트를 Bare Workflow로 전환
3. Android Studio에서 직접 빌드

## 현재 상태
- ✅ Git 저장소 초기화 완료
- ✅ Expo 계정 로그인 완료
- ⏳ EAS 프로젝트 설정 필요

## 다음 단계

터미널에서 다음 명령어를 실행하세요:

```bash
eas build --platform android --profile preview
```

프롬프트가 나오면 **y**를 입력하여 EAS 프로젝트를 자동 생성하세요.
