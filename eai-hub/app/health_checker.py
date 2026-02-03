"""서비스 헬스체크"""
import asyncio
import time
import logging
from datetime import datetime
from typing import Dict, Optional
from urllib.parse import urlparse
import httpx
from app.models import ServiceStatus, ServiceInfo
from app.service_registry import ServiceRegistry
from app.config import settings

logger = logging.getLogger(__name__)


class HealthChecker:
    """서비스 헬스체크 관리"""
    
    def __init__(self, registry: ServiceRegistry):
        self.registry = registry
        self._status_cache: Dict[str, ServiceStatus] = {}
        self._running = False
        self._task: Optional[asyncio.Task] = None
    
    async def check_service(self, service_id: str) -> ServiceStatus:
        """특정 서비스 헬스체크"""
        service = self.registry.get_service(service_id)
        if not service:
            raise ValueError(f"서비스 '{service_id}'를 찾을 수 없습니다")
        
        if not service.enabled:
            return ServiceStatus(
                service_id=service_id,
                is_healthy=False,
                last_check=datetime.now(),
                error_message="서비스가 비활성화되어 있습니다"
            )
        
        # 데스크톱 앱 또는 base_url 없음: 헬스체크 불가 → 비정상
        if service.type.value == "desktop" or not service.base_url:
            return ServiceStatus(
                service_id=service_id,
                is_healthy=False,
                last_check=datetime.now(),
                error_message="헬스체크 불가"
            )
        
        start_time = time.time()
        try:
            health_url = service.get_health_url()
            if not health_url:
                return ServiceStatus(
                        service_id=service_id,
                        is_healthy=False,
                        last_check=datetime.now(),
                        error_message="헬스체크 불가"
                    )
            # 우리 서버와 같은 주소면 헬스체크 불가 (로그인 페이지 200으로 잘못된 정상 판정 방지)
            try:
                p = urlparse(health_url)
                port = p.port or (443 if p.scheme == "https" else 80)
                if p.hostname in ("localhost", "127.0.0.1") and port == settings.PORT:
                    return ServiceStatus(
                        service_id=service_id,
                        is_healthy=False,
                        last_check=datetime.now(),
                        error_message="헬스체크 불가 (EAI Hub와 포트 충돌)"
                    )
            except Exception:
                pass
            async with httpx.AsyncClient(timeout=settings.HEALTH_CHECK_TIMEOUT) as client:
                response = await client.get(health_url, follow_redirects=True)
                response_time = (time.time() - start_time) * 1000
                # 리다이렉트 따라간 최종 응답이 2xx면 정상 (Vite 등)
                is_healthy = 200 <= response.status_code < 300
                logger.info(f"헬스체크 {service_id}: {health_url} -> {response.status_code} ({'정상' if is_healthy else '비정상'})")
                
                status = ServiceStatus(
                    service_id=service_id,
                    is_healthy=is_healthy,
                    status_code=response.status_code,
                    response_time_ms=round(response_time, 2),
                    last_check=datetime.now(),
                    error_message=None if is_healthy else f"HTTP {response.status_code}"
                )
                
                self._status_cache[service_id] = status
                return status
                
        except httpx.TimeoutException:
            response_time = (time.time() - start_time) * 1000
            status = ServiceStatus(
                service_id=service_id,
                is_healthy=False,
                response_time_ms=round(response_time, 2),
                last_check=datetime.now(),
                error_message="타임아웃"
            )
            self._status_cache[service_id] = status
            return status
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            err_msg = str(e)
            # 연결 실패 등 영문 에러 → 한글 메시지로 변환
            if ("connection" in err_msg.lower() or "connect" in err_msg.lower() or
                    "refused" in err_msg.lower() or "all connection attempts failed" in err_msg.lower()):
                err_msg = "서비스가 꺼져 있어 접속할 수 없습니다"
            status = ServiceStatus(
                service_id=service_id,
                is_healthy=False,
                response_time_ms=round(response_time, 2),
                last_check=datetime.now(),
                error_message=err_msg
            )
            self._status_cache[service_id] = status
            logger.warning(f"서비스 '{service_id}' 헬스체크 실패: {e}")
            return status
    
    async def check_all_services(self) -> Dict[str, ServiceStatus]:
        """모든 서비스 헬스체크"""
        services = self.registry.get_enabled_services()
        tasks = [self.check_service(service.id) for service in services]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        status_dict = {}
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                service_id = services[i].id
                err_msg = str(result)
                if ("connection" in err_msg.lower() or "connect" in err_msg.lower() or
                        "refused" in err_msg.lower() or "all connection attempts failed" in err_msg.lower()):
                    err_msg = "서비스가 꺼져 있어 접속할 수 없습니다"
                status_dict[service_id] = ServiceStatus(
                    service_id=service_id,
                    is_healthy=False,
                    last_check=datetime.now(),
                    error_message=err_msg
                )
            else:
                status_dict[result.service_id] = result
        
        return status_dict
    
    async def _periodic_check(self):
        """주기적 헬스체크"""
        while self._running:
            try:
                await self.check_all_services()
            except Exception as e:
                logger.error(f"주기적 헬스체크 오류: {e}")
            
            await asyncio.sleep(settings.HEALTH_CHECK_INTERVAL)
    
    def start_periodic_check(self) -> asyncio.Task:
        """주기적 헬스체크 시작"""
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._periodic_check())
            logger.info("주기적 헬스체크 시작")
        return self._task
    
    def stop(self):
        """주기적 헬스체크 중지"""
        self._running = False
        if self._task:
            self._task.cancel()
            logger.info("주기적 헬스체크 중지")
    
    def get_cached_status(self, service_id: str) -> Optional[ServiceStatus]:
        """캐시된 상태 조회"""
        return self._status_cache.get(service_id)
