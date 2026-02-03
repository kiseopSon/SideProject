"""
Notification Service
Slack, Email, Dashboard 알림 처리
"""
import os
import json
import logging
import asyncio
from typing import Dict, Any
from datetime import datetime
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

from confluent_kafka import Consumer
from confluent_kafka.admin import AdminClient, NewTopic
from confluent_kafka import KafkaException
import httpx
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 환경 변수
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_REPORT_TOPIC = os.getenv('KAFKA_REPORT_TOPIC', 'incident-reports')

# Slack 설정
SLACK_WEBHOOK_URL = os.getenv('SLACK_WEBHOOK_URL', '')

# Email 설정
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
EMAIL_FROM = os.getenv('EMAIL_FROM', '')
EMAIL_TO = os.getenv('EMAIL_TO', '').split(',')


class NotificationService:
    """알림 서비스 클래스"""
    
    async def send_slack_notification(self, report: Dict[str, Any]):
        """Slack 알림 전송"""
        if not SLACK_WEBHOOK_URL or SLACK_WEBHOOK_URL == 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL':
            logger.warning("Slack Webhook URL이 설정되지 않았습니다. .env 파일의 SLACK_WEBHOOK_URL을 확인하세요.")
            return
        
        incident_id = report.get('incident_id', 'unknown')
        severity = report.get('severity', 'medium')
        summary = report.get('summary', '')
        root_cause = report.get('root_cause', '')
        impact = report.get('impact', '')
        recommendations = report.get('recommendations', [])
        generated_at = report.get('generated_at', datetime.now().isoformat())
        
        # Slack 메시지 포맷
        color_map = {
            'critical': '#ff0000',
            'high': '#ff8800',
            'medium': '#ffaa00',
            'low': '#00aaff'
        }
        color = color_map.get(severity.lower(), '#808080')
        
        # 심각도 이모지
        severity_emoji = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🔵'
        }
        emoji = severity_emoji.get(severity.lower(), '⚪')
        
        # 추천 조치 사항 포맷팅
        recommendations_text = '\n'.join([f'• {rec}' for rec in recommendations[:5]])  # 최대 5개
        if len(recommendations) > 5:
            recommendations_text += f'\n... 외 {len(recommendations) - 5}개'
        
        payload = {
            "text": f"{emoji} 인시던트 리포트: {incident_id}",
            "attachments": [
                {
                    "color": color,
                    "title": f"인시던트 리포트: {incident_id}",
                    "fields": [
                        {
                            "title": "심각도",
                            "value": f"{emoji} *{severity.upper()}*",
                            "short": True
                        },
                        {
                            "title": "생성 시간",
                            "value": generated_at,
                            "short": True
                        },
                        {
                            "title": "요약",
                            "value": summary[:1000] if len(summary) <= 1000 else summary[:997] + "...",
                            "short": False
                        },
                        {
                            "title": "근본 원인",
                            "value": root_cause[:1000] if len(root_cause) <= 1000 else root_cause[:997] + "...",
                            "short": False
                        }
                    ],
                    "footer": "AI Incident Intelligence Platform",
                    "ts": int(datetime.now().timestamp())
                }
            ]
        }
        
        # 영향 정보 추가
        if impact:
            payload["attachments"][0]["fields"].append({
                "title": "영향",
                "value": impact[:1000] if len(impact) <= 1000 else impact[:997] + "...",
                "short": False
            })
        
        # 추천 조치 사항이 있으면 별도 attachment로 추가
        if recommendations:
            payload["attachments"].append({
                "color": "#36a64f",
                "title": "권장 조치 사항",
                "text": recommendations_text,
                "mrkdwn_in": ["text"]
            })
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    SLACK_WEBHOOK_URL,
                    json=payload,
                    timeout=10.0
                )
                response.raise_for_status()
                logger.info(f"Slack 알림 전송 완료: {incident_id}")
        except Exception as e:
            logger.error(f"Slack 알림 전송 실패: {e}", exc_info=True)
    
    async def send_email_notification(self, report: Dict[str, Any]):
        """Email 알림 전송"""
        # Email 설정이 완전하지 않으면 스킵
        if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM]) or not EMAIL_TO or EMAIL_TO == ['']:
            logger.debug("Email 설정이 완료되지 않아 Email 알림을 건너뜁니다.")
            return
        
        incident_id = report.get('incident_id', 'unknown')
        summary = report.get('summary', '')
        root_cause = report.get('root_cause', '')
        impact = report.get('impact', '')
        recommendations = report.get('recommendations', [])
        
        # HTML 이메일 생성
        html_content = f"""
        <html>
        <body>
            <h2>인시던트 리포트: {incident_id}</h2>
            <hr>
            <h3>요약</h3>
            <p>{summary}</p>
            
            <h3>근본 원인</h3>
            <p>{root_cause}</p>
            
            <h3>영향</h3>
            <p>{impact}</p>
            
            <h3>권장 조치 사항</h3>
            <ul>
                {''.join([f'<li>{rec}</li>' for rec in recommendations])}
            </ul>
            
            <hr>
            <p><small>생성 시간: {report.get('generated_at', '')}</small></p>
            <p><small>AI Incident Intelligence Platform</small></p>
        </body>
        </html>
        """
        
        text_content = f"""
인시던트 리포트: {incident_id}

요약:
{summary}

근본 원인:
{root_cause}

영향:
{impact}

권장 조치 사항:
{chr(10).join([f'- {rec}' for rec in recommendations])}

생성 시간: {report.get('generated_at', '')}
AI Incident Intelligence Platform
        """
        
        try:
            message = MIMEMultipart('alternative')
            message['From'] = EMAIL_FROM
            message['To'] = ', '.join(EMAIL_TO)
            message['Subject'] = f'[인시던트] {incident_id}'
            
            message.attach(MIMEText(text_content, 'plain'))
            message.attach(MIMEText(html_content, 'html'))
            
            # Gmail SMTP 설정
            # 포트 587: STARTTLS 사용 (use_tls=False, start_tls=True)
            # 포트 465: SSL/TLS 사용 (use_ssl=True)
            use_ssl = SMTP_PORT == 465
            start_tls = SMTP_PORT == 587
            
            await aiosmtplib.send(
                message,
                hostname=SMTP_HOST,
                port=SMTP_PORT,
                username=SMTP_USER,
                password=SMTP_PASSWORD,
                use_tls=False,  # STARTTLS를 사용할 경우 False
                start_tls=start_tls,  # 포트 587에서 STARTTLS 사용
                use_ssl=use_ssl  # 포트 465에서 SSL 사용
            )
            logger.info(f"Email 알림 전송 완료: {incident_id}")
            
        except Exception as e:
            # Email 오류는 경고로만 표시 (다른 알림은 계속 진행)
            error_type = type(e).__name__
            error_msg = str(e)
            logger.warning(f"Email 알림 전송 실패 (다른 알림은 정상 처리됨): {error_type}: {error_msg}")
            
            # SSL/TLS 관련 오류인 경우 추가 안내
            if 'SSL' in error_type or 'SSL' in error_msg or 'TLS' in error_msg or 'WRONG_VERSION' in error_msg:
                logger.warning("SSL/TLS 오류가 발생했습니다. SMTP 설정을 확인하세요:")
                logger.warning(f"  - SMTP_HOST: {SMTP_HOST}")
                logger.warning(f"  - SMTP_PORT: {SMTP_PORT} (587=STARTTLS, 465=SSL)")
                logger.warning(f"  - 포트 587 사용 시 STARTTLS가 자동으로 사용됩니다")
                logger.warning(f"  - 포트 465 사용 시 SSL이 자동으로 사용됩니다")
                logger.warning(f"  - Gmail 앱 비밀번호를 사용하고 있는지 확인하세요")
    
    async def update_dashboard(self, report: Dict[str, Any]):
        """Dashboard 업데이트 (Redis에 저장)"""
        try:
            import redis.asyncio as redis
            
            redis_host = os.getenv('REDIS_HOST', 'localhost')
            redis_port = int(os.getenv('REDIS_PORT', 6379))
            
            logger.debug(f"Redis 연결 시도: {redis_host}:{redis_port}")
            
            redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                decode_responses=True,
                socket_connect_timeout=5
            )
            
            # 연결 테스트
            await redis_client.ping()
            logger.debug(f"Redis 연결 성공: {redis_host}:{redis_port}")
            
            incident_id = report.get('incident_id', 'unknown')
            
            # 최근 인시던트 목록에 추가
            report_json = json.dumps(report, ensure_ascii=False)
            await redis_client.lpush('incidents:recent', report_json)
            await redis_client.ltrim('incidents:recent', 0, 999)  # 최대 1000개 유지
            logger.debug(f"인시던트 리스트에 추가: {incident_id}")
            
            # 인시던트 상세 정보 저장 (TTL: 24시간)
            await redis_client.setex(
                f'incident:{incident_id}',
                86400,  # 24시간
                report_json
            )
            logger.debug(f"인시던트 상세 정보 저장: {incident_id}")
            
            # 심각도별 카운트 업데이트
            severity = (report.get('severity', 'medium') or 'medium').lower()
            await redis_client.incr(f'severity:{severity}:count')
            await redis_client.expire(f'severity:{severity}:count', 86400)
            logger.debug(f"심각도 카운트 업데이트: {severity}")
            
            await redis_client.close()
            logger.info(f"Dashboard 업데이트 완료: {incident_id}")
        except redis.ConnectionError as e:
            logger.error(f"Dashboard 업데이트 실패 - Redis 연결 오류: {e}")
            logger.error(f"Redis 호스트: {os.getenv('REDIS_HOST', 'localhost')}, 포트: {os.getenv('REDIS_PORT', 6379)}")
        except Exception as e:
            logger.error(f"Dashboard 업데이트 실패: {type(e).__name__}: {e}", exc_info=True)
    
    async def process_report(self, report: Dict[str, Any]):
        """리포트 처리 및 알림 전송"""
        try:
            # 병렬로 모든 알림 전송
            await asyncio.gather(
                self.send_slack_notification(report),
                self.send_email_notification(report),
                self.update_dashboard(report),
                return_exceptions=True
            )
            logger.info(f"알림 처리 완료: {report.get('incident_id', 'unknown')}")
        except Exception as e:
            logger.error(f"알림 처리 실패: {e}", exc_info=True)


class NotificationConsumer:
    """Kafka Consumer for Notifications"""
    
    def __init__(self):
        self.consumer = None
        self.notification_service = NotificationService()
    
    def initialize(self):
        """Kafka Consumer 초기화"""
        # 토픽이 없으면 생성
        self.ensure_topic_exists(KAFKA_REPORT_TOPIC)
        
        config = {
            'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
            'group.id': 'notification-service-group',
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True
        }
        self.consumer = Consumer(config)
        self.consumer.subscribe([KAFKA_REPORT_TOPIC])
        logger.info("Notification Consumer 초기화 완료")
    
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
    
    async def run(self):
        """메인 루프"""
        self.initialize()
        logger.info("Notification Service 시작")
        logger.info(f"토픽 '{KAFKA_REPORT_TOPIC}'에서 메시지 대기 중...")
        logger.info("(Ctrl+C로 종료)")
        
        message_count = 0
        last_heartbeat = asyncio.get_event_loop().time()
        
        try:
            while True:
                msg = self.consumer.poll(timeout=1.0)
                
                if msg is None:
                    # 30초마다 헬스비트 로그 출력
                    current_time = asyncio.get_event_loop().time()
                    if current_time - last_heartbeat > 30:
                        logger.debug(f"대기 중... (처리된 메시지: {message_count}개)")
                        last_heartbeat = current_time
                    await asyncio.sleep(0.1)
                    continue
                
                if msg.error():
                    logger.error(f"Kafka 오류: {msg.error()}")
                    continue
                
                try:
                    raw_value = msg.value()
                    if raw_value is None:
                        logger.warning("메시지 값이 None입니다.")
                        continue
                    
                    report_json = raw_value.decode('utf-8')
                    logger.debug(f"수신한 메시지 (처음 200자): {report_json[:200]}...")
                    report = json.loads(report_json)
                    message_count += 1
                    incident_id = report.get('incident_id', 'unknown')
                    logger.info(f"[{message_count}] 리포트 수신: {incident_id}")
                    await self.notification_service.process_report(report)
                    logger.info(f"[{message_count}] 리포트 처리 완료: {incident_id}")
                except json.JSONDecodeError as e:
                    logger.error(f"JSON 디코딩 실패: {e}")
                except Exception as e:
                    logger.error(f"리포트 처리 중 오류: {e}", exc_info=True)
                    
        except KeyboardInterrupt:
            logger.info("Notification Service 종료 중...")
        finally:
            if self.consumer:
                self.consumer.close()
            logger.info(f"Notification Service 종료 완료 (총 처리된 메시지: {message_count}개)")


async def main():
    consumer = NotificationConsumer()
    await consumer.run()


if __name__ == '__main__':
    asyncio.run(main())
