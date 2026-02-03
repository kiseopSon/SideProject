# "Can not resolve the url" 오류 해결

## 원인
Expo Go 앱이 개발 서버의 URL을 찾을 수 없을 때 발생합니다.

## 해결 방법

### 방법 1: Tunnel 모드 사용 (가장 확실함)

```bash
# 현재 서버 중지 (Ctrl+C)
# Tunnel 모드로 시작
npx expo start --tunnel
```

**장점:**
- 다른 WiFi 네트워크에서도 작동
- 방화벽 문제 우회
- 가장 안정적

**단점:**
- 처음 연결 시 시간이 걸릴 수 있음
- 인터넷 연결 필요

### 방법 2: LAN 모드 명시

```bash
# 현재 서버 중지 (Ctrl+C)
# LAN 모드로 시작
npx expo start --lan
```

### 방법 3: 포트 변경

```bash
# 다른 포트 사용
npx expo start --port 8082
```

그 다음 Expo Go에서 URL을 `exp://192.168.0.3:8082`로 변경

### 방법 4: IP 주소 확인

1. 터미널에서 IP 주소 확인:
```bash
# Windows PowerShell
ipconfig

# IPv4 주소 찾기 (예: 192.168.0.3)
```

2. Expo Go에서 URL 직접 입력:
   - `exp://[IP주소]:8081`
   - 예: `exp://192.168.0.3:8081`

### 방법 5: 방화벽 설정

Windows 방화벽이 포트 8081을 차단할 수 있습니다:

1. Windows 설정 → 방화벽 및 네트워크 보호
2. 고급 설정
3. 인바운드 규칙 → 새 규칙
4. 포트 선택 → TCP → 특정 로컬 포트: 8081
5. 연결 허용 선택
6. 모든 프로필에 적용

### 방법 6: 네트워크 재연결

1. 컴퓨터 WiFi 끄기 → 켜기
2. 모바일 WiFi 끄기 → 켜기
3. 같은 네트워크인지 확인
4. 서버 재시작

## 추천 순서

1. **먼저 Tunnel 모드 시도** (가장 확실함)
2. 안 되면 LAN 모드 시도
3. 그래도 안 되면 방화벽 확인
4. 마지막으로 네트워크 재연결

## Tunnel 모드 사용 시

```bash
npx expo start --tunnel
```

터미널에 다음과 같은 메시지가 표시됩니다:
```
› Metro waiting on exp://xxx-xxx.anonymous.exp.direct:80
```

이 URL을 Expo Go에 입력하거나 QR 코드를 스캔하세요.

## 추가 팁

- Tunnel 모드는 처음 연결 시 시간이 걸릴 수 있습니다 (1-2분)
- Tunnel URL은 `exp://`로 시작합니다
- QR 코드가 터미널에 표시됩니다
