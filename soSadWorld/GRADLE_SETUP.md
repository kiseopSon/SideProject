# Gradle 설치 가이드

## Windows에서 Gradle 설치

### 빠른 설치 방법

1. **Gradle 다운로드**
   - https://gradle.org/releases/ 접속
   - `gradle-8.5-bin.zip` 다운로드 (또는 최신 버전)

2. **압축 해제**
   - ZIP 파일을 원하는 위치에 압축 해제
   - 예: `C:\Program Files\Gradle` (또는 `C:\tools\gradle`)

3. **환경 변수 설정**

   **방법 A: GUI로 설정**
   1. `Win + X` → 시스템 → 고급 시스템 설정
   2. "환경 변수" 버튼 클릭
   3. 시스템 변수에서 "새로 만들기":
      - 변수 이름: `GRADLE_HOME`
      - 변수 값: Gradle이 압축 해제된 경로 (예: `C:\Program Files\Gradle\gradle-8.5`)
   4. 시스템 변수에서 `Path` 선택 → 편집
   5. "새로 만들기" → `%GRADLE_HOME%\bin` 추가
   6. 모든 창에서 "확인" 클릭

   **방법 B: PowerShell로 설정 (관리자 권한 필요)**
   ```powershell
   # GRADLE_HOME 설정 (경로는 실제 설치 경로로 변경)
   [System.Environment]::SetEnvironmentVariable("GRADLE_HOME", "C:\Program Files\Gradle\gradle-8.5", "Machine")
   
   # Path에 추가
   $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
   [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;%GRADLE_HOME%\bin", "Machine")
   ```

4. **설치 확인**
   - **새 PowerShell/CMD 창**을 열고 (환경 변수 적용을 위해)
   ```cmd
   gradle --version
   ```
   
   Gradle 버전 정보가 표시되면 설치 완료!

### Gradle Wrapper 생성

각 서비스 디렉토리에서:

```bash
cd gateway-service
gradle wrapper

cd ../diary-service
gradle wrapper

cd ../ai-analysis-service
gradle wrapper

cd ../analysis-result-service
gradle wrapper
```

또는 스크립트로:

```powershell
.\setup-gradle-wrapper.ps1
```

## 대안: Chocolatey 사용 (빠른 설치)

Chocolatey가 설치되어 있다면:

```powershell
choco install gradle
```

환경 변수가 자동으로 설정됩니다.

## Gradle vs Maven

- **Gradle**: 더 빠른 빌드, Kotlin/DSL 지원
- **Maven**: 더 널리 사용, XML 설정

두 가지 모두 Spring Boot에서 완벽하게 지원됩니다.
