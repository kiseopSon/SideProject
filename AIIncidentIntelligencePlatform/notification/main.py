"""Notification Service - 인시던트 결과를 eai-hub에 전달"""
import os
import json
from kafka import KafkaConsumer
import httpx

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9094")
EAI_HUB_URL = os.getenv("EAI_HUB_URL", "")
REPORTS_TOPIC = os.getenv("REPORTS_TOPIC", "incident-reports")

print(f"[Notification] EAI_HUB_URL={EAI_HUB_URL or '(미설정)'}")


def forward_to_eai_hub(payload: dict) -> bool:
    """eai-hub에 인시던트 결과 전달"""
    if not EAI_HUB_URL:
        return False
    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.post(EAI_HUB_URL, json=payload)
            return r.status_code in (200, 201, 204)
    except Exception as e:
        print(f"[Notification] eai-hub 전달 실패: {e}")
        return False


def run_consumer():
    try:
        consumer = KafkaConsumer(
            REPORTS_TOPIC,
            bootstrap_servers=KAFKA_BOOTSTRAP.split(","),
            auto_offset_reset="latest",
            value_deserializer=lambda v: json.loads(v.decode()) if v else {},
        )
    except Exception as e:
        print(f"[Notification] Kafka 연결 실패: {e}")
        print(f"  KAFKA_BOOTSTRAP_SERVERS={KAFKA_BOOTSTRAP}")
        return
    print(f"[Notification] incident-reports 구독 중, EAI_HUB_URL={EAI_HUB_URL or '(미설정)'}")
    for msg in consumer:
        payload = msg.value
        if payload and EAI_HUB_URL:
            ok = forward_to_eai_hub(payload)
            print(f"[Notification] eai-hub 전달 {'성공' if ok else '실패'}: {payload.get('incident_id', '?')}")
        elif not EAI_HUB_URL:
            print(f"[Notification] 리포트 수신 (EAI_HUB_URL 미설정, 전달 생략): {payload}")


if __name__ == "__main__":
    run_consumer()
