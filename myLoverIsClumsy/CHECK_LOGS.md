# Android 로그 확인 방법

## 방법 1: PowerShell에서 실시간 로그 확인 (가장 쉬움)

### 1단계: Android 디바이스/에뮬레이터 연결 확인
```powershell
# 디바이스 연결 확인
adb devices
```
- 디바이스가 보이면 연결된 것입니다
- 아무것도 안 보이면 USB 디버깅 활성화 필요

### 2단계: 로그 확인 (실시간)
```powershell
# Supabase 관련 로그만 필터링해서 보기
adb logcat | Select-String "Supabase|환경|Placeholder|EXPO_PUBLIC"

# 또는 모든 React Native 로그 보기
adb logcat | Select-String "ReactNative|Expo"
```

### 3단계: 로그를 파일로 저장
```powershell
# 로그를 파일로 저장 (현재 폴더에 저장됨)
adb logcat | Select-String "Supabase|환경|Placeholder|EXPO_PUBLIC|ReactNative" > app_logs.txt

# 앱 실행 후 잠시 기다렸다가 Ctrl+C로 중지
# 그러면 app_logs.txt 파일에 로그가 저장됩니다
```

## 방법 2: 모든 로그를 파일로 저장 (권장)

### 단계별 명령어
```powershell
# 1. 이전 로그 삭제 (선택사항)
adb logcat -c

# 2. 앱 실행하기 전에 로그 수집 시작
# (새 PowerShell 창을 열어서 실행하는 것이 좋습니다)
adb logcat > app_full_logs.txt

# 3. 앱 실행
# 4. 회원가입 시도
# 5. 몇 초 기다린 후 Ctrl+C로 중지

# 6. 저장된 로그 확인
Get-Content app_full_logs.txt | Select-String "Supabase|환경|Placeholder|EXPO_PUBLIC"
```

## 방법 3: 앱 내에서 로그 확인 (코드 수정)

앱 실행 시 환경 변수 상태를 Alert로 표시하도록 코드를 수정할 수 있습니다.

## 방법 4: 로그캣 GUI 도구 사용

Android Studio의 Logcat 창 사용:
1. Android Studio 실행
2. 하단의 "Logcat" 탭 클릭
3. 필터에 "Supabase" 입력

## 빠른 확인 명령어 (한 줄)

```powershell
# 로그를 파일로 저장하고 동시에 화면에 표시
adb logcat -v time | Tee-Object -FilePath app_logs.txt | Select-String "Supabase|환경|Placeholder|EXPO_PUBLIC|network request"
```

## 확인해야 할 로그

다음과 같은 로그가 보여야 합니다:
```
🔍 Supabase 환경 변수 상태:
  URL 설정됨: true
  URL 값: https://rwnzjxqybphkopcbvkid.supabase.co...
  Key 설정됨: true
  Key 값: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Placeholder 사용 중: false
```

만약 `Placeholder 사용 중: true`가 보이면:
- 환경 변수가 빌드에 포함되지 않았음
- 다시 빌드 필요

## 문제 해결

### "adb: command not found" 오류가 나면
- Android SDK Platform Tools 설치 필요
- 또는 Android Studio가 설치되어 있으면 경로 추가:
  ```powershell
  $env:Path += ";C:\Users\$env:USERNAME\AppData\Local\Android\Sdk\platform-tools"
  ```

### 디바이스가 연결되지 않으면
1. USB 디버깅 활성화 (설정 > 개발자 옵션 > USB 디버깅)
2. USB 케이블로 연결
3. 디바이스에서 "USB 디버깅 허용" 선택

### 에뮬레이터 사용 중이면
- 에뮬레이터가 실행 중이면 자동으로 연결됩니다
