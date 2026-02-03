"""
Event Processor - CQRS Write/Read
Kafka에서 이벤트를 읽어 Elasticsearch와 Redis에 저장
"""
import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, Any
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

from confluent_kafka import Consumer, Producer
from confluent_kafka.admin import AdminClient, NewTopic
from confluent_kafka import KafkaException
from elasticsearch import Elasticsearch
import redis.asyncio as redis
from prometheus_client import Counter, Histogram, start_http_server

# Prometheus 메트릭 정의
events_processed_total = Counter(
    'events_processed_total',
    'Total number of events processed',
    ['status']
)

event_processing_duration = Histogram(
    'event_processing_duration_seconds',
    'Time taken to process events',
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 환경 변수
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'incidents')
ELASTICSEARCH_HOST = os.getenv('ELASTICSEARCH_HOST', 'localhost:9200')
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
METRICS_PORT = int(os.getenv('EVENT_PROCESSOR_METRICS_PORT', 9091))


class EventProcessor:
    def __init__(self):
        self.kafka_consumer = None
        self.kafka_producer = None
        self.es_client = None
        self.redis_client = None
        
    async def initialize(self):
        """서비스 초기화"""
        # 토픽이 없으면 생성
        self.ensure_topic_exists(KAFKA_TOPIC)
        
        # Kafka Consumer 설정
        consumer_config = {
            'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
            'group.id': 'event-processor-group',
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True
        }
        self.kafka_consumer = Consumer(consumer_config)
        self.kafka_consumer.subscribe([KAFKA_TOPIC])
        
        # Kafka Producer 설정 (이벤트 재발행용)
        producer_config = {
            'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS
        }
        self.kafka_producer = Producer(producer_config)
        
        # Elasticsearch 연결
        self.es_client = Elasticsearch([f'http://{ELASTICSEARCH_HOST}'])
        
        # Redis 연결
        self.redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True
        )
        
        # 인덱스 생성
        await self.create_elasticsearch_index()
        
        logger.info("Event Processor 초기화 완료")
    
    def ensure_topic_exists(self, topic_name: str):
        """토픽이 존재하는지 확인하고 없으면 생성"""
        try:
            admin_client = AdminClient({
                'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS
            })
            
            # 기존 토픽 목록 조회
            metadata = admin_client.list_topics(timeout=10)
            if topic_name in metadata.topics:
                logger.debug(f"토픽 '{topic_name}'이 이미 존재합니다.")
                return
            
            # 토픽 생성
            logger.info(f"토픽 '{topic_name}' 생성 중...")
            topic = NewTopic(topic_name, num_partitions=3, replication_factor=1)
            futures = admin_client.create_topics([topic])
            
            # 결과 대기
            for topic_name, future in futures.items():
                try:
                    future.result()
                    logger.info(f"토픽 '{topic_name}' 생성 완료")
                except KafkaException as e:
                    if 'already exists' in str(e) or 'TopicExistsException' in str(e):
                        logger.info(f"토픽 '{topic_name}'이 이미 존재합니다.")
                    else:
                        logger.warning(f"토픽 '{topic_name}' 생성 실패: {e}")
        except Exception as e:
            logger.warning(f"토픽 확인/생성 중 오류 (계속 진행): {e}")
    
    async def create_elasticsearch_index(self):
        """Elasticsearch 인덱스 생성"""
        index_name = 'incidents'
        if not self.es_client.indices.exists(index=index_name):
            mapping = {
                "mappings": {
                    "properties": {
                        "timestamp": {"type": "date"},
                        "service": {"type": "keyword"},
                        "level": {"type": "keyword"},
                        "message": {"type": "text"},
                        "error": {"type": "object"},
                        "metrics": {"type": "object"},
                        "event_type": {"type": "keyword"},
                        "severity": {"type": "keyword"}
                    }
                }
            }
            self.es_client.indices.create(index=index_name, body=mapping)
            logger.info(f"Elasticsearch 인덱스 생성: {index_name}")
    
    async def process_event(self, event: Dict[str, Any]):
        """이벤트 처리"""
        try:
            event_id = event.get('id') or event.get('trace_id') or str(datetime.now().timestamp())
            timestamp = event.get('timestamp', datetime.now().isoformat())
            
            # CQRS Write: Elasticsearch에 저장 (영구 저장)
            await self.write_to_elasticsearch(event, event_id, timestamp)
            
            # CQRS Read: Redis에 저장 (실시간 상태)
            await self.write_to_redis(event, event_id, timestamp)
            
            logger.info(f"이벤트 처리 완료: {event_id}")
            
        except Exception as e:
            logger.error(f"이벤트 처리 실패: {e}", exc_info=True)
    
    async def write_to_elasticsearch(self, event: Dict[str, Any], event_id: str, timestamp: str):
        """Elasticsearch에 이벤트 저장 (검색/분석용)"""
        try:
            doc = {
                **event,
                'id': event_id,
                'timestamp': timestamp,
                'indexed_at': datetime.now().isoformat()
            }
            
            self.es_client.index(
                index='incidents',
                id=event_id,
                document=doc
            )
            logger.debug(f"Elasticsearch 저장 완료: {event_id}")
            
        except Exception as e:
            logger.error(f"Elasticsearch 저장 실패: {e}", exc_info=True)
    
    async def write_to_redis(self, event: Dict[str, Any], event_id: str, timestamp: str):
        """Redis에 이벤트 저장 (실시간 상태용)"""
        try:
            # 최근 이벤트 목록 (최대 1000개)
            await self.redis_client.lpush('incidents:recent', json.dumps(event))
            await self.redis_client.ltrim('incidents:recent', 0, 999)
            
            # 이벤트별 상세 정보 (TTL: 24시간)
            await self.redis_client.setex(
                f'incident:{event_id}',
                86400,  # 24시간
                json.dumps(event)
            )
            
            # 서비스별 이벤트 카운트
            service = event.get('service', 'unknown')
            await self.redis_client.incr(f'service:{service}:count')
            await self.redis_client.expire(f'service:{service}:count', 86400)
            
            logger.debug(f"Redis 저장 완료: {event_id}")
            
        except Exception as e:
            logger.error(f"Redis 저장 실패: {e}", exc_info=True)
    
    async def run(self):
        """메인 루프"""
        await self.initialize()
        
        logger.info("Event Processor 시작")
        logger.info(f"토픽 '{KAFKA_TOPIC}'에서 이벤트 대기 중...")
        logger.info("(Ctrl+C로 종료)")
        
        event_count = 0
        last_heartbeat = asyncio.get_event_loop().time()
        
        try:
            while True:
                msg = self.kafka_consumer.poll(timeout=1.0)
                
                if msg is None:
                    # 30초마다 헬스비트 로그 출력
                    current_time = asyncio.get_event_loop().time()
                    if current_time - last_heartbeat > 30:
                        logger.debug(f"대기 중... (처리된 이벤트: {event_count}개)")
                        last_heartbeat = current_time
                    continue
                    
                if msg.error():
                    logger.error(f"Kafka 오류: {msg.error()}")
                    continue
                
                try:
                    event = json.loads(msg.value().decode('utf-8'))
                    event_count += 1
                    logger.info(f"[{event_count}] 이벤트 수신: {event.get('id', 'unknown')}")
                    
                    # 메트릭 기록
                    with event_processing_duration.time():
                        await self.process_event(event)
                    events_processed_total.labels(status='success').inc()
                    
                except json.JSONDecodeError as e:
                    logger.error(f"JSON 디코딩 실패: {e}")
                    events_processed_total.labels(status='error').inc()
                except Exception as e:
                    logger.error(f"이벤트 처리 중 오류: {e}", exc_info=True)
                    events_processed_total.labels(status='error').inc()
                    
        except KeyboardInterrupt:
            logger.info("Event Processor 종료 중...")
        finally:
            await self.cleanup()
            logger.info(f"Event Processor 종료 완료 (총 처리된 이벤트: {event_count}개)")
    
    async def cleanup(self):
        """리소스 정리"""
        if self.kafka_consumer:
            self.kafka_consumer.close()
        if self.redis_client:
            await self.redis_client.close()
        logger.info("리소스 정리 완료")


async def main():
    # Prometheus 메트릭 서버 시작
    logger.info(f"Prometheus 메트릭 서버 시작: http://localhost:{METRICS_PORT}/metrics")
    start_http_server(METRICS_PORT)
    
    processor = EventProcessor()
    await processor.run()


if __name__ == '__main__':
    asyncio.run(main())
