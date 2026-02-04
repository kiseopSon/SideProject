"""
EAI Hub - Enterprise Application Integration Hub
모든 서비스를 하나의 허브에서 통합 관리하는 중앙 API Gateway
"""
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from contextlib import asynccontextmanager
import httpx
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging
from pathlib import Path
import secrets
import hashlib

from app.config import settings
from app.models import ServiceInfo, ServiceStatus, HealthCheckResponse
from app.service_registry import ServiceRegistry
from app.proxy import ProxyRouter
from app.health_checker import HealthChecker

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 서비스 레지스트리 및 헬스체커 초기화
service_registry = ServiceRegistry()
health_checker = HealthChecker(service_registry)
proxy_router = ProxyRouter(service_registry)

# 세션 관리 (실제 프로덕션에서는 Redis나 DB 사용 권장)
# 구조: {token: {"created_at": datetime, "username": str}}
active_sessions: Dict[str, dict] = {}
SESSION_SECRET = secrets.token_urlsafe(32)

# 최고 권한(API 정보 접근 가능) 계정 — 나중에 요청 승인 계정 목록으로 확장 가능
ADMIN_USERNAMES = {"admin"}


def create_session_token() -> str:
    """세션 토큰 생성"""
    return secrets.token_urlsafe(32)


def verify_session(session_token: Optional[str] = None) -> bool:
    """세션 검증"""
    if not session_token:
        return False
    if session_token in active_sessions:
        s = active_sessions[session_token]
        created = (s.get("created_at") if isinstance(s, dict) else s)
        if created and datetime.now() - created < timedelta(hours=24):
            return True
        del active_sessions[session_token]
    return False


def get_session_username(session_token: Optional[str] = None) -> Optional[str]:
    """세션에서 사용자명 반환 (없으면 None)"""
    if not session_token or session_token not in active_sessions:
        return None
    s = active_sessions[session_token]
    if isinstance(s, dict) and "username" in s:
        return s["username"]
    return None


def is_admin_user(session_token: Optional[str] = None) -> bool:
    """최고 권한(API 정보 버튼 등 접근 가능) 여부"""
    u = get_session_username(session_token)
    return u in ADMIN_USERNAMES if u else False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작/종료 시 실행"""
    # 시작 시
    logger.info("EAI Hub 시작 중...")
    await service_registry.load_services()
    health_checker.start_periodic_check()
    logger.info("EAI Hub 시작 완료")
    
    yield
    
    # 종료 시
    logger.info("EAI Hub 종료 중...")
    health_checker.stop()
    logger.info("EAI Hub 종료 완료")


app = FastAPI(
    title="EAI Hub - Enterprise Application Integration",
    description="모든 서비스를 통합 관리하는 중앙 API Gateway",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_session_token(request: Request) -> Optional[str]:
    """요청에서 세션 토큰 추출"""
    # 쿠키에서 세션 토큰 확인
    return request.cookies.get("session_token")


def require_auth(session_token: Optional[str] = Depends(get_session_token)) -> bool:
    """인증 필요 체크"""
    if not verify_session(session_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다"
        )
    return True


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """루트 페이지 - 로그인 화면"""
    session_token = get_session_token(request)
    
    # 이미 로그인되어 있으면 대시보드로 리다이렉트
    if verify_session(session_token):
        return RedirectResponse(url="/dashboard", status_code=303)
    
    # 로그인 페이지 HTML 반환
    return """
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>EAI Hub - 로그인</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .login-container {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                width: 100%;
                max-width: 400px;
            }

            .logo {
                text-align: center;
                margin-bottom: 30px;
            }

            .logo h1 {
                font-size: 2.5em;
                color: #667eea;
                margin-bottom: 10px;
            }

            .logo p {
                color: #666;
                font-size: 0.95em;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: #333;
                font-weight: 600;
                font-size: 0.9em;
            }

            .form-group input {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid #e5e7eb;
                border-radius: 10px;
                font-size: 1em;
                transition: border-color 0.3s;
            }

            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }

            .error-message {
                background: #fee;
                color: #c33;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 0.9em;
                display: none;
            }

            .error-message.show {
                display: block;
            }

            .login-btn {
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 1.1em;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            }

            .login-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }

            .login-btn:active {
                transform: translateY(0);
            }

            .info-text {
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 0.85em;
            }

            .loading {
                display: none;
                text-align: center;
                color: #667eea;
                margin-top: 10px;
            }

            .loading.show {
                display: block;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="logo">
                <h1>🚀 EAI Hub</h1>
                <p>Enterprise Application Integration</p>
            </div>

            <div class="error-message" id="errorMessage"></div>

            <form id="loginForm">
                <div class="form-group">
                    <label for="username">사용자명</label>
                    <input type="text" id="username" name="username" required autocomplete="username" placeholder="admin">
                </div>

                <div class="form-group">
                    <label for="password">비밀번호</label>
                    <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="비밀번호를 입력하세요">
                </div>

                <button type="submit" class="login-btn">로그인</button>
                <div class="loading" id="loading">로그인 중...</div>
            </form>

            <div class="info-text">
                기본 계정: admin / admin
            </div>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const errorMessage = document.getElementById('errorMessage');
                const loading = document.getElementById('loading');
                const loginBtn = document.querySelector('.login-btn');

                // 에러 메시지 숨기기
                errorMessage.classList.remove('show');
                loading.classList.add('show');
                loginBtn.disabled = true;

                try {
                    const formData = new FormData();
                    formData.append('username', username);
                    formData.append('password', password);

                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include'
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // 로그인 성공 - 대시보드로 이동
                        window.location.href = '/dashboard';
                    } else {
                        // 로그인 실패
                        errorMessage.textContent = data.detail || '로그인에 실패했습니다.';
                        errorMessage.classList.add('show');
                    }
                } catch (error) {
                    errorMessage.textContent = '로그인 중 오류가 발생했습니다.';
                    errorMessage.classList.add('show');
                } finally {
                    loading.classList.remove('show');
                    loginBtn.disabled = false;
                }
            });
        </script>
    </body>
    </html>
    """


@app.post("/api/auth/login")
async def login(request: Request):
    """로그인 API"""
    form = await request.form()
    username = form.get("username")
    password = form.get("password")
    
    # 간단한 인증 (실제 프로덕션에서는 DB나 LDAP 사용)
    # 기본 계정: admin / admin
    if username == "admin" and password == "admin":
        session_token = create_session_token()
        active_sessions[session_token] = {"created_at": datetime.now(), "username": username}
        
        response = JSONResponse({"message": "로그인 성공", "redirect": "/dashboard"})
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=False,  # HTTPS 사용 시 True로 변경
            samesite="lax",
            max_age=86400  # 24시간
        )
        return response
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자명 또는 비밀번호가 올바르지 않습니다"
        )


@app.post("/api/auth/logout")
async def logout(request: Request):
    """로그아웃 API"""
    session_token = get_session_token(request)
    if session_token and session_token in active_sessions:
        del active_sessions[session_token]

    response = JSONResponse({"message": "로그아웃되었습니다"})
    response.delete_cookie(key="session_token")
    return response


@app.get("/api/me")
async def get_current_user(request: Request):
    """현재 로그인 사용자 정보 (이름, 최고 권한 여부)"""
    session_token = get_session_token(request)
    if not verify_session(session_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="로그인이 필요합니다")
    username = get_session_username(session_token) or ""
    return {"username": username, "is_admin": is_admin_user(session_token)}


def _is_download_available(service_id: str, filename: str) -> bool:
    """데스크톱 도구 다운로드 파일 존재 여부"""
    if not filename:
        return False
    file_path = Path(__file__).parent / "static" / "downloads" / service_id / filename
    return file_path.exists()


@app.get("/api/services")
async def get_services():
    """등록된 모든 서비스 목록 조회"""
    services = service_registry.get_all_services()
    result = []
    for service in services:
        d = service.model_dump()
        if d.get("type") == "desktop" and (d.get("metadata") or {}).get("download_file"):
            d["download_available"] = _is_download_available(service.id, d["metadata"]["download_file"])
        else:
            d["download_available"] = None
        result.append(d)
    return {
        "total": len(result),
        "services": result
    }


@app.get("/services/{service_id}", response_class=HTMLResponse)
async def service_detail_page(service_id: str, request: Request):
    """서비스 상세 정보 페이지"""
    # 인증되지 않으면 로그인 페이지로 리다이렉트
    session_token = get_session_token(request)
    if not verify_session(session_token):
        return RedirectResponse(url="/", status_code=303)

    service = service_registry.get_service(service_id)
    if not service:
        raise HTTPException(status_code=404, detail=f"서비스 '{service_id}'를 찾을 수 없습니다")
    
    # 헬스체크 정보 가져오기
    health_status = await health_checker.check_service(service_id)
    
    # 서비스 정보를 HTML로 렌더링
    service_dict = service.model_dump()
    health_dict = health_status.model_dump()
    
    # 상태 배지 색상 결정
    is_desktop_download = (service_dict.get("type") == "desktop" and
                           (service_dict.get("metadata") or {}).get("download_file"))
    download_available = False
    if is_desktop_download:
        filename = (service_dict.get("metadata") or {}).get("download_file")
        download_available = _is_download_available(service_id, filename)
        status_text = "다운로드 가능" if download_available else "준비 중"
    elif not service_dict.get("enabled", True):
        status_text = "비활성화"
    elif health_dict.get("is_healthy", False):
        status_text = "정상"
    elif health_dict.get("error_message", "").startswith("헬스체크 불가"):
        status_text = "헬스체크 불가"
    else:
        status_text = "비정상"
    is_healthy = service_dict.get("enabled", True) and health_dict.get("is_healthy", False)
    # 다운로드 전용 서비스는 다운로드 가능 시 정상(녹색)으로 표시
    status_class = ("status-healthy" if (is_desktop_download and download_available) else
                    "status-unknown" if is_desktop_download else
                    "status-healthy" if is_healthy else "status-unhealthy")
    
    # 타입 라벨
    type_labels = {
        "api": "API",
        "web": "웹",
        "mobile": "모바일",
        "desktop": "데스크톱",
        "microservice": "마이크로서비스"
    }
    type_label = type_labels.get(service_dict.get("type", ""), service_dict.get("type", ""))
    
    # 메타데이터 포맷팅
    metadata_html = ""
    if service_dict.get("metadata"):
        metadata = service_dict["metadata"]
        if metadata.get("tech"):
            tech_html = "".join([f'<span class="info-badge">{tech}</span>' for tech in metadata["tech"]])
            metadata_html += f'<div class="detail-row"><label>기술 스택:</label><div class="badges">{tech_html}</div></div>'
        if metadata.get("ports"):
            ports_html = ", ".join([str(p) for p in metadata["ports"]])
            metadata_html += f'<div class="detail-row"><label>포트:</label><div>{ports_html}</div></div>'
        if metadata.get("category"):
            metadata_html += f'<div class="detail-row"><label>카테고리:</label><div>{metadata["category"]}</div></div>'
    
    # 날짜 포맷팅
    last_check_str = "없음"
    if health_dict.get("last_check"):
        try:
            last_check_dt = datetime.fromisoformat(str(health_dict["last_check"]).replace("Z", "+00:00"))
            last_check_str = last_check_dt.strftime("%Y-%m-%d %H:%M:%S")
        except:
            last_check_str = str(health_dict["last_check"])

    # API 접속 / API 정보 / 다운로드 링크
    session_token = get_session_token(request)
    show_api_info = is_admin_user(session_token)
    api_link_html = ""
    api_info_link_html = ""
    download_link_html = ""
    if is_desktop_download:
        if download_available:
            download_link_html = f'<a href="/api/download/{service_id}" class="btn btn-primary" download>다운로드</a>'
        else:
            download_link_html = '<span class="btn btn-secondary" style="opacity:0.7; cursor:not-allowed;">준비 중</span>'
    elif service_dict.get("api_prefix") and not (service_dict.get("metadata") or {}).get("hide_api_button"):
        if is_healthy:
            meta = service_dict.get("metadata") or {}
            api_url = meta.get("api_url") or f"/api/{service_id}/"
            api_link_html = '<a href="{}" class="btn btn-secondary" onclick="event.preventDefault(); openApiAccess(\'{}\')">API 접속</a>'.format(api_url, api_url.replace("'", "\\'"))
        if show_api_info:
            api_info_link_html = '<a href="/services/{}/api-info" class="btn btn-secondary">API 정보</a>'.format(service_id)

    # direct_access: Expo 등 프록시 미지원 서비스는 직접 URL로 접속
    meta = service_dict.get("metadata") or {}
    if meta.get("direct_access") and meta.get("port"):
        service_access_url = f"{request.url.scheme}://{request.url.hostname}:{meta['port']}/"
    else:
        service_access_url = f"/api/{service_id}/"
    service_access_link = f'<a href="#" class="btn btn-primary" onclick="openServiceAccess(event, \'{service_id}\', \'{service_access_url}\')">서비스 접속</a>'

    html_content = f"""
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{service_dict.get("name", "서비스")} - 상세 정보</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}

            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }}

            .container {{
                max-width: 900px;
                margin: 0 auto;
            }}

            .header {{
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                margin-bottom: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }}

            .header-content h1 {{
                color: #333;
                font-size: 2.5em;
                margin-bottom: 10px;
            }}

            .header-content p {{
                color: #666;
                font-size: 1.1em;
            }}

            .back-btn {{
                padding: 10px 20px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9em;
                font-weight: 600;
                text-decoration: none;
                display: inline-block;
                transition: background 0.3s;
            }}

            .back-btn:hover {{
                background: #5568d3;
            }}

            .detail-card {{
                background: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                margin-bottom: 20px;
            }}

            .status-badge {{
                display: inline-block;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 0.9em;
                font-weight: bold;
                margin-bottom: 20px;
            }}

            .status-healthy {{
                background: #10b981;
                color: white;
            }}

            .status-unhealthy {{
                background: #ef4444;
                color: white;
            }}

            .detail-section {{
                margin-bottom: 30px;
            }}

            .detail-section h2 {{
                color: #333;
                font-size: 1.5em;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e5e7eb;
            }}

            .detail-row {{
                display: flex;
                padding: 15px 0;
                border-bottom: 1px solid #f3f4f6;
            }}

            .detail-row:last-child {{
                border-bottom: none;
            }}

            .detail-row label {{
                font-weight: 600;
                color: #666;
                min-width: 150px;
                font-size: 0.95em;
            }}

            .detail-row div {{
                color: #333;
                flex: 1;
            }}

            .badges {{
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }}

            .info-badge {{
                background: #f3f4f6;
                padding: 6px 14px;
                border-radius: 15px;
                font-size: 0.85em;
                color: #555;
            }}

            .value-badge {{
                background: #667eea;
                color: white;
                padding: 6px 14px;
                border-radius: 15px;
                font-size: 0.85em;
                font-weight: 600;
            }}

            .action-buttons {{
                display: flex;
                gap: 15px;
                margin-top: 30px;
                padding-top: 30px;
                border-top: 2px solid #e5e7eb;
            }}

            .btn {{
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.95em;
                font-weight: 600;
                text-decoration: none;
                display: inline-block;
                transition: all 0.3s;
            }}

            .btn-primary {{
                background: #667eea;
                color: white;
            }}

            .btn-primary:hover {{
                background: #5568d3;
            }}

            .btn-secondary {{
                background: #e5e7eb;
                color: #333;
            }}

            .btn-secondary:hover {{
                background: #d1d5db;
            }}

            .no-value {{
                color: #9ca3af;
                font-style: italic;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="header-content">
                    <h1>{service_dict.get("name", "서비스")}</h1>
                    <p>{service_dict.get("description", "설명 없음")}</p>
                </div>
                <a href="/dashboard" class="back-btn">← 대시보드로</a>
            </div>

            <div class="detail-card">
                <div class="status-badge {status_class}">{status_text}</div>
                
                <div class="detail-section">
                    <h2>기본 정보</h2>
                    <div class="detail-row">
                        <label>서비스 ID:</label>
                        <div><span class="value-badge">{service_dict.get("id", "-")}</span></div>
                    </div>
                    <div class="detail-row">
                        <label>이름:</label>
                        <div>{service_dict.get("name", "-")}</div>
                    </div>
                    <div class="detail-row">
                        <label>설명:</label>
                        <div>{service_dict.get("description", "설명 없음")}</div>
                    </div>
                    <div class="detail-row">
                        <label>타입:</label>
                        <div><span class="info-badge">{type_label}</span></div>
                    </div>
                    <div class="detail-row">
                        <label>상태:</label>
                        <div><span class="value-badge">{status_text}</span></div>
                    </div>
                    <div class="detail-row">
                        <label>활성화 여부:</label>
                        <div><span class="value-badge">{'활성화' if service_dict.get("enabled", False) else '비활성화'}</span></div>
                    </div>
                </div>

                <div class="detail-section">
                    <h2>연결 정보</h2>
                    <div class="detail-row">
                        <label>Base URL:</label>
                        <div>{service_dict.get("base_url") or '<span class="no-value">없음</span>'}</div>
                    </div>
                    <div class="detail-row">
                        <label>Health Check URL:</label>
                        <div>{service_dict.get("health_check_url") or '<span class="no-value">없음</span>'}</div>
                    </div>
                    <div class="detail-row">
                        <label>API Prefix:</label>
                        <div>{service_dict.get("api_prefix") or '<span class="no-value">없음</span>'}</div>
                    </div>
                </div>

                <div class="detail-section">
                    <h2>상태 정보</h2>
                    <div class="detail-row">
                        <label>상태:</label>
                        <div><span class="value-badge">{status_text}</span></div>
                    </div>
                    <div class="detail-row">
                        <label>응답 시간:</label>
                        <div>{health_dict.get("response_time_ms") and f'{round(health_dict["response_time_ms"])}ms' or '<span class="no-value">측정 불가</span>'}</div>
                    </div>
                    <div class="detail-row">
                        <label>HTTP 상태 코드:</label>
                        <div>{health_dict.get("status_code") or '<span class="no-value">없음</span>'}</div>
                    </div>
                    <div class="detail-row">
                        <label>마지막 확인:</label>
                        <div>{last_check_str}</div>
                    </div>
                    {f'<div class="detail-row"><label>오류 메시지:</label><div style="color: #ef4444;">{health_dict.get("error_message")}</div></div>' if health_dict.get("error_message") else ''}
                </div>

                {f'<div class="detail-section"><h2>추가 정보</h2>{metadata_html}</div>' if metadata_html else ''}

                <div class="action-buttons">
                    {download_link_html}
                    {service_access_link if (service_dict.get("base_url") and is_healthy) else ''}
                    {api_link_html}
                    {api_info_link_html}
                    <a href="/dashboard" class="btn btn-secondary">대시보드로 돌아가기</a>
                </div>
            </div>
        </div>
        <script>
            async function openServiceAccess(event, serviceId, targetUrl) {{
                event.preventDefault();
                try {{
                    const res = await fetch(`/api/check-service-access/${{serviceId}}`);
                    if (!res.ok) {{
                        alert('서비스 접근이 막혀있습니다.');
                        return;
                    }}
                    window.open(targetUrl, '_blank');
                }} catch (err) {{
                    alert('서비스 접근이 막혀있습니다.');
                }}
            }}
            async function openApiAccess(url) {{
                try {{
                    const res = await fetch(url);
                    if (!res.ok) {{
                        const data = await res.json().catch(() => ({{}}));
                        alert(data.detail || 'API 접속에 실패했습니다.');
                        return;
                    }}
                    window.location.href = url;
                }} catch (err) {{
                    alert('API 접속 중 오류가 발생했습니다.');
                }}
            }}
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)


@app.get("/services/{service_id}/api-info", response_class=HTMLResponse)
async def service_api_info_page(service_id: str, request: Request):
    """API 정보 페이지 - 최고 권한(admin)만 접근 가능"""
    session_token = get_session_token(request)
    if not verify_session(session_token):
        return RedirectResponse(url="/", status_code=303)
    if not is_admin_user(session_token):
        return RedirectResponse(
            url="/dashboard?error=api_info_forbidden",
            status_code=303
        )

    service = service_registry.get_service(service_id)
    if not service:
        raise HTTPException(status_code=404, detail=f"서비스 '{service_id}'를 찾을 수 없습니다")
    if not service.api_prefix:
        raise HTTPException(status_code=400, detail="이 서비스는 API 엔드포인트를 제공하지 않습니다.")

    base = str(request.base_url).rstrip("/")
    api_base_url = f"{base}/api/{service_id}"
    service_dict = service.model_dump()

    html_content = f"""
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{service_dict.get("name", "서비스")} - API 정보</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }}
            .container {{ max-width: 700px; margin: 0 auto; }}
            .card {{
                background: white;
                padding: 32px;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                margin-bottom: 20px;
            }}
            .card h1 {{ color: #333; font-size: 1.8em; margin-bottom: 8px; }}
            .card p {{ color: #666; margin-bottom: 20px; line-height: 1.5; }}
            .url-box {{
                display: flex; gap: 12px; margin: 20px 0;
                background: #f8fafc; padding: 14px 16px; border-radius: 10px;
                border: 2px solid #e2e8f0;
                word-break: break-all;
            }}
            .url-box code {{ flex: 1; font-size: 0.95em; color: #334155; }}
            .btn {{
                padding: 10px 20px; border: none; border-radius: 8px;
                font-size: 0.95em; font-weight: 600; cursor: pointer;
                text-decoration: none; display: inline-block; transition: all 0.2s;
            }}
            .btn-copy {{ background: #667eea; color: white; }}
            .btn-copy:hover {{ background: #5568d3; }}
            .btn-back {{ background: #e5e7eb; color: #333; }}
            .btn-back:hover {{ background: #d1d5db; }}
            .badge {{ background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-size: 0.85em; }}
            .section {{ margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; }}
            .section h2 {{ color: #333; font-size: 1.1em; margin-bottom: 10px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <h1>{service_dict.get("name", "서비스")} API 정보</h1>
                <p>{service_dict.get("description", "") or "이 서비스의 API를 Hub 경유로 호출할 수 있는 공개용 정보입니다."}</p>
                <span class="badge">공개용 Base URL</span>
                <div class="url-box">
                    <code id="apiUrl">{api_base_url}</code>
                    <button type="button" class="btn btn-copy" onclick="copyUrl()">URL 복사</button>
                </div>
                <p style="color:#64748b;font-size:0.9em;">
                    이 URL을 다른 사람에게 공유하면, <strong>Hub({base})</strong>를 통해 이 서비스의 API를 호출할 수 있습니다.
                    <br>예: <code>{api_base_url}/</code> 또는 <code>{api_base_url}/원하는/경로</code>
                </p>
                <div class="section">
                    <h2>API 공개 방법</h2>
                    <p>필요한 대상에게 위 Base URL을 전달하면, 해당 서비스 API를 이용할 수 있습니다. 인증·속도 제한 등은 Hub 및 각 서비스 정책을 따릅니다.</p>
                </div>
                <p style="margin-top:24px;">
                    <a href="/services/{service_id}" class="btn btn-back">← 상세 정보로</a>
                    <a href="/dashboard" class="btn btn-back">대시보드로</a>
                </p>
            </div>
        </div>
        <script>
            function copyUrl() {{
                var el = document.getElementById("apiUrl");
                var text = el.textContent;
                if (navigator.clipboard && navigator.clipboard.writeText) {{
                    navigator.clipboard.writeText(text).then(function() {{
                        alert("URL이 클립보드에 복사되었습니다. 필요한 대상에게 공유할 수 있습니다.");
                    }}).catch(fallbackCopy);
                }} else {{
                    fallbackCopy();
                }}
                function fallbackCopy() {{
                    var ta = document.createElement("textarea");
                    ta.value = text;
                    ta.style.position = "fixed";
                    ta.style.left = "-9999px";
                    document.body.appendChild(ta);
                    ta.select();
                    try {{
                        if (document.execCommand("copy")) {{
                            alert("URL이 클립보드에 복사되었습니다. 필요한 대상에게 공유할 수 있습니다.");
                        }} else {{
                            throw new Error("execCommand failed");
                        }}
                    }} catch (e) {{
                        alert("복사에 실패했습니다. URL을 직접 선택해 복사해 주세요.");
                    }}
                    document.body.removeChild(ta);
                }}
            }}
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.get("/api/services/{service_id}")
async def get_service(service_id: str):
    """특정 서비스 정보 조회 (API)"""
    service = service_registry.get_service(service_id)
    if not service:
        raise HTTPException(status_code=404, detail=f"서비스 '{service_id}'를 찾을 수 없습니다")
    return service.model_dump()


@app.get("/api/health")
async def health_check():
    """전체 서비스 헬스체크"""
    services = service_registry.get_all_services()
    health_status = await health_checker.check_all_services()
    
    healthy_count = sum(1 for status in health_status.values() if status.is_healthy)
    
    return {
        "timestamp": datetime.now().isoformat(),
        "total_services": len(services),
        "healthy_services": healthy_count,
        "unhealthy_services": len(services) - healthy_count,
        "services": {
            service_id: status.model_dump() for service_id, status in health_status.items()
        }
    }


@app.get("/api/health/{service_id}")
async def service_health_check(service_id: str):
    """특정 서비스 헬스체크"""
    service = service_registry.get_service(service_id)
    if not service:
        raise HTTPException(status_code=404, detail=f"서비스 '{service_id}'를 찾을 수 없습니다")
    
    status = await health_checker.check_service(service_id)
    return status.model_dump()


@app.get("/api/health/{service_id}/debug", include_in_schema=False)
async def service_health_check_debug(service_id: str):
    """헬스체크 상세 (검증용)"""
    service = service_registry.get_service(service_id)
    if not service:
        raise HTTPException(status_code=404, detail=f"서비스 '{service_id}'를 찾을 수 없습니다")
    health_url = service.get_health_url()
    try:
        async with httpx.AsyncClient(timeout=5, follow_redirects=False) as client:
            resp = await client.get(health_url)
            return {
                "service_id": service_id,
                "health_url": health_url,
                "status_code": resp.status_code,
                "is_healthy": 200 <= resp.status_code < 300,
            }
    except Exception as e:
        return {
            "service_id": service_id,
            "health_url": health_url,
            "error": str(e),
            "is_healthy": False,
        }


def _check_urls_to_try(url: str) -> list:
    """localhost/127.0.0.1/::1 교차 시도용 URL 목록"""
    try:
        from urllib.parse import urlparse
        p = urlparse(url)
        if p.hostname not in ("localhost", "127.0.0.1", "::1"):
            return [url]
        scheme = p.scheme or "http"
        port = f":{p.port}" if p.port else ""
        path = (p.path or "/") + (f"?{p.query}" if p.query else "")
        return [
            f"{scheme}://localhost{port}{path}",
            f"{scheme}://127.0.0.1{port}{path}",
            f"{scheme}://[::1]{port}{path}",
        ]
    except Exception:
        return [url]


@app.get("/api/check-service-access/{service_id}")
async def check_service_access(service_id: str, request: Request):
    """서비스 접속 가능 여부 확인"""
    service = service_registry.get_service(service_id)
    if not service or not service.base_url:
        raise HTTPException(status_code=503, detail="서비스에 접근할 수 없습니다")
    meta = service.metadata or {}
    use_proxy_path = meta.get("proxy_base_path", False)
    if use_proxy_path:
        urls_to_try = [f"{str(request.base_url).rstrip('/')}/api/{service_id}/"]
    else:
        base_url = service.get_health_url() or f"{service.base_url.rstrip('/')}/"
        urls_to_try = _check_urls_to_try(base_url)
    last_err = None
    for url in urls_to_try:
        try:
            async with httpx.AsyncClient(timeout=5, follow_redirects=True) as client:
                resp = await client.get(url)
                if resp.status_code >= 300:
                    raise HTTPException(status_code=503, detail="서비스에 접근할 수 없습니다")
                return {"ok": True}
        except HTTPException:
            raise
        except Exception as e:
            last_err = e
            if url == urls_to_try[-1]:
                raise HTTPException(status_code=503, detail="서비스에 접근할 수 없습니다")
    raise HTTPException(status_code=503, detail="서비스에 접근할 수 없습니다")


# 데스크톱 도구 다운로드
DOWNLOADS_DIR = Path(__file__).parent / "static" / "downloads"


@app.get("/api/download/{service_id}")
async def download_service_file(service_id: str):
    """데스크톱 도구 파일 다운로드"""
    service = service_registry.get_service(service_id)
    if not service:
        raise HTTPException(status_code=404, detail=f"서비스 '{service_id}'를 찾을 수 없습니다")
    if service.type.value != "desktop":
        raise HTTPException(status_code=400, detail="다운로드 가능한 데스크톱 도구가 아닙니다")
    filename = (service.metadata or {}).get("download_file")
    if not filename:
        raise HTTPException(status_code=404, detail="다운로드 파일이 등록되지 않았습니다")
    file_path = DOWNLOADS_DIR / service_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="다운로드 파일을 찾을 수 없습니다. 관리자에게 문의하세요.")
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )


# Coffee statistics-service가 루트 경로로 리다이렉트하는 URL → coffee-gateway 프록시로 전달
@app.get("/complete-form")
@app.get("/experiment-form")
@app.get("/search-page")
@app.get("/history-page")
async def coffee_path_redirect(request: Request):
    """Coffee 앱의 /complete-form, /experiment-form → /api/coffee-gateway/... 로 리다이렉트"""
    path = request.url.path.lstrip("/")
    query = request.url.query
    redirect_url = f"/api/coffee-gateway/{path}"
    if query:
        redirect_url += f"?{query}"
    return RedirectResponse(url=redirect_url, status_code=307)


# 슬래시 없는 /api/{service_id} 요청 → 리다이렉트 (proxy 먼저 등록해 POST /api/experiments 직접 프록시)
_RESERVED_API_PATHS = {"services", "health", "me", "check-service-access", "auth", "download"}


@app.api_route("/api/{service_id}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_request(service_id: str, path: str, request: Request):
    """서비스 프록시 라우팅"""
    service = service_registry.get_service(service_id)
    if service:
        meta = service.metadata or {}
        if meta.get("direct_access") and meta.get("port"):
            # Expo 등 프록시 미지원: 직접 URL로 리다이렉트 (500 에러 방지)
            base = f"{request.url.scheme}://{request.url.hostname}:{meta['port']}"
            path_part = path.strip("/")
            query = request.url.query
            redirect_url = f"{base}/{path_part}" if path_part else f"{base}/"
            if query:
                redirect_url += f"?{query}"
            return RedirectResponse(url=redirect_url, status_code=307)
    try:
        response = await proxy_router.route(service_id, path, request)
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"프록시 라우팅 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"프록시 오류: {str(e)}")


@app.api_route("/api/{service_id}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], include_in_schema=False)
async def api_service_redirect(service_id: str, request: Request):
    """슬래시 없는 /api/{service_id} → 슬래시 포함으로 리다이렉트 (path 없는 경우만)"""
    if service_id in _RESERVED_API_PATHS:
        raise HTTPException(status_code=404, detail="Not Found")
    service = service_registry.get_service(service_id)
    if service:
        meta = service.metadata or {}
        if meta.get("direct_access") and meta.get("port"):
            redirect_url = f"{request.url.scheme}://{request.url.hostname}:{meta['port']}/"
            return RedirectResponse(url=redirect_url, status_code=307)
    return RedirectResponse(url=f"/api/{service_id}/", status_code=307)


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    """대시보드 페이지"""
    # 인증되지 않으면 로그인 페이지로 리다이렉트
    session_token = get_session_token(request)
    if not verify_session(session_token):
        return RedirectResponse(url="/", status_code=303)
    # HTML 직접 서빙 (303 리다이렉트 제거)
    dashboard_path = Path(__file__).parent / "static" / "dashboard.html"
    return FileResponse(dashboard_path, media_type="text/html")


# 정적 파일 서빙 (대시보드)
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


if __name__ == "__main__":
    import uvicorn
    import socket

    def is_port_in_use(port: int) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(("127.0.0.1", port)) == 0

    port = settings.PORT
    if is_port_in_use(port):
        logger.warning(f"포트 {port}이(가) 사용 중입니다. 5000 포트로 전환합니다.")
        port = 5000

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=port,
        reload=settings.DEBUG,
        log_level="info"
    )
