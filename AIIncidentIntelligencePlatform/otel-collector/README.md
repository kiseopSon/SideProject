# OpenTelemetry Collector

애플리케이션에서 발생하는 로그, 에러, 메트릭을 수집하여 Kafka로 전송합니다.

## 실행

```bash
docker build -t otel-collector .
docker run -p 4317:4317 -p 4318:4318 -v $(pwd)/otel-collector-config.yml:/etc/otelcol/config.yaml otel-collector
```

또는 docker-compose에 추가하여 실행할 수 있습니다.
