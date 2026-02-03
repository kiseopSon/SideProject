# 폰트 및 라우팅 오류 해결

## 수정 사항

1. ✅ 라우팅 구조 수정: `tasks` 폴더에 `_layout.tsx` 추가
2. ✅ 폰트 로더 코드 제거: `expo-font` 불필요 (Ionicons는 벡터 아이콘)

## 다음 단계

1. **패키지 재설치**:
```bash
npm install
```

2. **서버 재시작**:
```bash
npx expo start -c
```

3. **앱 재로드**: 모바일에서 앱을 완전히 종료하고 다시 열기

## 폰트 오류가 여전히 발생하면

`@expo/vector-icons` 버전을 다운그레이드:

```bash
npm install @expo/vector-icons@13.0.0
```

또는 최신 버전으로 업데이트:

```bash
npm install @expo/vector-icons@latest
```

## 확인

- 라우팅 경고가 사라졌는지 확인
- 폰트 오류가 해결되었는지 확인
- 앱이 정상적으로 작동하는지 확인
