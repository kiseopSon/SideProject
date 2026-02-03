# 환경 변수 최종 해결 방법

## 현재 상황
- 계정 레벨(`/accounts/sonkiseop/settings/environment-variables`) - 페이지는 있지만 값이 없음
- 프로젝트 레벨(`/accounts/sonkiseop/projects/my-lover-is-clumsy/settings/environment-variables`) - 페이지가 아예 없음
- EAS CLI로 환경 변수를 생성했다고 나왔지만 확인이 어려움

## 해결 방법

### 방법 1: 계정 레벨에 직접 설정 (웹사이트)

계정 레벨 페이지(`https://expo.dev/accounts/sonkiseop/settings/environment-variables`)에서:

1. **"Add Variable"** 또는 **"Create Variable"** 버튼 클릭
2. **첫 번째 변수:**
   - Name: `EXPO_PUBLIC_SUPABASE_URL`
   - Value: `https://rwnzjxqybphkopcbvkid.supabase.co`
   - Visibility: **"Sensitive"** 또는 **"Plain text"** 선택 (⚠️ "Secret" 아님!)
   - Environments: `preview`, `production` 체크
   - Create 클릭

3. **두 번째 변수:**
   - Name: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `.env` 파일에서 전체 Key 복사
   - Visibility: **"Sensitive"** 선택
   - Environments: `preview`, `production` 체크
   - Create 클릭

### 방법 2: eas.json에 직접 값 넣기 (임시 테스트용)

**⚠️ 주의: 이 방법은 보안상 좋지 않으므로 테스트용으로만 사용하세요!**

`eas.json`의 `env` 섹션에 `${}` 대신 직접 값을 넣을 수 있습니다:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://rwnzjxqybphkopcbvkid.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

**하지만 이 방법은 보안상 위험하므로 권장하지 않습니다!**

### 방법 3: 빌드 로그 확인 (가장 확실한 방법)

EAS CLI로 환경 변수를 생성했다고 나왔으므로, 실제로 설정되었는지 확인하는 가장 확실한 방법은 **빌드 로그를 확인**하는 것입니다:

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

**만약 "✅ 있음"이 나오면:**
- 환경 변수가 정상적으로 설정된 것
- 앱에서도 정상 작동해야 함

**만약 "❌ 없음"이 나오면:**
- 환경 변수가 실제로 설정되지 않은 것
- 방법 1 (계정 레벨에 직접 설정)을 시도해야 함

## 권장 순서

1. **먼저 방법 1 시도** (계정 레벨에 웹사이트에서 직접 설정)
2. **빌드 실행 및 로그 확인** (방법 3)
3. **만약 여전히 문제가 있으면 방법 2** (eas.json에 직접 값, 테스트용)
