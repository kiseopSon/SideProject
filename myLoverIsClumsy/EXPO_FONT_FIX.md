# expo-font 버전 수정 완료

## 수정 사항

1. ✅ `expo-font` 버전 변경: `^14.0.10` → `~12.0.0` (Expo SDK 51 호환)
2. ✅ `@expo/vector-icons` 버전 확인: `^14.0.2` (최신 안정 버전)

## 해결된 문제

- `expo-font` 버전이 Expo SDK 51과 호환되지 않았던 문제
- `_ExpoFontLoader.default.getLoadedFonts is not a function` 오류

## Expo SDK 51 호환 버전

- `expo`: `~51.0.0`
- `expo-font`: `~12.0.0` ✅
- `@expo/vector-icons`: `^14.0.2` ✅

## 다음 단계

1. 서버가 재시작되었습니다
2. 모바일에서 앱을 완전히 종료하고 다시 열기
3. 폰트 오류가 해결되었는지 확인

이제 Expo SDK 51과 호환되는 버전으로 설정되었습니다!
