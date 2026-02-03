# My Lover is Clumsy 💕

덤벙거리고 자주 까먹는 애인을 위한 서포팅 앱입니다. 시간대별 할일을 등록하고, 알림을 받으며, 완료 여부를 커플과 공유할 수 있습니다.

## 주요 기능

- 👫 **커플 연결**: QR 코드 또는 연결 코드로 커플 연결
- ⏰ **시간대별 할일 등록**: 하루 스케줄을 시간대별로 등록
- 🔔 **양방향 알림**: 할일 시간이 되면 양쪽 모두에게 알림
- ✅ **완료 체크**: 할일 완료 시 상대방에게 자동 알림
- 📊 **대시보드**: 오늘의 할일과 완료 현황을 한눈에 확인

## 기술 스택

- **React Native** (Expo) - 크로스 플랫폼 모바일 개발
- **TypeScript** - 타입 안정성
- **Expo Router** - 파일 기반 라우팅
- **Supabase** - 백엔드 및 실시간 데이터베이스
- **TanStack Query** - 서버 상태 관리
- **Zustand** - 클라이언트 상태 관리
- **React Hook Form** - 폼 관리
- **Expo Notifications** - 푸시 알림

## 시작하기

### 설치

```bash
npm install
```

### 환경 변수 설정

`.env` 파일을 생성하고 Supabase 설정을 추가하세요:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 실행

```bash
npm start
```

## 프로젝트 구조

```
├── app/                 # Expo Router 페이지
├── components/          # 재사용 가능한 컴포넌트
├── lib/                # 유틸리티 및 설정
├── hooks/              # 커스텀 훅
├── store/              # Zustand 스토어
├── types/              # TypeScript 타입 정의
└── services/           # API 서비스
```
