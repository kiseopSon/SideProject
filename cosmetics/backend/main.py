from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
# 개발 환경에서는 localhost 포트 범위 허용
# localhost와 127.0.0.1 모두 지원 (5173-5180 포트 범위)
allowed_origins = []
for port in range(5173, 5181):  # 5173부터 5180까지
    allowed_origins.extend([
        f"http://localhost:{port}",
        f"http://127.0.0.1:{port}",
    ])
# Additional common ports
allowed_origins.extend([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
])

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

