# My Lover is Clumsy - 프로젝트 요약

## 프로젝트 개요
덤벙거리고 자주 까먹는 애인을 위한 서포팅 앱입니다. 시간대별 할일을 등록하고, 양방향 알림을 통해 서로 챙겨주는 기능을 제공합니다.

## 구현된 주요 기능

### 1. 인증 시스템
- ✅ 이메일/비밀번호 회원가입 및 로그인
- ✅ Supabase Authentication 연동
- ✅ SecureStore를 통한 안전한 세션 관리

### 2. 커플 연결
- ✅ 연결 코드 생성 및 공유
- ✅ 코드를 통한 커플 연결
- ✅ 실시간 파트너 정보 동기화

### 3. 할일 관리
- ✅ 시간대별 할일 등록
- ✅ 할일 목록 조회 (전체/오늘/예정/완료 필터)
- ✅ 할일 상세 보기
- ✅ 할일 완료 처리
- ✅ 할일 삭제

### 4. 알림 시스템
- ✅ 할일 시간 알림 (양방향)
- ✅ 완료 시 상대방 알림
- ✅ Expo Notifications 연동
- ✅ 푸시 토큰 관리

### 5. 대시보드
- ✅ 오늘의 할일 통계
- ✅ 다가오는 할일 목록
- ✅ 완료 현황 표시

## 기술 스택

### 프론트엔드
- **React Native** (Expo SDK 51)
- **TypeScript** - 타입 안정성
- **Expo Router** - 파일 기반 라우팅
- **TanStack Query** - 서버 상태 관리
- **Zustand** - 클라이언트 상태 관리
- **React Hook Form** - 폼 관리
- **date-fns** - 날짜 처리

### 백엔드
- **Supabase** - BaaS (Backend as a Service)
  - Authentication
  - PostgreSQL 데이터베이스
  - Row Level Security (RLS)
  - 실시간 구독 (향후 확장 가능)

### 알림
- **Expo Notifications** - 푸시 알림
- **Expo Push Notification Service** - 크로스 플랫폼 알림 전송

## 프로젝트 구조

```
myLoverIsClumsy/
├── app/                    # Expo Router 페이지
│   ├── (auth)/            # 인증 관련 화면
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── connect.tsx
│   ├── (tabs)/            # 메인 탭 화면
│   │   ├── index.tsx      # 홈 대시보드
│   │   ├── tasks/         # 할일 관리
│   │   │   ├── index.tsx
│   │   │   ├── new.tsx
│   │   │   └── [id].tsx
│   │   └── profile.tsx
│   └── _layout.tsx
├── components/            # 재사용 컴포넌트
├── hooks/                 # 커스텀 훅
├── lib/                   # 라이브러리 설정
│   └── supabase.ts
├── services/              # API 서비스
│   ├── authService.ts
│   ├── taskService.ts
│   └── notificationService.ts
├── store/                 # Zustand 스토어
│   ├── authStore.ts
│   └── taskStore.ts
├── types/                 # TypeScript 타입
└── supabase/              # 데이터베이스 스키마
    └── schema.sql
```

## 다음 단계 (향후 개선 사항)

1. **실시간 동기화**
   - Supabase Realtime을 통한 실시간 할일 업데이트
   - 상대방의 할일 완료 상태 실시간 반영

2. **알림 개선**
   - 반복 할일 설정
   - 알림 사운드 커스터마이징
   - 알림 시간 조정 (예: 10분 전 알림)

3. **통계 및 분석**
   - 주간/월간 완료율 통계
   - 할일 패턴 분석
   - 성취 배지 시스템

4. **소셜 기능**
   - 할일 완료 시 축하 메시지
   - 커플 간 메시지 기능
   - 할일 히스토리 공유

5. **접근성**
   - 다크 모드 지원
   - 다국어 지원 (영어 추가)
   - 접근성 개선 (스크린 리더 지원)

6. **성능 최적화**
   - 이미지 최적화
   - 오프라인 모드 지원
   - 데이터 캐싱 개선

## 실행 방법

1. 패키지 설치: `npm install`
2. 환경 변수 설정: `.env` 파일 생성
3. Supabase 설정: `supabase/schema.sql` 실행
4. 개발 서버 시작: `npm start`

자세한 설정 방법은 `SETUP.md` 참고
