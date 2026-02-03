"""
Metrics Exporter
Redis의 인시던트 데이터를 Prometheus 메트릭으로 export
"""
import os
import json
import time
import logging
from typing import Dict
from dotenv import load_dotenv

load_dotenv()

import redis.asyncio as redis
from prometheus_client import Counter, Gauge, Histogram, start_http_server
from prometheus_client.core import CollectorRegistry, REGISTRY

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 환경 변수
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
EXPORTER_PORT = int(os.getenv('METRICS_EXPORTER_PORT', 9093))

# Prometheus 메트릭 정의
incident_total = Counter(
    'incidents_total',
    'Total number of incidents',
    ['severity']
)

incident_active = Gauge(
    'incidents_active',
    'Number of active incidents'
)

incident_by_severity = Gauge(
    'incidents_by_severity',
    'Number of incidents by severity',
    ['severity']
)

incident_processing_duration = Histogram(
    'incident_processing_duration_seconds',
    'Time taken to process incidents',
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

# Redis 클라이언트
redis_client: redis.Redis = None


async def get_redis_client():
    """Redis 클라이언트 가져오기"""
    global redis_client
    if redis_client is None:
        redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True
        )
    return redis_client


async def export_metrics():
    """Redis에서 인시던트 데이터를 읽어 Prometheus 메트릭으로 export"""
    try:
        client = await get_redis_client()
        
        # 최근 인시던트 목록 조회
        recent_incidents = await client.lrange('incidents:recent', 0, -1)
        
        # 심각도별 카운트
        severity_counts: Dict[str, int] = {
            'critical': 0,
            'high': 0,
            'medium': 0,
            'low': 0
        }
        
        # 인시던트 파싱 및 카운트
        for incident_json in recent_incidents:
            try:
                incident = json.loads(incident_json)
                severity = (incident.get('severity', 'medium') or 'medium').lower()
                if severity in severity_counts:
                    severity_counts[severity] += 1
            except Exception as e:
                logger.debug(f"인시던트 파싱 실패: {e}")
                continue
        
        # 메트릭 업데이트
        total_incidents = len(recent_incidents)
        incident_active.set(total_incidents)
        
        # 심각도별 메트릭 업데이트
        for severity, count in severity_counts.items():
            incident_by_severity.labels(severity=severity).set(count)
        
        logger.debug(f"메트릭 업데이트: 총 {total_incidents}개 인시던트")
        
    except Exception as e:
        logger.error(f"메트릭 export 실패: {e}", exc_info=True)


async def run_exporter():
    """메트릭 exporter 실행"""
    logger.info(f"Metrics Exporter 시작 (포트: {EXPORTER_PORT})")
    logger.info(f"Redis 연결: {REDIS_HOST}:{REDIS_PORT}")
    
    # Prometheus HTTP 서버 시작
    start_http_server(EXPORTER_PORT)
    logger.info(f"Prometheus 메트릭 서버 시작: http://localhost:{EXPORTER_PORT}/metrics")
    
    # 주기적으로 메트릭 업데이트 (15초마다)
    while True:
        try:
            await export_metrics()
        except Exception as e:
            logger.error(f"메트릭 업데이트 오류: {e}")
        
        await asyncio.sleep(15)


if __name__ == '__main__':
    import asyncio
    try:
        asyncio.run(run_exporter())
    except KeyboardInterrupt:
        logger.info("Metrics Exporter 종료")
        if redis_client:
            asyncio.run(redis_client.close())
