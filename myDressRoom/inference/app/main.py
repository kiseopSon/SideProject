"""
가상 피팅 인퍼런스 서비스. 로컬 IDM-VTON만 사용 (무료, GPU).
- IDM-VTON이 설정되지 않으면 503 안내.
"""
import io

from fastapi import File, UploadFile, APIRouter
from fastapi.responses import HTMLResponse, JSONResponse, Response
from PIL import Image

from .viton_backend import is_viton_configured, run_viton

router = APIRouter(prefix="/api/v1", tags=["가상 피팅"])

VITON_NOT_CONFIGURED = {
    "detail": "실제 사람이 입은 것처럼 만들려면 로컬 IDM-VTON 설정이 필요합니다.",
    "hint": "프로젝트 루트에 IDM-VTON 클론 후 conda env 'idm' 생성, setup 스크립트 실행.",
    "docs": "README의 '실제 착용 합성' 섹션을 참고하세요.",
}
VITON_RUN_FAILED = {
    "detail": "합성 중 오류가 발생했습니다.",
    "hint": "RAM 부족 가능성이 큽니다. 다른 프로그램을 종료한 뒤, PowerShell에서 IDM-VTON CLI만 먼저 실행해 보세요. (README 참고)",
}


@router.post(
    "/generate",
    response_class=Response,
    summary="이미지 합성 (VITON)",
    description="사람 1장 + 의류 1장 이상. 상의는 첫 번째 의류로 실제 착용 합성(IDM-VTON)을 시도합니다.",
)
async def generate(
    person: UploadFile = File(..., description="사람 증명사진/전신 사진"),
    garments: list[UploadFile] = File(..., description="의류 이미지 (첫 번째가 상의로 사용)"),
):
    """사람 + 의류 → 합성 PNG. VITON 미설정 시 503."""
    person_bytes = await person.read()
    if not person_bytes:
        return JSONResponse(status_code=400, content={"detail": "person 이미지가 비어 있습니다."})

    garment_first: bytes | None = None
    for g in garments or []:
        if g.size and g.size > 0:
            garment_first = await g.read()
            break
    if not garment_first:
        return JSONResponse(status_code=400, content={"detail": "의류 이미지가 1장 이상 필요합니다."})

    out_bytes: bytes | None = None
    configured = is_viton_configured()
    if configured:
        out_bytes = run_viton(person_bytes, garment_first, category="upper_body")

    if out_bytes is None:
        payload = VITON_NOT_CONFIGURED if not configured else VITON_RUN_FAILED
        return JSONResponse(status_code=503, content=payload)

    return Response(content=out_bytes, media_type="image/png")


def _index_html() -> str:
    return """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My DressRoom Inference</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #1a1a1f; color: #e8e8ec; margin: 0; min-height: 100vh; padding: 1.5rem; }
    .wrap { max-width: 640px; margin: 0 auto; }
    h1 { font-size: 1.35rem; margin-bottom: 0.5rem; }
    .muted { color: #888; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .card { background: #25252d; border: 1px solid #333; border-radius: 10px; padding: 1.25rem; margin-bottom: 1rem; }
    .card h3 { margin: 0 0 0.5rem 0; font-size: 0.95rem; }
    .card p { margin: 0; color: #888; font-size: 0.85rem; }
    input[type="file"] { display: none; }
    .btn { display: inline-block; padding: 0.5rem 1rem; background: #6c5ce7; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; margin-top: 0.5rem; }
    .btn:hover { background: #7c6ef6; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .thumbs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .thumbs img { width: 56px; height: 56px; object-fit: cover; border-radius: 6px; border: 1px solid #333; }
    #runStatus { margin-top: 0.5rem; font-size: 0.9rem; color: #888; }
    #runStatus.err { color: #f08080; }
    #outBox { margin-top: 1.5rem; display: none; }
    #outBox.show { display: block; }
    #outBox img { max-width: 100%; border-radius: 10px; border: 1px solid #333; }
    .links { margin-top: 1.5rem; font-size: 0.9rem; }
    .links a { color: #7c6ef6; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>My DressRoom Inference</h1>
    <p class="muted">사람 사진 + 의류 사진을 넣으면 실제 착용한 것처럼 합성합니다. (로컬 IDM-VTON, GPU)</p>
    <p class="muted" style="margin-top:0.25rem;">IDM-VTON 미설정 시 “VITON 설정 필요”가 뜹니다. README 참고.</p>

    <div class="card">
      <h3>사람 사진 (1장)</h3>
      <p>증명사진·전신 등</p>
      <input type="file" id="fPerson" accept="image/*">
      <button type="button" class="btn" onclick="document.getElementById('fPerson').click()">파일 선택</button>
      <div class="thumbs" id="tPerson"></div>
    </div>
    <div class="card">
      <h3>의류 이미지 (여러 장)</h3>
      <p>셔츠, 바지, 신발 등</p>
      <input type="file" id="fGarments" accept="image/*" multiple>
      <button type="button" class="btn" onclick="document.getElementById('fGarments').click()">파일 선택</button>
      <div class="thumbs" id="tGarments"></div>
    </div>

    <button type="button" class="btn" id="btnRun" disabled>합성하기</button>
    <div id="runStatus"></div>
    <div id="outBox">
      <h3>결과</h3>
      <img id="outImg" src="" alt="합성 결과">
    </div>

    <div class="links" style="margin-top:2rem;">
      <a href="/docs">API 문서 (Swagger)</a> · <a href="/redoc">API 문서 (ReDoc)</a><br>
      <span class="muted">실제 착용 합성: README의 「실제 착용 합성」 참고 (로컬 IDM-VTON, GPU)</span>
    </div>
  </div>
  <script>
    const fPerson = document.getElementById('fPerson');
    const fGarments = document.getElementById('fGarments');
    const tPerson = document.getElementById('tPerson');
    const tGarments = document.getElementById('tGarments');
    const btnRun = document.getElementById('btnRun');
    const runStatus = document.getElementById('runStatus');
    const outBox = document.getElementById('outBox');
    const outImg = document.getElementById('outImg');
    let personFile = null, garmentFiles = [];
    function thumb(blob) { const u = URL.createObjectURL(blob); const i = document.createElement('img'); i.src = u; i.alt = ''; return i; }
    function up() { btnRun.disabled = !(personFile && garmentFiles.length); }
    fPerson.onchange = () => { personFile = fPerson.files && fPerson.files[0] || null; tPerson.innerHTML = ''; if (personFile) tPerson.appendChild(thumb(personFile)); up(); };
    fGarments.onchange = () => { garmentFiles = fGarments.files ? Array.from(fGarments.files) : []; tGarments.innerHTML = ''; garmentFiles.forEach(f => tGarments.appendChild(thumb(f))); up(); };
    btnRun.onclick = async () => {
      if (!personFile || !garmentFiles.length) return;
      const fd = new FormData();
      fd.append('person', personFile);
      garmentFiles.forEach(f => fd.append('garments', f));
      runStatus.textContent = '합성 중…';
      runStatus.classList.remove('err');
      outBox.classList.remove('show');
      try {
        const r = await fetch('/api/v1/generate', { method: 'POST', body: fd });
        const ct = r.headers.get('content-type') || '';
        if (r.status === 503 && ct.includes('json')) {
          const j = await r.json();
          runStatus.textContent = (j.detail || 'VITON 설정 필요') + ' ' + (j.hint || '');
          runStatus.classList.add('err');
          return;
        }
        if (!r.ok) { runStatus.textContent = '오류: ' + r.status + ' ' + (await r.text()); runStatus.classList.add('err'); return; }
        const blob = await r.blob();
        outImg.src = URL.createObjectURL(blob);
        outBox.classList.add('show');
        runStatus.textContent = '완료';
      } catch (e) {
        runStatus.textContent = '오류: ' + e.message;
        runStatus.classList.add('err');
      }
    };
  </script>
</body>
</html>"""


def create_app():
    from fastapi import FastAPI
    app = FastAPI(title="My DressRoom Inference", version="0.1.0")
    app.include_router(router)

    @app.get("/", response_class=HTMLResponse)
    async def root():
        return _index_html()

    return app


app = create_app()
