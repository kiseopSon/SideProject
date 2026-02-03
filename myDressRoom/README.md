# My DressRoom

증명사진 + 의류 이미지(셔츠, 바지, 신발 등)를 올리면 **3D처럼 보이는 2D 합성 이미지**를 만들어 주는 서비스입니다.

## 기술 스택·아키텍처

- **백엔드**: Java 17, Spring Boot 3.2  
  - REST API (작업 생성·조회, 결과 이미지 제공)  
  - 파일 업로드 저장, 비동기 작업 처리  
  - Python 인퍼런스 서비스 HTTP 호출
- **인퍼런스**: Python 3.10+, FastAPI  
  - 사람 이미지 + 의류 이미지 → **실제 착용 합성(VITON)** 또는 503 안내  
  - **로컬 IDM-VTON**만 사용 (무료, GPU). conda env `idm` + `gradio_demo/run_tryon_cli.py`
- **프론트**: 정적 HTML/JS (Spring Boot `static`)

```
[브라우저] → [Spring Boot :8080] → [FastAPI 인퍼런스 :8000]
                  ↓
            data/uploads/, data/outputs/
```

## 실행 방법

### 1. 인퍼런스 서비스 (Python)

```bash
cd inference
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

→ `http://localhost:8000` 에서 동작. API: `POST /api/v1/generate`

### 2. 백엔드 (Java)

**Maven이 PATH에 없어도** 프로젝트에 포함된 **Maven Wrapper**로 실행할 수 있습니다.

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

(이미 `mvn`이 설치되어 있다면 `mvn spring-boot:run` 그대로 사용해도 됩니다.)

→ `http://localhost:8080` 에서 동작.  
→ `http://localhost:8080/` 에서 웹 UI, `http://localhost:8080/api/outfit/create` 등 REST 호출 가능.

### 3. 웹에서 사용

1. 브라우저에서 `http://localhost:8080/` 접속
2. **사람 사진**: 증명사진 또는 전신 사진 1장 업로드
3. **의류 이미지**: 셔츠·바지·신발 등 원하는 만큼 업로드
4. **합성하기** 버튼 클릭 후, 완료까지 대기
5. 결과 이미지가 화면에 표시됨

## API 개요

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/outfit/create` | `person`(1장), `garments`(복수) multipart 업로드 → `jobId` 반환 |
| GET | `/api/jobs/{jobId}` | 작업 상태 및 `resultImageUrl` 조회 |
| GET | `/api/output/{filename}` | 생성된 이미지 파일 반환 |

## 설정

`backend/src/main/resources/application.yml`:

- `app.storage.base-dir`: 업로드·결과 파일이 저장되는 기준 디렉터리 (기본: 프로젝트 루트의 `data`)
- `app.inference.base-url`: 인퍼런스 서비스 URL (기본: `http://localhost:8000`)
- `app.inference.generate-path`: 생성 API 경로 (기본: `/api/v1/generate`)

## 실제 착용 합성 (VITON, 무료·GPU)

**「사람이 실제로 입은 것처럼」** 나오게 하려면 **로컬 IDM-VTON**만 사용합니다. 유료 API는 사용하지 않습니다. 미설정 시 `POST /api/v1/generate` 는 **503** 과 함께 안내를 반환합니다.

### 1. 설정 (한 번만)

프로젝트 루트에서:

```powershell
.\scripts\setup-conda-and-idm.ps1
```

이 스크립트는:
- **Miniconda 자동 설치** (없으면 다운로드·설치)
- IDM-VTON이 없으면 `git clone` 후 프로젝트 루트 `IDM-VTON/` 에 둡니다.
- conda env **`idm`** 을 `environment.yaml` 로 생성합니다 (PyTorch+CUDA, Gradio 등).
- 모델은 Hugging Face `yisol/IDM-VTON` 에서 첫 실행 시 자동 다운로드됩니다.

**참고:** conda가 이미 설치되어 있으면 `.\scripts\setup-idm-vton.ps1` 만 실행해도 됩니다.

### 2. 실행

**방법 1: 스크립트 사용 (권장)**
```powershell
.\scripts\run-inference.ps1
```

**방법 2: 수동 실행**
```powershell
cd inference
.\.venv\Scripts\Activate.ps1  # 가상환경 활성화
python run.py
```

인퍼런스 서비스는 `IDM-VTON` 경로를 자동으로 찾고, `conda run -n idm` 으로 CLI를 실행합니다.

### 3. 사용

`http://localhost:8000/` 에서 사람 사진 + 의류 이미지(첫 번째가 상의)를 넣고 **합성하기**를 누르면, 로컬 IDM-VTON이 **GPU**에서 실행되어 **무료로** 실제 착용 합성 결과가 나옵니다.

**참고:**
- GPU 사용 (`cuda:0`). CPU만 있으면 매우 느릴 수 있습니다.
- 첫 실행 시 모델 로딩에 수십 초~수 분 걸릴 수 있습니다.
- `IDM_VTON_PATH` 로 경로를 바꿀 수 있습니다 (기본: 프로젝트 루트 `IDM-VTON`).
- **8GB VRAM**: 기본으로 CPU offload 사용 (모델은 CPU에 두고 추론 시에만 GPU 사용). **16GB+ RAM** 권장.
- **디스크 부족**이 아니면 `IDM_USE_DISK_OFFLOAD=1` 로 디스크 오프로드 시도 (저RAM·저VRAM 시). **15GB+ 여유 디스크** 필요.

### 4. 503 / "합성 중 오류" / RAM 부족

**증상:** `RuntimeError: DefaultCPUAllocator: not enough memory` 또는 `MemoryError` 가 서버 로그에 뜨는 경우.

**대처:**
1. **다른 프로그램 종료** — 브라우저, IDE, 게임 등 메모리를 많이 쓰는 앱을 닫고 **가용 RAM 8GB 이상**을 확보하세요.
2. **IDM-VTON CLI만 먼저 실행** — 인퍼런스 서버를 **끈 상태**에서, **새 PowerShell 창**을 열고:
   ```powershell
   cd C:\Users\icaru\git\SideProject\myDressRoom\IDM-VTON
   $py = "$env:USERPROFILE\miniconda3\envs\idm\python.exe"
   & $py gradio_demo/run_tryon_cli.py --human gradio_demo/example/human/00034_00.jpg --garment gradio_demo/example/cloth/04469_00.jpg --output "$env:TEMP\out.png"
   ```
   여기서 **성공**하면 IDM-VTON은 정상입니다. 이때 인퍼런스 서버(`.\scripts\run-inference.ps1`)를 다시 켜고 `http://localhost:8000` 에서 합성을 시도하세요.
3. **가상 메모리(페이지 파일) 확인** — Windows 설정 → 시스템 → 정보 → 고급 시스템 설정 → 고급 → 성능 설정 → 고급 → 가상 메모리. 부족하면 **시스템 관리 크기** 또는 **사용자 지정 크기**로 늘리세요.

## 라이선스

프로젝트 목적에 맞게 자유롭게 사용 가능합니다.
