"""
Kafka 토픽 생성 스크립트
필요한 모든 토픽을 자동으로 생성합니다.
"""
import os
import sys
from confluent_kafka.admin import AdminClient, NewTopic
from confluent_kafka import KafkaException

# 환경 변수 로드
from dotenv import load_dotenv
load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')

# 생성할 토픽 목록
TOPICS = [
    {
        'name': 'incidents',
        'num_partitions': 3,
        'replication_factor': 1
    },
    {
        'name': 'incident-reports',
        'num_partitions': 3,
        'replication_factor': 1
    }
]


def create_topics():
    """Kafka 토픽 생성"""
    admin_client = AdminClient({
        'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS
    })
    
    # 토픽 생성
    topic_list = []
    for topic_config in TOPICS:
        topic_list.append(NewTopic(
            topic_config['name'],
            num_partitions=topic_config['num_partitions'],
            replication_factor=topic_config['replication_factor']
        ))
    
    # 토픽 생성 요청
    futures = admin_client.create_topics(topic_list)
    
    # 결과 확인
    success_count = 0
    for topic, future in futures.items():
        try:
            future.result()  # 결과 대기
            print(f"✓ 토픽 생성 완료: {topic}")
            success_count += 1
        except KafkaException as e:
            if 'already exists' in str(e) or 'TopicExistsException' in str(e):
                print(f"ℹ 토픽이 이미 존재함: {topic}")
                success_count += 1
            else:
                print(f"✗ 토픽 생성 실패: {topic} - {e}")
    
    print(f"\n총 {success_count}/{len(TOPICS)} 토픽 처리 완료")
    return success_count == len(TOPICS)


if __name__ == '__main__':
    print("=== Kafka 토픽 생성 ===")
    print(f"Kafka 서버: {KAFKA_BOOTSTRAP_SERVERS}")
    print("")
    
    try:
        success = create_topics()
        if success:
            print("\n모든 토픽이 준비되었습니다!")
            sys.exit(0)
        else:
            print("\n일부 토픽 생성에 실패했습니다.")
            sys.exit(1)
    except Exception as e:
        print(f"\n오류 발생: {e}")
        print("Kafka 서버가 실행 중인지 확인하세요: docker-compose up -d")
        sys.exit(1)
