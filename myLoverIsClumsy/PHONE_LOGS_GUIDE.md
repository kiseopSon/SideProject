# 물리적 Android 핸드폰에서 로그 확인하는 방법

## 방법 1: USB로 연결해서 ADB 사용 (가장 확실함)

### 1단계: 핸드폰에서 USB 디버깅 활성화

1. **설정** 앱 열기
2. **휴대전화 정보** 또는 **디바이스 정보** 찾기
3. **빌드 번호**를 7번 연속으로 탭 (개발자 옵션 활성화)
4. **설정**으로 돌아가기
5. **개발자 옵션** 찾기 (또는 **시스템** > **개발자 옵션**)
6. **USB 디버깅** 켜기
7. **USB를 통해 설치** 켜기 (있으면)

### 2단계: USB로 컴퓨터에 연결

1. USB 케이블로 핸드폰과 컴퓨터 연결
2. 핸드폰에서 **"USB 디버깅 허용"** 팝업이 뜨면 **허용** 선택
3. **"항상 이 컴퓨터에서 허용"** 체크

### 3단계: 연결 확인

PowerShell에서 실행:
```powershell
adb devices
```

핸드폰이 보이면 연결된 것입니다:
```
List of devices attached
ABC123XYZ    device  ← 이게 보이면 OK!
```

### 4단계: 로그 수집

```powershell
# 이전 로그 삭제
adb logcat -c

# 로그 수집 시작 (프로젝트 폴더에 저장)
adb logcat > app_logs.txt
```

1. 위 명령어 실행 (창을 열어두기)
2. **핸드폰에서 앱 실행 및 회원가입 시도**
3. 에러 발생 후 **Ctrl+C**로 중지
4. 프로젝트 폴더에 `app_logs.txt` 파일 생성됨

### 5단계: 로그 확인

```powershell
# Supabase 관련 로그만 필터링해서 보기
Get-Content app_logs.txt | Select-String "Supabase|Placeholder|환경|network"
```

## 방법 2: 앱 내에서 에러 상세 정보 표시 (더 쉬움)

앱에서 발생한 에러를 화면에 자세히 표시하도록 수정했습니다.
- 회원가입 실패 시 환경 변수 상태도 함께 표시됩니다
- "Placeholder 사용 중: true"가 보이면 환경 변수가 포함되지 않은 것입니다

## 방법 3: 무선 디버깅 (Wi-Fi)

USB 케이블 없이 Wi-Fi로 연결하는 방법:

### 1단계: USB로 한 번 연결해서 IP 확인
```powershell
adb tcpip 5555
adb shell ip addr show wlan0
# 또는 핸드폰 설정 > Wi-Fi > 연결된 네트워크 정보에서 IP 확인
```

### 2단계: USB 분리 후 Wi-Fi로 연결
```powershell
adb connect [핸드폰IP주소]:5555
# 예: adb connect 192.168.0.100:5555
```

### 3단계: 로그 수집
```powershell
adb logcat > app_logs.txt
```

## 빠른 확인: 에러 메시지만 보기

앱 실행 후 회원가입 시도했을 때 나온 에러 메시지를 알려주세요.
- 화면에 표시된 에러 메시지 전체
- "Placeholder 사용 중" 메시지가 있는지

이미 앱 코드를 수정해서 환경 변수 상태가 화면에 표시되도록 했습니다.
