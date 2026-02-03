# Expo Font Loader 오류 해결

## 오류
`_EXPOFONTLOADER.DEFAULT.GETLOADEDFONTS IS NOT A FUNCTION`

## 즉시 해결 방법

### 방법 1: 캐시 클리어 및 재시작 (가장 빠름)

```bash
# 서버 중지 (Ctrl+C)
# 그 다음
npx expo start -c --clear
```

### 방법 2: 완전 초기화

```bash
# 서버 중지 후
rm -rf node_modules
rm -rf .expo
npm install
npx expo start -c
```

### 방법 3: Windows PowerShell에서

```powershell
# 서버 중지 후
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .expo
npm install
npx expo start -c
```

## 추가 확인

만약 여전히 문제가 있다면:

```bash
# npm 캐시도 클리어
npm cache clean --force
rm -rf node_modules .expo
npm install
npx expo start -c
```

이 오류는 보통 캐시 문제이므로 캐시를 클리어하면 해결됩니다!
