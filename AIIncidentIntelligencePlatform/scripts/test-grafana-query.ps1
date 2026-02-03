# Grafana 쿼리 테스트 스크립트
Write-Host "=== Grafana 쿼리 테스트 ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Prometheus 직접 쿼리 테스트:" -ForegroundColor Yellow
$queries = @("incidents_active", "incidents_by_severity")

foreach ($query in $queries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/query?query=$query" -UseBasicParsing
        $result = ($response.Content | ConvertFrom-Json).data.result
        
        if ($result.Count -gt 0) {
            Write-Host "   ✓ $query : 성공" -ForegroundColor Green
            $result | ForEach-Object {
                $metricName = $_.metric.__name__
                $value = $_.value[1]
                $labels = ""
                if ($_.metric.severity) {
                    $labels = "severity=$($_.metric.severity)"
                }
                Write-Host "     → $metricName $labels = $value" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ✗ $query : 데이터 없음" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ✗ $query : 오류 - $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "2. Grafana에서 확인할 쿼리:" -ForegroundColor Yellow
Write-Host "   - incidents_active" -ForegroundColor White
Write-Host "   - incidents_by_severity" -ForegroundColor White
Write-Host "   - incidents_by_severity{severity=`"high`"}" -ForegroundColor White
Write-Host "   - incidents_by_severity{severity=`"critical`"}" -ForegroundColor White

Write-Host ""
Write-Host "3. Grafana Explore에서 테스트:" -ForegroundColor Yellow
Write-Host "   1. http://localhost:3000 접속" -ForegroundColor White
Write-Host "   2. 왼쪽 메뉴 → Explore 클릭" -ForegroundColor White
Write-Host "   3. 데이터 소스: Prometheus 선택" -ForegroundColor White
Write-Host "   4. 쿼리 입력: incidents_active" -ForegroundColor White
Write-Host "   5. Run query 클릭" -ForegroundColor White
Write-Host "   6. 데이터가 보이면 정상!" -ForegroundColor Green

Write-Host ""
Write-Host "4. 대시보드 패널 편집:" -ForegroundColor Yellow
Write-Host "   1. 대시보드에서 패널 제목 클릭 → Edit" -ForegroundColor White
Write-Host "   2. 왼쪽 하단 Query 탭 클릭" -ForegroundColor White
Write-Host "   3. 데이터 소스: Prometheus 확인" -ForegroundColor White
Write-Host "   4. 쿼리: incidents_active 확인" -ForegroundColor White
Write-Host "   5. 오른쪽 상단 시간: Last 1 hour 확인" -ForegroundColor White
Write-Host "   6. Apply 또는 Save 클릭" -ForegroundColor White

Write-Host ""
Write-Host "=== 완료 ===" -ForegroundColor Cyan
