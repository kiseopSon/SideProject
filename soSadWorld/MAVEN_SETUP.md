# Maven 설치 가이드

## Windows에서 Maven 설치 (권장)

### 빠른 설치 방법

1. **Maven 다운로드**
   - https://maven.apache.org/download.cgi 접속
   - `apache-maven-3.9.x-bin.zip` 다운로드 (최신 안정 버전)

2. **압축 해제**
   - ZIP 파일을 원하는 위치에 압축 해제
   - 예: `C:\Program Files\Apache\maven` (또는 `C:\tools\apache-maven`)

3. **환경 변수 설정**

   **방법 A: GUI로 설정**
   1. `Win + X` → 시스템 → 고급 시스템 설정
   2. "환경 변수" 버튼 클릭
   3. 시스템 변수에서 "새로 만들기":
      - 변수 이름: `MAVEN_HOME`
      - 변수 값: Maven이 압축 해제된 경로 (예: `C:\Program Files\Apache\maven`)
   4. 시스템 변수에서 `Path` 선택 → 편집
   5. "새로 만들기" → `%MAVEN_HOME%\bin` 추가
   6. 모든 창에서 "확인" 클릭

   **방법 B: PowerShell로 설정 (관리자 권한 필요)**
   ```powershell
   # MAVEN_HOME 설정 (경로는 실제 설치 경로로 변경)
   [System.Environment]::SetEnvironmentVariable("MAVEN_HOME", "C:\Program Files\Apache\maven", "Machine")
   
   # Path에 추가
   $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
   [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;%MAVEN_HOME%\bin", "Machine")
   ```

4. **설치 확인**
   - **새 PowerShell/CMD 창**을 열고 (환경 변수 적용을 위해)
   ```cmd
   mvn --version
   ```
   
   Maven 버전 정보가 표시되면 설치 완료!

### 설치 후 확인

```cmd
mvn --version
```

출력 예시:
```
Apache Maven 3.9.6
Maven home: C:\Program Files\Apache\maven
Java version: 17.0.x
```

## 문제 해결

### Maven을 찾을 수 없음
- 환경 변수 설정 후 **새 터미널 창**을 열어야 합니다
- PATH에 `%MAVEN_HOME%\bin` 또는 전체 경로가 올바르게 추가되었는지 확인

### 권한 문제
- 환경 변수를 시스템 변수로 설정하려면 관리자 권한이 필요합니다
- 사용자 변수로 설정해도 작동하지만, 다른 사용자에게는 적용되지 않습니다

## 대안: Chocolatey 사용 (Windows 패키지 관리자)

Chocolatey가 설치되어 있다면:

```powershell
choco install maven
```

환경 변수가 자동으로 설정됩니다.
