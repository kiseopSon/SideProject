# EAS 빌드 --wait 옵션 사용

## 현재 문제

터미널에서 `Error: build command failed.` 메시지가 나오지만, 빌드가 실제로 시작되었는지 확인이 어렵습니다.

## 해결 방법: --wait 옵션 사용

EAS CLI는 `--wait` 옵션을 지원합니다. 이 옵션을 사용하면 빌드가 완료될 때까지 기다리면서 전체 로그를 볼 수 있습니다.

### 명령어:

```bash
eas build --platform android --profile preview --wait
```

### 장점:

1. **빌드가 실제로 시작되었는지 확인 가능**
   - 빌드 ID가 표시됨
   - 빌드 진행 상황을 실시간으로 확인 가능

2. **전체 빌드 로그 확인**
   - 빌드 과정의 모든 로그를 볼 수 있음
   - 에러 메시지를 바로 확인 가능

3. **빌드 완료 확인**
   - 빌드가 완료될 때까지 기다림
   - 성공/실패 여부를 명확히 확인 가능

### 참고:

- `--wait` 옵션을 사용하면 빌드가 완료될 때까지 터미널이 대기합니다
- 빌드가 오래 걸릴 수 있으므로 (5-10분), 시간이 필요합니다
- `Ctrl+C`로 중단할 수 있지만, 빌드는 서버에서 계속 진행됩니다

## 상세 로그 옵션

더 자세한 로그를 보려면:

```bash
eas build --platform android --profile preview --wait --verbose-logs
```

또는 로그 레벨 설정:

```bash
eas build --platform android --profile preview --wait --build-logger-level debug
```

## 확인할 내용

`--wait` 옵션을 사용하면 다음을 확인할 수 있습니다:

1. **빌드 ID:**
   ```
   Build ID: xxxxx-xxxxx-xxxxx
   ```

2. **빌드 링크:**
   ```
   https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy/builds/xxxxx
   ```

3. **빌드 진행 상황:**
   ```
   Queued for build...
   Starting build...
   Installing dependencies...
   Building app...
   ```

4. **환경 변수 확인 메시지:**
   ```
   🔍 app.config.js - 환경 변수 확인:
     process.env.EXPO_PUBLIC_SUPABASE_URL: ✅ 있음 (...)
   ```

5. **에러 메시지 (실패한 경우):**
   ```
   Error: ...
   ```

## 다음 단계

`--wait` 옵션을 사용하여 빌드를 실행하세요:

```bash
eas build --platform android --profile preview --wait
```

이렇게 하면 빌드가 실제로 시작되었는지, 그리고 어느 단계에서 실패했는지 확인할 수 있습니다.
