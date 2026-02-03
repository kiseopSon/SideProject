# Expo 웹사이트에서 환경 변수 페이지 찾기

## 현재 문제
- `https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy/settings/environment-variables` 페이지가 없음
- 환경 변수 설정 페이지를 찾을 수 없음

## 해결 방법: 다양한 경로 시도

### 방법 1: 프로젝트 대시보드에서 직접 찾기

1. **프로젝트 대시보드 접속:**
   ```
   https://expo.dev/accounts/sonkiseop/projects/my-lover-is-clumsy
   ```

2. **다음 메뉴들을 하나씩 클릭해서 확인:**
   - 왼쪽 사이드바에서 "**Settings**" 클릭
   - 또는 "**Configuration**" 클릭
   - 또는 "**Build Configuration**" 클릭
   - 또는 "**Variables**" 클릭
   - 또는 "**Secrets**" 클릭

3. **또는 상단 탭에서:**
   - "**Settings**" 탭 클릭
   - "**Builds**" 탭 클릭 → 최근 빌드에서 "Environment variables" 찾기
   - "**Configuration**" 탭 클릭

### 방법 2: Builds 페이지에서 확인

1. 프로젝트 대시보드에서 "**Builds**" 탭 클릭
2. 최근 빌드를 클릭
3. 빌드 상세 페이지에서 "**Environment variables**" 또는 "**Configuration**" 찾기

### 방법 3: 프로젝트 설정에서 확인

1. 프로젝트 대시보드 접속
2. 우측 상단 또는 설정 아이콘(⚙️) 클릭
3. "**Project Settings**" 또는 "**Settings**" 선택
4. "**Environment Variables**" 또는 "**Variables**" 메뉴 찾기

## 대안: EAS CLI만 사용

웹사이트에서 찾을 수 없다면, **EAS CLI로만 설정**하는 것이 더 확실합니다:

```bash
# 환경 변수 재설정
eas env:create preview --name EXPO_PUBLIC_SUPABASE_URL --value "값" --scope project --type string --visibility sensitive
```

## 확인 방법: 빌드 로그 확인

웹사이트나 CLI 확인 대신, **빌드 로그를 확인**하는 것이 가장 확실합니다:

1. 빌드 실행:
   ```bash
   eas build --platform android --profile preview
   ```

2. 빌드 로그에서 다음 메시지 찾기:
   ```
   🔍 app.config.js - 환경 변수 확인:
     process.env.EXPO_PUBLIC_SUPABASE_URL: ✅ 있음 (...)
     또는
     process.env.EXPO_PUBLIC_SUPABASE_URL: ❌ 없음
   ```

**만약 "❌ 없음"이 나오면:**
- EAS Secrets에 환경 변수가 설정되지 않은 것
- 빌드 시점에 환경 변수가 주입되지 않은 것

**만약 "✅ 있음"이 나오면:**
- 환경 변수가 정상적으로 설정된 것
- 앱에서도 정상 작동해야 함

## 결론

웹사이트에서 페이지를 찾기 어렵다면:
1. **EAS CLI로 환경 변수 설정** (이미 완료됨)
2. **빌드 실행 후 빌드 로그 확인** (가장 확실한 방법)
3. 빌드 로그 결과에 따라 추가 조치
