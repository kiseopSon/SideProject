"""EAI Hub 설정"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """애플리케이션 설정"""
    # 서버 설정
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # 서비스 레지스트리 파일 경로
    SERVICES_CONFIG_PATH: str = "services.json"
    
    # 헬스체크 설정
    HEALTH_CHECK_INTERVAL: int = 30  # 초
    HEALTH_CHECK_TIMEOUT: int = 5  # 초
    
    # 프록시 설정
    PROXY_TIMEOUT: int = 30  # 초
    PROXY_FOLLOW_REDIRECTS: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
