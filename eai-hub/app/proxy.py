"""프록시 라우터"""
import logging
import re
from typing import Optional
from fastapi import Request, HTTPException
from fastapi.responses import Response, StreamingResponse
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
        
        # proxy_base_path: Vite base 사용 서비스(ball-bounce 등)만 전체 경로 전달, 나머지는 루트 기준
        meta = service.metadata or {}
        use_base_path = meta.get("proxy_base_path", False)
        path_part = path.lstrip("/") if path else ""
        if use_base_path:
            base_path = f"api/{service_id}/"
            target_url = f"{service.base_url.rstrip('/')}/{base_path}{path_part}"
        else:
            target_url = f"{service.base_url.rstrip('/')}/{path_part}" if path_part else f"{service.base_url.rstrip('/')}/"
        
        # 쿼리 파라미터 추가
        if request.url.query:
            target_url += f"?{request.url.query}"
        
        # 요청 헤더 준비
        headers = dict(request.headers)
        headers.pop("host", None)
        headers.pop("content-length", None)
        headers.pop("origin", None)
        # Referer를 백엔드 origin으로 설정 - Metro가 요청 경로를 올바르게 해석하도록
        headers["referer"] = f"{service.base_url.rstrip('/')}/"
        
        # 요청 본문 읽기
        body = await request.body()
        
        try:
            # 리다이렉트는 서버에서 따라가서 최종 응답만 클라이언트에 전달 (302 노출 방지)
            async with httpx.AsyncClient(
                timeout=settings.PROXY_TIMEOUT,
                follow_redirects=True
            ) as client:
                response = await client.request(
                    method=request.method,
                    url=target_url,
                    headers=headers,
                    content=body if body else None
                )
                
                response_headers = dict(response.headers)
                response_headers.pop("access-control-allow-origin", None)
                response_headers.pop("access-control-allow-credentials", None)
                response_headers.pop("access-control-allow-methods", None)
                response_headers.pop("access-control-allow-headers", None)
                
                content = response.content or b""
                content_modified = False
                # proxy_base_path 미사용 서비스: HTML 절대 경로를 프록시 경로로 교체
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
                if content_modified:
                    response_headers.pop("content-length", None)
                    response_headers["content-length"] = str(len(content))
                
                return StreamingResponse(
                    iter([content]),
                    status_code=response.status_code,
                    headers=response_headers,
                    media_type=response.headers.get("content-type")
                )
                
        except httpx.TimeoutException:
            logger.error(f"프록시 타임아웃: {service_id} - {target_url}")
            raise HTTPException(status_code=504, detail="게이트웨이 타임아웃")
        
        except httpx.ConnectError:
            logger.error(f"프록시 연결 실패: {service_id} - {target_url}")
            raise HTTPException(status_code=503, detail=f"서비스 '{service_id}'에 연결할 수 없습니다")
        
        except Exception as e:
            logger.error(f"프록시 오류: {service_id} - {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"프록시 오류: {str(e)}")
