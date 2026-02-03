# Stock Scalper (Kotlin + Firebase)

국내 단타(08:10~09:20) 트레이더를 위한 **리스크 관리 + 즉시 익절/손절 계산 + 실시간 현재가 비교** 앱입니다.

## 목표(0원 유지 전략)
- **Kotlin 필수**: Kotlin Multiplatform(KMP)로 공통 계산/도메인 로직 공유
- **Firebase 필수**: Auth/Firestore/FCM(푸시) 사용
- **실시간 현재가**: 한국투자증권 OpenAPI를 **서버(Functions) 프록시**로 호출 (키 보호)

## 폴더 구조
- `shared/`: KMP 공통 모듈(익절/손절/수량 계산, 도메인 모델)
- `apps/`: 앱들(추후 `androidApp/`, `iosApp/`)
- `functions/`: Firebase Functions(시세/토큰 프록시, 알림 트리거)

## 개발 순서(MVP)
1) `shared`에 계산 로직 구현
2) Android 앱에서 체결가 입력 → 즉시 TP/SL/수량 표시
3) Functions로 한국투자증권 토큰/시세 프록시
4) Firestore에 트레이드/규칙 저장, FCM 알림
