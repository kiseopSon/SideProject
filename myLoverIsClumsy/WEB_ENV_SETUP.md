# 웹사이트에서 환경 변수 설정하는 방법

## 문제
- 프로젝트별 variables 링크가 보이지 않음
- 계정 레벨의 environment-variables는 비어있음
- EAS CLI로 확인해도 환경 변수가 없음

## 해결 방법: 웹사이트에서 직접 설정

### 올바른 경로 (단계별)

1. **https://expo.dev** 접속 및 로그인

2. **프로젝트로 이동하는 방법 (여러 방법 시도):**
   
   **방법 A: 프로필 메뉴에서**
   - 우측 상단 프로필 아이콘 클릭
   - **"Projects"** 또는 **"내 프로젝트"** 선택
   - **"my-lover-is-clumsy"** 프로젝트 클릭
   
   **방법 B: 직접 URL로 접근**
   - https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy
   
   **방법 C: 대시보드에서**
   - 홈페이지에서 프로젝트 목록 확인
   - **"my-lover-is-clumsy"** 클릭

3. **프로젝트 페이지에서:**
   - 왼쪽 사이드바에서 **"Settings"** 클릭
   - 또는 상단 메뉴에서 **"Settings"** 찾기

4. **환경 변수 설정 메뉴 찾기:**
   - **"Environment variables"** 또는
   - **"Variables"** 또는  
   - **"Secrets"** 또는
   - **"Build configuration"** → **"Environment variables"** 또는
   - **"Configuration"** → **"Environment variables"**

5. **"Add Variable"** 또는 **"Create Variable"** 버튼 클릭

### 설정할 값

**.env 파일에서 복사한 값:**

**첫 번째 변수:**
- **Name**: `EXPO_PUBLIC_SUPABASE_URL`
- **Value**: `https://rwnzjxqybphkopcbvkid.supabase.co`
- **Visibility**: **"Sensitive"** 또는 **"Plain text"** 선택 (⚠️ "Secret" 아님!)
- **Environments**: `preview`, `production` 체크
- **Create** 클릭

**두 번째 변수:**
- **Name**: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `.env` 파일에서 전체 Key 복사
- **Visibility**: **"Sensitive"** 또는 **"Plain text"** 선택
- **Environments**: `preview`, `production` 체크
- **Create** 클릭

## 대안: EAS CLI로 설정 (재시도)

웹사이트에서 찾기 어려우시면, 다시 EAS CLI로 설정해보세요:

```bash
# .env 파일에서 값 읽어서 설정
# (이전에 실행했던 명령어를 다시 실행)
```

## 확인 방법

환경 변수 설정 후:
```bash
eas env:list --scope project --non-interactive
```

두 개의 변수가 보여야 합니다.
