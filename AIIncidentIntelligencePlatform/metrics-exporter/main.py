"""Metrics Exporter - Redis 인시던트를 Prometheus 메트릭으로 노출"""
import os
import redis
from prometheus_client import Gauge, start_http_server

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6380")
METRICS_PORT = int(os.getenv("METRICS_PORT", "9093"))

incidents_active = Gauge("incidents_active", "활성 인시던트 수")
start_http_server(METRICS_PORT)


def run():
    r = redis.from_url(REDIS_URL)
    while True:
        try:
            keys = r.keys("incident:*")
            count = sum(1 for k in keys if r.hget(k, "status") == b"active")
            incidents_active.set(count)
        except Exception:
            incidents_active.set(0)
        import time
        time.sleep(15)


if __name__ == "__main__":
    run()
