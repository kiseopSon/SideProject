# 🏠 서울 부동산 지도 앱

서울 지역의 부동산 정보를 지도와 함께 제공하는 웹 애플리케이션입니다.

## ✨ 주요 기능

- 🗺️ **카카오 지도 기반**: 서울 지역 부동산 위치 표시
- 🔍 **검색 및 필터링**: 지역, 가격, 면적, 부동산 타입별 검색
- 📍 **마커 시스템**: 지도상 부동산 위치 표시 및 상호작용
- 📱 **반응형 디자인**: 모바일과 데스크톱 모두 지원
- 🎨 **모던 UI**: Tailwind CSS를 활용한 깔끔한 디자인

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 카카오 지도 API 키 설정

1. [Kakao Developers](https://developers.kakao.com/)에서 애플리케이션 생성
2. JavaScript 키 복사
3. `index.html` 파일의 `YOUR_KAKAO_MAPS_API_KEY` 부분을 실제 키로 교체

```html
<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=실제_API_키"></script>
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 🏗️ 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── Map/            # 지도 관련 컴포넌트
│   ├── Property/       # 부동산 정보 컴포넌트
│   ├── Search/         # 검색 및 필터 컴포넌트
│   └── Layout/         # 레이아웃 컴포넌트
├── stores/             # Zustand 상태 관리
├── data/               # 샘플 데이터
└── hooks/              # 커스텀 훅
```

## 🛠️ 사용된 기술

- **Frontend**: React 19, Vite
- **지도**: 카카오 지도 API
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS
- **데이터 페칭**: React Query

## 💰 API 비용

- **무료 할당량**: 월 300,000건
- **초과 요금**: 1,000건당 1.1원
- **부동산 앱 사용 시**: 일반적으로 월 100-1,000건 → **완전 무료** 🎉

## 📱 사용법

1. **지도 탐색**: 마우스로 지도를 드래그하여 이동, 휠로 확대/축소
2. **부동산 검색**: 상단 검색바에서 지역명, 역명, 부동산명으로 검색
3. **필터링**: 왼쪽 사이드바에서 가격, 면적, 타입별 필터 적용
4. **상세 정보**: 지도의 마커나 목록의 카드를 클릭하여 선택

## 🔧 빌드

```bash
npm run build
```

## �� 라이선스

MIT License
