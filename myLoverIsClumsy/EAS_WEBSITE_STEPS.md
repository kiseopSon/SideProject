# Expo 웹사이트에서 환경 변수 설정하는 방법 (상세 가이드)

## 현재 문제
- 프로젝트별 variables 링크가 보이지 않음
- 계정 레벨의 environment-variables는 비어있음
- 환경 변수가 설정되지 않아 앱에서 Placeholder 사용 중

## 해결 방법: 웹사이트에서 직접 설정

### 단계별 안내

#### 1단계: Expo 웹사이트 접속
- https://expo.dev 접속
- 로그인 (sonkiseop 계정)

#### 2단계: 프로젝트 찾기

**방법 A: 프로필 메뉴에서**
1. 우측 상단 **프로필 아이콘** 클릭 (또는 프로필 이름)
2. 드롭다운 메뉴에서 **"Projects"** 또는 **"My Projects"** 선택
3. 프로젝트 목록에서 **"my-lover-is-clumsy"** 클릭

**방법 B: 직접 URL 접근**
- https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy
- 또는 https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy/settings

#### 3단계: 프로젝트 설정 페이지로 이동
프로젝트 페이지에서:
- 왼쪽 사이드바 메뉴 찾기
- **"Settings"** 또는 **"설정"** 클릭
- 또는 상단 탭에서 **"Settings"** 클릭

#### 4단계: Environment Variables 메뉴 찾기
Settings 페이지에서 다음 메뉴 중 하나를 찾으세요:
- **"Environment variables"**
- **"Variables"**  
- **"Secrets"**
- **"Build configuration"** → **"Environment variables"**
- **"Configuration"** → **"Environment variables"**
- **"Build settings"** → **"Environment variables"**

#### 5단계: 환경 변수 추가
**"Add Variable"** 또는 **"Create Variable"** 또는 **"New Variable"** 버튼 클릭

### 설정할 값 (첫 번째 변수)

**.env 파일에서 복사:**
- **Name (이름)**: `EXPO_PUBLIC_SUPABASE_URL`
- **Value (값)**: `https://rwnzjxqybphkopcbvkid.supabase.co`
- **Visibility (가시성)**: **"Sensitive"** 또는 **"Plain text"** 선택
  - ⚠️ **"Secret"**은 선택하지 마세요! (Secret은 빌드 스크립트에서만 사용됨)
- **Environments (환경)**: 
  - `preview` 체크
  - `production` 체크
- **Create** 또는 **Save** 클릭

### 설정할 값 (두 번째 변수)

또 다시 **"Add Variable"** 버튼 클릭

- **Name**: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `.env` 파일에서 전체 Key 값 복사 (매우 긴 문자열)
  - 시작: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Visibility**: **"Sensitive"** 선택
- **Environments**: `preview`, `production` 체크
- **Create** 클릭

## 확인 방법

설정 후 웹사이트에서:
- 두 개의 변수가 목록에 보여야 함
- Visibility가 "Sensitive" 또는 "Plain text"로 표시되어야 함

터미널에서:
```bash
eas env:list --scope project --non-interactive
```

## 설정 후 반드시 다시 빌드

```bash
eas build --platform android --profile preview
```

## 여전히 찾을 수 없으면

스크린샷을 찍어서 어느 페이지에 있는지 보여주시면, 정확한 위치를 안내해드리겠습니다.
