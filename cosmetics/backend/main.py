from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import routes
from app.api import admin_routes
import threading
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="화장품 성분 분석 API",
    description="화장품 성분표를 분석하여 각 성분의 효과를 설명해주는 API",
    version="1.0.0"
)

# CORS 설정 (프론트엔드와 통신하기 위해)
# 개발: localhost:9005, 프로덕션: EAI Hub 프록시 경유 (sonkiseop.iptime.org)
allowed_origins = [
    "http://localhost:9005",
    "http://127.0.0.1:9005",
    "http://sonkiseop.iptime.org",
    "https://sonkiseop.iptime.org",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(routes.router)
app.include_router(admin_routes.router)  # 관리자 라우터 추가

@app.get("/")
async def root():
    return {
        "message": "화장품 성분 분석 API",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 빌드된 프론트엔드 정적 파일 서빙 (HMR WebSocket 없음 - 콘솔 오류 제거)
# 배포 전: cd frontend && npm run build
_frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _frontend_dist.exists():
    app.mount("/api/cosmetics", StaticFiles(directory=str(_frontend_dist), html=True), name="cosmetics-frontend")

