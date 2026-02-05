"""프록시 라우터"""
import logging
import re
from typing import Optional
from urllib.parse import urlparse
from fastapi import Request, HTTPException
from fastapi.responses import Response
import httpx
from app.service_registry import ServiceRegistry
from app.config import settings

logger = logging.getLogger(__name__)


class ProxyRouter:
    """프록시 라우팅"""
    
    def __init__(self, registry: ServiceRegistry):
        self.registry = registry
    
    async def route(self, service_id: str, path: str, request: Request) -> Response:
        """요청을 대상 서비스로 프록시"""
        service = self.registry.get_service(service_id)
        
        if not service:
            raise HTTPException(status_code=404, detail=f"서비스 '{service_id}'를 찾을 수 없습니다")
        
        if not service.enabled:
            raise HTTPException(status_code=503, detail=f"서비스 '{service_id}'가 비활성화되어 있습니다")
        
        if not service.base_url:
            raise HTTPException(status_code=503, detail=f"서비스 '{service_id}'는 API 엔드포인트가 없습니다")
        
        # proxy_base_path: Vite base 사용 서비스(ball-bounce 등)만 전체 경로 전달
        # backend_path: 프론트엔드가 /api/coffee 호출 시 백엔드 /api/coffee 경로로 전달
        # backend_port: 실제 프록시 대상 포트 (experiments → 8101 gateway 직접)
        meta = service.metadata or {}
        use_base_path = meta.get("proxy_base_path", False)
        backend_path = meta.get("backend_path", "").rstrip("/")
        path_part = path.lstrip("/") if path else ""
        proxy_base = service.base_url
        if meta.get("backend_port") is not None:
            p = urlparse(service.base_url or "")
            host = p.hostname or "127.0.0.1"
            proxy_base = f"{p.scheme or 'http'}://{host}:{meta['backend_port']}"
        if use_base_path:
            base_path = f"api/{service_id}/"
            target_url = f"{proxy_base.rstrip('/')}/{base_path}{path_part}"
        elif backend_path:
            target_url = f"{proxy_base.rstrip('/')}{backend_path}/{path_part}" if path_part else f"{proxy_base.rstrip('/')}{backend_path}"
        else:
            target_url = f"{proxy_base.rstrip('/')}/{path_part}" if path_part else f"{proxy_base.rstrip('/')}/"
        
        # 쿼리 파라미터 추가
        if request.url.query:
            target_url += f"?{request.url.query}"
        
        # 요청 헤더 준비
        headers = dict(request.headers)
        headers.pop("host", None)
        headers.pop("content-length", None)
        headers.pop("origin", None)
        headers["referer"] = f"{proxy_base.rstrip('/')}/"
        
        body = await request.body()
        
        def _alt_urls(u: str) -> list:
            try:
                p = urlparse(u)
                if p.hostname not in ("localhost", "127.0.0.1", "::1"):
                    return [u]
                scheme = p.scheme or "http"
                port = f":{p.port}" if p.port else ""
                path = (p.path or "/") + (f"?{p.query}" if p.query else "")
                return [
                    f"{scheme}://localhost{port}{path}",
                    f"{scheme}://127.0.0.1{port}{path}",
                    f"{scheme}://[::1]{port}{path}",
                ]
            except Exception:
                return [u]
        
        proxy_timeout = meta.get("proxy_timeout")
        if proxy_timeout is None:
            proxy_timeout = settings.PROXY_TIMEOUT
        urls_to_try = _alt_urls(target_url)
        last_err = None
        for try_url in urls_to_try:
            try:
                async with httpx.AsyncClient(
                    timeout=proxy_timeout,
                    follow_redirects=True
                ) as client:
                    response = await client.request(
                        method=request.method,
                        url=try_url,
                        headers=headers,
                        content=body if body else None
                    )
                    response_headers = dict(response.headers)
                    response_headers.pop("access-control-allow-origin", None)
                    response_headers.pop("access-control-allow-credentials", None)
                    response_headers.pop("access-control-allow-methods", None)
                    response_headers.pop("access-control-allow-headers", None)
                    response_headers.pop("content-length", None)
                    response_headers.pop("transfer-encoding", None)
                    content = response.content or b""
                    content_modified = False
                    if not use_base_path and path_part == "" and content:
                        ct = response.headers.get("content-type", "")
                        if "text/html" in ct and 200 <= response.status_code < 300:
                            try:
                                content_str = content.decode("utf-8", errors="replace")
                                prefix = f"/api/{service_id}"
                                content_str = re.sub(r'(src|href)="/(?!/)', r'\1="' + prefix + r'/', content_str)
                                content = content_str.encode("utf-8")
                                content_modified = True
                            except Exception as e:
                                logger.warning(f"HTML 경로 교체 실패 {service_id}: {e}")
                    if response.status_code >= 500:
                        logger.warning(f"프록시 upstream {response.status_code}: {service_id} <- {try_url}")
                    if response.status_code == 404:
                        logger.warning(f"프록시 upstream 404: {service_id} <- {try_url} (path_part={path_part!r}, backend_path={backend_path!r})")
                    return Response(
                        content=content,
                        status_code=response.status_code,
                        headers=response_headers,
                        media_type=response.headers.get("content-type")
                    )
            except httpx.ConnectError as e:
                last_err = e
                if try_url != urls_to_try[-1]:
                    logger.debug(f"프록시 {service_id} {try_url} 연결 실패, 다음 시도: {e}")
                else:
                    logger.error(f"프록시 연결 실패 (ConnectError): {service_id} - {try_url} - {e}")
                    raise HTTPException(status_code=503, detail=f"서비스 '{service_id}'에 연결할 수 없습니다")
            except httpx.TimeoutException:
                logger.error(f"프록시 타임아웃: {service_id} - {try_url}")
                raise HTTPException(status_code=504, detail="게이트웨이 타임아웃")
            except Exception as e:
                last_err = e
                if try_url != urls_to_try[-1]:
                    logger.debug(f"프록시 {service_id} {try_url} 오류: {e}")
                else:
                    raise
