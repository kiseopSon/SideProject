# Prometheus 메트릭 확인 스크립트
Write-Host "=== Prometheus 메트릭 확인 ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Metrics Exporter 확인:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9093/metrics" -UseBasicParsing
    $metrics = $response.Content | Select-String -Pattern "incidents_(active|by_severity)" | Select-Object -First 5
    if ($metrics) {
        Write-Host "   ✓ Metrics Exporter 실행 중" -ForegroundColor Green
        $metrics | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "   ✗ incidents 메트릭을 찾을 수 없습니다" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Metrics Exporter에 연결할 수 없습니다 (포트 9093)" -ForegroundColor Red
    Write-Host "   → metrics-exporter를 실행하세요" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Prometheus Targets 확인:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/targets" -UseBasicParsing
    $targets = ($response.Content | ConvertFrom-Json).data.activeTargets
    
    $metricsExporter = $targets | Where-Object { $_.labels.job -eq "metrics-exporter" }
    if ($metricsExporter) {
        $health = $metricsExporter.health
        $lastError = $metricsExporter.lastError
        if ($health -eq "up") {
            Write-Host "   ✓ metrics-exporter: UP" -ForegroundColor Green
        } else {
            Write-Host "   ✗ metrics-exporter: $health" -ForegroundColor Red
            if ($lastError) {
                Write-Host "   오류: $lastError" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "   ✗ metrics-exporter target을 찾을 수 없습니다" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Prometheus에 연결할 수 없습니다" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Prometheus 쿼리 테스트:" -ForegroundColor Yellow
try {
    $query = "incidents_active"
    $response = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/query?query=$query" -UseBasicParsing
    $result = ($response.Content | ConvertFrom-Json).data.result
    
    if ($result.Count -gt 0) {
        Write-Host "   ✓ 쿼리 성공: $query" -ForegroundColor Green
        $result | ForEach-Object {
            $value = $_.value[1]
            Write-Host "   값: $value" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ✗ 쿼리 결과가 비어있습니다" -ForegroundColor Red
        Write-Host "   → Prometheus가 메트릭을 수집하지 못하고 있습니다" -ForegroundColor Yellow
        Write-Host "   → Prometheus Targets를 확인하세요" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ 쿼리 실패: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Redis 데이터 확인:" -ForegroundColor Yellow
try {
    $count = docker exec aiincidentintelligenceplatform-redis-1 redis-cli LLEN incidents:recent
    Write-Host "   Redis 인시던트 수: $count" -ForegroundColor $(if ($count -gt 0) { "Green" } else { "Yellow" })
    if ($count -eq 0) {
        Write-Host "   → 테스트 리포트를 전송하세요: python scripts/test-notification.py" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Redis에 연결할 수 없습니다" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== 확인 완료 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "해결 방법:" -ForegroundColor Yellow
Write-Host "1. Metrics Exporter 실행: cd metrics-exporter && python main.py" -ForegroundColor White
Write-Host "2. Prometheus 재시작: docker-compose restart prometheus" -ForegroundColor White
Write-Host "3. Prometheus Targets 확인: http://localhost:9090/status/targets" -ForegroundColor White
