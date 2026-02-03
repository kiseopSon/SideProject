# 화장품 성분 분석 서비스 🧴

화장품 성분표를 입력하면 각 성분의 효과와 사용 목적을 자동으로 분석해주는 서비스입니다.

## 📋 프로젝트 개요

지성 피부를 가진 사용자가 자신에게 맞는 화장품을 선택할 수 있도록 도와주는 서비스입니다. 
성분표의 화학 용어들을 이해하기 쉽게 설명하여, 사용자가 제품을 더 잘 이해하고 선택할 수 있도록 합니다.

## 🛠️ 기술 스택

### 백엔드
- **Python 3.9+** - 데이터 분석 및 백엔드 개발
- **FastAPI** - 빠르고 현대적인 웹 프레임워크
- **SQLite/PostgreSQL** - 성분 데이터베이스
- **SQLAlchemy** - ORM
- **Pydantic** - 데이터 검증

### 프론트엔드
- **React 18+** - 사용자 인터페이스
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Axios** - HTTP 클라이언트

### 데이터
- 화장품 성분 데이터베이스 (INCI 이름 기반)
- 각 성분별 효과, 사용 목적, 주의사항 정보

## 📁 프로젝트 구조

```
cosmetics/
├── backend/           # FastAPI 백엔드
│   ├── app/
│   │   ├── api/      # API 라우트
│   │   ├── models/   # 데이터베이스 모델
│   │   ├── schemas/  # Pydantic 스키마
│   │   └── services/ # 비즈니스 로직
│   ├── requirements.txt
│   └── main.py
├── frontend/         # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── README.md
```

## 🚀 시작하기

### 빠른 시작 (한 번에 실행)

**방법 1: start.bat 사용 (Windows, 가장 권장)**
```bash
# 루트 디렉토리에서
start.bat
```
두 개의 새 창이 열립니다 (백엔드 + 프론트엔드)

**방법 1-2: npm scripts 사용**
```bash
# 루트 디렉토리에서
npm install  # concurrently 설치
npm run dev  # 백엔드 + 프론트엔드 동시 실행
```
**⚠️ Windows에서는 작동하지 않을 수 있습니다. 이 경우 `start.bat`를 사용하세요.**

**방법 2: Python 스크립트 사용**
```bash
# 루트 디렉토리에서
python start.py
```

**방법 3: 배치 파일 사용 (Windows)**
```bash
# 루트 디렉토리에서
start.bat
```

**방법 4: 셸 스크립트 사용 (Linux/Mac)**
```bash
# 루트 디렉토리에서
chmod +x start.sh
./start.sh
```

### 개별 실행

**백엔드만 실행**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**프론트엔드만 실행**
```bash
cd frontend
npm install
npm run dev
```

## 📝 주요 기능

1. **성분 입력** - 화장품 성분표를 텍스트로 입력
2. **성분 분석** - 각 성분의 효과와 사용 목적 설명
3. **피부 타입별 추천** - 지성/건성/민감성 등 피부 타입에 맞는 성분 분석
4. **주의 성분 표시** - 알레르기 유발 가능성이 있는 성분 알림

## 🔍 예시

**입력**: "황색 4호, 벤젠, 라우릴설페이트나트륨, 글리세린"

**출력**: 
- 황색 4호: 합성 색소, 주의 필요
- 벤젠: 용매로 사용되나 일부 제품에서는 제한적 사용
- 라우릴설페이트나트륨: 계면활성제, 깨끗하게 세정
- 글리세린: 보습제, 피부에 수분 공급

## 📚 참고 자료

- [화해 앱](https://www.hwahae.co.kr/) - 유사 서비스 참고
- INCI (International Nomenclature of Cosmetic Ingredients) 데이터베이스

## ✅ 완료된 기능

### 핵심 기능
- ✅ 성분 입력 및 분석
- ✅ 피부 타입별 호환성 평가 (지성/건성/민감성/복합성)
- ✅ 종합 분석 (점수, 주요 효과, 예상 결과, 상세 평가, 추천사항, 주의사항)
- ✅ 알 수 없는 성분 자동 업데이트 (크롤링)
- ✅ 성분별 상세 정보 (효과, 사용 목적, 주의사항)

### 기술적 개선
- ✅ CORS 설정 (다중 포트 지원)
- ✅ 성분 이름 매칭 개선 (공백/하이픈 무시, 대소문자 무시)
- ✅ 성분 타입 자동 분석 (보존제, 계면활성제, 보습제, 실리콘 등)
- ✅ 위키피디아 크롤링 지원
- ✅ 크롤링 결과 UI 피드백 (성공/실패/스킵)
- ✅ 휘발성 실리콘 구분 (사이클로메치콘 등)

### 데이터베이스
- ✅ JSON 기반 성분 데이터베이스
- ✅ 100+ 성분 정보 저장
- ✅ 자동 업데이트 메커니즘

## 🎯 사용 방법

1. **백엔드 시작**: `cd backend && uvicorn main:app --reload`
2. **프론트엔드 시작**: `cd frontend && npm run dev`
3. **성분 입력**: 화장품 뒷면의 성분표를 복사해서 붙여넣기
4. **분석 확인**: 각 성분의 효과와 종합 분석 결과 확인
5. **알 수 없는 성분**: "🔄 성분 정보 업데이트" 버튼으로 자동 크롤링

## 🐛 알려진 이슈

- favicon 404 오류: 해결됨 (favicon.svg 추가)
- 크롤링 성공률: 일부 성분은 외부 소스에서 정보를 찾지 못할 수 있음

