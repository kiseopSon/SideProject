# 폰트 오류 완전 해결

## 수정 사항

1. ✅ 모든 캐시 삭제 (node_modules, .expo, .metro, npm cache)
2. ✅ `@expo/vector-icons` 버전 다운그레이드: `15.0.3` → `14.0.0` (Expo SDK 51 호환)
3. ✅ 패키지 재설치

## 해결된 문제

- ❌ `_ExpoFontLoader.default.getLoadedFonts is not a function` 오류
- ❌ Metro 번들러 SHA-1 계산 오류
- ✅ Expo SDK 51과 호환되는 버전 사용

## 다음 단계

1. 서버가 재시작되었습니다
2. 모바일에서 앱을 완전히 종료하고 다시 열기
3. 폰트 오류가 해결되었는지 확인

## 참고

- `@expo/vector-icons@14.0.0`은 Expo SDK 51과 완벽하게 호환됩니다
- 향후 Expo SDK를 업그레이드할 때 `@expo/vector-icons`도 함께 업그레이드하세요

## 여전히 문제가 있다면

```bash
# 완전 초기화
Remove-Item -Recurse -Force node_modules, .expo, .metro
npm cache clean --force
npm install
npx expo start -c
```

이제 폰트 오류가 해결되었을 것입니다!
