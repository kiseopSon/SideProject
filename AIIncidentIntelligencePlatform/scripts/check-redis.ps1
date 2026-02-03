# Redis에 저장된 인시던트 확인 스크립트
Write-Host "=== Redis 인시던트 확인 ===" -ForegroundColor Cyan
Write-Host ""

$redisContainer = "aiincidentintelligenceplatform-redis-1"

# incidents:recent 리스트 길이 확인
Write-Host "1. incidents:recent 리스트 길이:" -ForegroundColor Yellow
$length = docker exec $redisContainer redis-cli LLEN incidents:recent
Write-Host "   길이: $length" -ForegroundColor $(if ($length -gt 0) { "Green" } else { "Red" })
Write-Host ""

# 최근 인시던트 5개 확인
if ($length -gt 0) {
    Write-Host "2. 최근 인시던트 (최대 5개):" -ForegroundColor Yellow
    $incidents = docker exec $redisContainer redis-cli LRANGE incidents:recent 0 4
    $index = 1
    foreach ($incident in $incidents) {
        if ($incident) {
            $incidentObj = $incident | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($incidentObj) {
                Write-Host "   [$index] ID: $($incidentObj.incident_id), 심각도: $($incidentObj.severity)" -ForegroundColor Green
            } else {
                Write-Host "   [$index] (파싱 실패)" -ForegroundColor Red
            }
            $index++
        }
    }
} else {
    Write-Host "2. 인시던트가 없습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "해결 방법:" -ForegroundColor Yellow
    Write-Host "  1. Notification Service가 실행 중인지 확인" -ForegroundColor White
    Write-Host "  2. Notification Service 로그에서 'Dashboard 업데이트' 메시지 확인" -ForegroundColor White
    Write-Host "  3. Redis 연결 설정 확인 (.env 파일의 REDIS_HOST, REDIS_PORT)" -ForegroundColor White
}

Write-Host ""
Write-Host "3. 심각도별 카운트:" -ForegroundColor Yellow
$severities = @("critical", "high", "medium", "low")
foreach ($sev in $severities) {
    $count = docker exec $redisContainer redis-cli GET "severity:$sev:count"
    if ($count -eq $null -or $count -eq "") {
        $count = 0
    }
    Write-Host "   $sev : $count" -ForegroundColor $(if ($count -gt 0) { "Green" } else { "Gray" })
}

Write-Host ""
Write-Host "=== 확인 완료 ===" -ForegroundColor Cyan
