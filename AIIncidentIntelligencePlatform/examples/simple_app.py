"""
간단한 애플리케이션 예제
SDK를 사용하여 인시던트 이벤트를 전송하는 예제
"""
import time
import random
from sdk import IncidentClient

# 클라이언트 초기화
client = IncidentClient(
    service_name="example-service",
    otlp_endpoint="http://localhost:4318/v1/traces"
)

def main():
    """예제 메인 함수"""
    print("인시던트 이벤트 전송 시작...")
    
    # 정상 로그
    client.log_event(
        level="INFO",
        message="서비스 시작됨",
        context={"version": "1.0.0"}
    )
    
    time.sleep(1)
    
    # 메트릭 전송
    for i in range(5):
        cpu_usage = random.uniform(20.0, 80.0)
        client.log_metric("cpu.usage", cpu_usage, tags={"instance": "server-1"})
        time.sleep(0.5)
    
    # 에러 시뮬레이션
    try:
        raise ValueError("데이터베이스 연결 실패")
    except Exception as e:
        client.log_error(
            message="데이터베이스 연결 중 오류 발생",
            error=e,
            context={"database": "postgres", "host": "db.example.com"}
        )
    
    # 경고 로그
    client.log_event(
        level="WARN",
        message="응답 시간이 임계값을 초과했습니다",
        metrics={"response_time_ms": 3500},
        context={"endpoint": "/api/users"}
    )
    
    print("인시던트 이벤트 전송 완료")

if __name__ == "__main__":
    main()
