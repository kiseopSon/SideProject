# Supabase 설정 상세 가이드

## 1단계: Supabase 프로젝트 URL과 Anon Key 찾기

### 방법 1: Settings > API 메뉴에서 찾기 (추천)

1. Supabase 대시보드에 로그인
2. 왼쪽 사이드바에서 **Settings** (⚙️ 아이콘) 클릭
3. **API** 메뉴 클릭
4. 다음 정보를 찾을 수 있습니다:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co` 형식
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 형식의 긴 문자열

### 방법 2: 프로젝트 홈에서 찾기

1. Supabase 대시보드 홈 화면
2. 프로젝트 카드에서 **Settings** 클릭
3. **API** 섹션으로 이동

## 2단계: .env 파일 생성 및 설정

### Windows에서 .env 파일 생성하기

#### 방법 1: 파일 탐색기에서 생성
1. 프로젝트 루트 폴더 (`myLoverIsClumsy`)로 이동
2. 새 텍스트 파일 생성
3. 파일 이름을 `.env`로 변경 (확장자 없음)
   - 파일 탐색기에서 "파일 이름 확장자" 표시가 켜져 있어야 함
   - `.env.txt`가 아닌 `.env`로 저장

#### 방법 2: 명령 프롬프트/PowerShell에서 생성
```powershell
# 프로젝트 폴더로 이동
cd C:\Users\icaru\git\SideProject\myLoverIsClumsy

# .env 파일 생성
New-Item -Path .env -ItemType File
```

#### 방법 3: VS Code에서 생성
1. VS Code에서 프로젝트 열기
2. 왼쪽 파일 탐색기에서 프로젝트 루트 우클릭
3. "New File" 선택
4. 파일 이름에 `.env` 입력

### .env 파일 내용 작성

`.env` 파일을 열고 다음 내용을 입력하세요:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

**실제 예시:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_PROJECT_ID=my-lover-is-clumsy
```

⚠️ **주의사항:**
- `EXPO_PUBLIC_SUPABASE_URL`의 `https://`와 `.supabase.co`는 그대로 유지
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`는 전체 문자열을 복사 (매우 길 수 있음)
- 각 줄 끝에 공백이나 따옴표 없이 입력
- `=` 앞뒤로 공백 없이 입력

## 3단계: Authentication 설정 확인

1. Supabase 대시보드에서 **Authentication** 메뉴 클릭
2. **Providers** 탭 확인
3. **Email** 프로바이더가 활성화되어 있는지 확인
   - 비활성화되어 있다면 토글을 켜서 활성화

## 4단계: 설정 확인

### 환경 변수 확인 방법

터미널에서 다음 명령어로 확인할 수 있습니다:

```powershell
# PowerShell에서
Get-Content .env

# 또는
cat .env
```

### 앱에서 확인

앱을 실행했을 때 Supabase 연결 오류가 없다면 정상적으로 설정된 것입니다.

```bash
npm start
```

## 문제 해결

### .env 파일이 인식되지 않는 경우

1. 파일 이름이 정확히 `.env`인지 확인 (`.env.txt` 아님)
2. 프로젝트 루트 폴더에 있는지 확인
3. Expo 서버 재시작:
   ```bash
   # 서버 중지 (Ctrl+C)
   npm start
   ```

### Supabase 연결 오류

1. URL과 Key가 정확히 복사되었는지 확인
2. URL에 `https://`가 포함되어 있는지 확인
3. Key에 공백이나 줄바꿈이 없는지 확인
4. Supabase 프로젝트가 활성화되어 있는지 확인 (대시보드에서 확인)

### 파일이 보이지 않는 경우

Windows 탐색기에서 숨김 파일 표시:
1. 파일 탐색기에서 **보기** 탭
2. **숨긴 항목** 체크박스 선택
