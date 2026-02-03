"""
Notification Service 테스트 스크립트
Kafka에 직접 테스트 리포트를 발행하여 Notification Service가 정상 작동하는지 확인
"""
import os
import json
import sys
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from confluent_kafka import Producer

KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_REPORT_TOPIC = os.getenv('KAFKA_REPORT_TOPIC', 'incident-reports')

def send_test_report():
    """테스트 리포트를 Kafka로 발행"""
    producer = Producer({'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS})
    
    test_report = {
        'incident_id': 'test-incident-001',
        'summary': '테스트 인시던트: 데이터베이스 연결 실패',
        'root_cause': '데이터베이스 서버가 응답하지 않음',
        'impact': '사용자 로그인 기능 일시 중단',
        'recommendations': [
            '데이터베이스 서버 상태 확인',
            '연결 풀 설정 확인',
            '네트워크 연결 확인'
        ],
        'severity': 'high',
        'generated_at': datetime.now().isoformat(),
        'timeline': [
            {'time': '2026-01-12T02:00:00', 'event': '데이터베이스 연결 시도'},
            {'time': '2026-01-12T02:00:05', 'event': '연결 타임아웃 발생'}
        ]
    }
    
    try:
        print(f"테스트 리포트 발행 중...")
        print(f"토픽: {KAFKA_REPORT_TOPIC}")
        print(f"인시던트 ID: {test_report['incident_id']}")
        
        producer.produce(
            KAFKA_REPORT_TOPIC,
            key=test_report['incident_id'],
            value=json.dumps(test_report, ensure_ascii=False)
        )
        producer.flush(timeout=10)
        
        print("✓ 테스트 리포트 발행 완료!")
        print("\nNotification Service 로그를 확인하세요:")
        print("  - 리포트 수신 로그")
        print("  - Slack 알림 전송 로그 (설정된 경우)")
        return True
        
    except Exception as e:
        print(f"✗ 리포트 발행 실패: {e}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == '__main__':
    print("=== Notification Service 테스트 ===")
    print(f"Kafka 서버: {KAFKA_BOOTSTRAP_SERVERS}")
    print("")
    
    success = send_test_report()
    sys.exit(0 if success else 1)
