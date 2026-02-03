"""데이터 모델"""
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ServiceType(str, Enum):
    """서비스 타입"""
    API = "api"
    WEB = "web"
    MOBILE = "mobile"
    DESKTOP = "desktop"
    MICROSERVICE = "microservice"


class ServiceInfo(BaseModel):
    """서비스 정보"""
    id: str
    name: str
    description: Optional[str] = None
    type: ServiceType
    base_url: Optional[str] = None
    health_check_url: Optional[str] = None
    api_prefix: Optional[str] = None
    enabled: bool = True
    metadata: Dict[str, Any] = {}
    
    def get_health_url(self) -> Optional[str]:
        """헬스체크 URL 반환"""
        if self.health_check_url:
            return self.health_check_url
        if not self.base_url:
            return None
        # 기본 헬스체크 경로 시도
        common_paths = ["/health", "/api/health", "/healthz", "/"]
        return f"{self.base_url}{common_paths[0]}"


class ServiceStatus(BaseModel):
    """서비스 상태"""
    service_id: str
    is_healthy: bool
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    last_check: datetime
    error_message: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """헬스체크 응답"""
    service_id: str
    is_healthy: bool
    status_code: Optional[int] = None
    response_time_ms: Optional[float] = None
    last_check: datetime
    error_message: Optional[str] = None
    details: Dict[str, Any] = {}
