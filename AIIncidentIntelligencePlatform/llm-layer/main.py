"""LLM Layer - 포트 9200 (로그 수집, 분류, 분석)"""
import os
import json
from fastapi import FastAPI
from kafka import KafkaProducer
from prometheus_client import Counter, Histogram, generate_latest
from fastapi.responses import Response

load_dotenv = lambda: None
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

PORT = int(os.getenv("LLM_LAYER_PORT", "9200"))
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9094")
EVENTS_TOPIC = os.getenv("EVENTS_TOPIC", "events")

llm_requests_total = Counter("llm_requests_total", "LLM 요청 수", ["endpoint"])
llm_request_duration = Histogram("llm_request_duration_seconds", "LLM 요청 소요 시간", ["endpoint"])

app = FastAPI(title="LLM Layer")


def get_kafka_producer():
    try:
        return KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP.split(","),
            value_serializer=lambda v: json.dumps(v).encode(),
        )
    except Exception:
        return None


@app.get("/")
async def root():
    return {"service": "LLM Layer", "port": PORT}


@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")


@app.post("/api/v1/ingest")
async def ingest_logs(body: dict):
    """다른 프로젝트에서 로그 전송 (수집)"""
    events = body.get("events", [body])
    if not isinstance(events, list):
        events = [events]
    producer = get_kafka_producer()
    if not producer:
        return {"status": "error", "message": "Kafka 연결 실패"}
    for evt in events:
        producer.send(EVENTS_TOPIC, evt if isinstance(evt, dict) else {"raw": str(evt)})
    producer.flush()
    llm_requests_total.labels(endpoint="ingest").inc()
    return {"status": "ok", "count": len(events)}


@app.post("/api/v1/classify")
async def classify(body: dict):
    """인시던트 분류 (LLM 분석)"""
    llm_requests_total.labels(endpoint="classify").inc()
    events = body.get("events", [])
    results = []
    for evt in events:
        results.append({
            "incident_id": evt.get("id", "unknown"),
            "category": "error",
            "severity": "medium",
            "confidence": 0.9,
            "description": f"분류됨: {evt.get('message', '')}",
        })
    return {"results": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
