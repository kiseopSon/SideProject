# 정규식 생성기 (Regex Generator)

Windows용 실행 파일 형태의 정규식 생성 도구입니다.

## 기능

- **다중 언어 지원**: Java, Python, JavaScript, PostgreSQL SQL
- **다양한 패턴**: 이메일, 주민번호, 비밀번호, 아이디, 주소, 핸드폰번호 등
- **즉시 사용 가능**: 설치 없이 바로 실행 가능한 .exe 파일

## 실행 파일 생성 방법

### 방법 1: PowerShell 스크립트 사용 (권장)
```powershell
.\build.ps1
```

### 방법 2: 배치 파일 사용
```cmd
.\build.bat
```

또는 CMD에서:
```cmd
build.bat
```

### 방법 3: 수동 빌드
```powershell
py -m pip install -r requirements.txt
py -m PyInstaller --onefile --windowed --name=RegexGenerator main.py
```

생성된 실행 파일은 `dist/RegexGenerator.exe`에 있습니다.

## 개발 모드로 실행 (테스트용)

Windows에서 Python Launcher 사용:
```powershell
py -m pip install -r requirements.txt
py main.py
```

또는 Python이 PATH에 설정되어 있다면:
```bash
pip install -r requirements.txt
python main.py
```

**참고**: Windows에서는 `py` 명령어가 Python Launcher를 통해 Python을 실행합니다. `python` 명령어가 작동하지 않는 경우 `py`를 사용하세요.

## 사용 방법

1. `RegexGenerator.exe` 실행
2. 언어 선택 (Java, Python, JavaScript, PostgreSQL)
3. 원하는 패턴 선택
4. 생성된 정규식 복사하여 사용
