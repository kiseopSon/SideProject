"""서비스 레지스트리"""
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from app.models import ServiceInfo, ServiceType
from app.config import settings

logger = logging.getLogger(__name__)


class ServiceRegistry:
    """서비스 레지스트리 관리"""
    
    def __init__(self):
        self._services: Dict[str, ServiceInfo] = {}
        self._config_path = Path(settings.SERVICES_CONFIG_PATH)
    
    async def load_services(self):
        """서비스 목록 로드 (포트 9000, 9001, 9002... 자동 할당)"""
        if self._config_path.exists():
            try:
                with open(self._config_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    port = 9000
                    for service_data in data.get('services', []):
                        if (service_data.get('type') != 'desktop' and
                                service_data.get('enabled', True)):
                            service_data = dict(service_data)
                            meta = service_data.get('metadata') or {}
                            # metadata.port 지정 시 해당 포트 사용, 없으면 자동 할당
                            assigned_port = meta.get('port') if meta.get('port') is not None else port
                            port = max(port, assigned_port + 1)  # 다음 서비스가 중복 포트 받지 않도록
                            base = f'http://localhost:{assigned_port}'
                            health_path = meta.get('health_path', '/')
                            service_data['base_url'] = base
                            service_data['health_check_url'] = f'{base.rstrip("/")}{health_path}'
                            if 'metadata' not in service_data:
                                service_data['metadata'] = {}
                            meta = dict(service_data['metadata'])
                            meta['ports'] = [assigned_port]
                            service_data['metadata'] = meta
                        service = ServiceInfo(**service_data)
                        self._services[service.id] = service
                port_info = f" (포트 9000~{port - 1} 자동 할당)" if port > 9000 else ""
                logger.info(f"{len(self._services)}개의 서비스 로드 완료{port_info}")
            except Exception as e:
                logger.error(f"서비스 로드 오류: {e}")
        else:
            logger.warning(f"설정 파일을 찾을 수 없습니다: {self._config_path}")
            # 기본 서비스 등록
            await self._register_default_services()
    
    async def _register_default_services(self):
        """기본 서비스 등록"""
        default_services = [
            {
                "id": "ai-incident",
                "name": "AI Incident Intelligence Platform",
                "description": "시스템 로그를 AI로 분석해 인시던트를 자동 탐지하고 대응하는 플랫폼",
                "type": "microservice",
                "api_prefix": "/api/ai-incident",
                "metadata": {
                    "tech": ["Python", "FastAPI", "Kafka", "Redis", "Elasticsearch", "Ollama", "OpenTelemetry"]
                }
            },
            {
                "id": "ball-bounce",
                "name": "Ball Bounce Game",
                "description": "물리 엔진을 활용한 볼이 튀어오르는 캐주얼 게임",
                "type": "web",
                "api_prefix": None,
                "metadata": {
                    "tech": ["React", "TypeScript", "Vite", "Canvas API", "Game Loop"]
                }
            },
            {
                "id": "coffee-gateway",
                "name": "Coffee Gateway Service",
                "description": "커피 관련 마이크로서비스들을 통합하는 API 게이트웨이",
                "type": "microservice",
                "api_prefix": "/api/coffee",
                "metadata": {
                    "tech": ["Java", "Spring Boot", "Spring Cloud Gateway", "Eureka", "Kafka", "H2", "Gradle"],
                    "health_path": "/actuator/health"
                }
            },
            {
                "id": "cosmetics",
                "name": "Cosmetics Ingredient Analyzer",
                "description": "화장품 성분을 분석해 안전성과 효능을 확인해주는 서비스",
                "type": "api",
                "api_prefix": "/api/cosmetics",
                "metadata": {
                    "tech": ["Python", "FastAPI", "React", "Vite", "TypeScript", "REST API", "CORS"],
                    "health_path": "/health"
                }
            },
            {
                "id": "deffender-game",
                "name": "Deffender Game",
                "description": "몬스터를 막아내는 3D 탑디펜스 게임",
                "type": "mobile",
                "api_prefix": None,
                "metadata": {
                    "tech": ["React Native", "Expo", "Three.js", "WebGL", "Zustand", "TypeScript"]
                }
            },
            {
                "id": "my-lover-is-clumsy",
                "name": "My Lover Is Clumsy",
                "description": "사랑하는 사람이 깜빡하는 걸 챙겨주기 위해 만들어진 크로스플랫폼 앱",
                "type": "mobile",
                "api_prefix": None,
                "metadata": {
                    "tech": ["React Native", "Expo", "Supabase", "PostgreSQL", "RLS", "Zustand", "React Query"]
                }
            },
            {
                "id": "regex-generator",
                "name": "Regex Generator",
                "description": "정규식을 쉽게 작성하고 테스트할 수 있는 데스크톱 도구",
                "type": "desktop",
                "base_url": None,
                "health_check_url": None,
                "api_prefix": None,
                "enabled": False,  # 데스크톱 앱은 API 없음
                "metadata": {
                    "tech": ["Python", "PyInstaller", "Tkinter", "정규식", "pyperclip"]
                }
            },
            {
                "id": "sosadworld-gateway",
                "name": "SoSadWorld Gateway Service",
                "description": "텍스트 감정을 AI로 분석하는 서비스들의 통합 게이트웨이",
                "type": "microservice",
                "api_prefix": "/api/sosadworld",
                "metadata": {
                    "tech": ["Java", "Spring Boot", "Spring Cloud Gateway", "Consul", "PostgreSQL", "Ollama", "OAuth2", "Keycloak"],
                    "health_path": "/actuator/health"
                }
            }
        ]
        
        port = 9000
        for service_data in default_services:
            if (service_data.get('type') != 'desktop' and
                    service_data.get('enabled', True)):
                service_data = dict(service_data)
                base = f'http://localhost:{port}'
                health_path = (service_data.get('metadata') or {}).get('health_path', '/')
                service_data['base_url'] = base
                service_data['health_check_url'] = f'{base.rstrip("/")}{health_path}'
                if 'metadata' not in service_data:
                    service_data['metadata'] = {}
                meta = dict(service_data['metadata'])
                meta['ports'] = [port]
                service_data['metadata'] = meta
                port += 1
            service = ServiceInfo(**service_data)
            self._services[service.id] = service
        
        port_info = f" (포트 9000~{port - 1} 자동 할당)" if port > 9000 else ""
        logger.info(f"{len(self._services)}개의 기본 서비스 등록 완료{port_info}")
    
    def get_service(self, service_id: str) -> Optional[ServiceInfo]:
        """서비스 조회"""
        return self._services.get(service_id)
    
    def get_all_services(self) -> List[ServiceInfo]:
        """모든 서비스 조회"""
        return list(self._services.values())
    
    def get_enabled_services(self) -> List[ServiceInfo]:
        """활성화된 서비스만 조회"""
        return [s for s in self._services.values() if s.enabled]
    
    def register_service(self, service: ServiceInfo):
        """서비스 등록"""
        self._services[service.id] = service
        logger.info(f"서비스 등록: {service.id} - {service.name}")
    
    def unregister_service(self, service_id: str):
        """서비스 제거"""
        if service_id in self._services:
            del self._services[service_id]
            logger.info(f"서비스 제거: {service_id}")
