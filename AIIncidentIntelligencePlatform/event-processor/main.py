"""Event Processor - Kafka 이벤트 소비, LLM 분류 호출, Redis/ES 저장, 리포트 발행"""
import os
import json
import redis
from kafka import KafkaConsumer, KafkaProducer
import httpx
from prometheus_client import Counter, start_http_server

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9094")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6380")
LLM_URL = os.getenv("LLM_LAYER_URL", "http://localhost:9200")
EVENTS_TOPIC = os.getenv("EVENTS_TOPIC", "events")
REPORTS_TOPIC = os.getenv("REPORTS_TOPIC", "incident-reports")
METRICS_PORT = int(os.getenv("METRICS_PORT", "9091"))

events_processed_total = Counter("events_processed_total", "처리된 이벤트 수")
start_http_server(METRICS_PORT)


def run():
    consumer = KafkaConsumer(
        EVENTS_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP.split(","),
        auto_offset_reset="latest",
        value_deserializer=lambda v: json.loads(v.decode()) if v else {},
    )
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP.split(","),
        value_serializer=lambda v: json.dumps(v).encode(),
    )
    r = redis.from_url(REDIS_URL)

    for msg in consumer:
        evt = msg.value
        if not evt:
            continue
        try:
            resp = httpx.post(f"{LLM_URL}/api/v1/classify", json={"events": [evt]}, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                for rpt in data.get("results", []):
                    inc_id = rpt.get("incident_id", evt.get("id", "unknown"))
                    r.hset(f"incident:{inc_id}", mapping={"data": json.dumps(rpt), "status": "active"})
                    producer.send(REPORTS_TOPIC, rpt)
            events_processed_total.inc()
        except Exception as e:
            print(f"[EventProcessor] 오류: {e}")


if __name__ == "__main__":
    run()
