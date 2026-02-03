# soSadWorld 백엔드 서비스 중지 스크립트
# 실행 중인 Spring Boot 서비스를 찾아서 중지합니다.

Write-Host "=== soSadWorld 백엔드 서비스 중지 ===" -ForegroundColor Yellow

# Java 프로세스 중 spring-boot:run 실행 중인 프로세스 찾기
$processes = Get-Process java -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*spring-boot:run*" -or
    $_.CommandLine -like "*diary-service*" -or
    $_.CommandLine -like "*ai-analysis-service*" -or
    $_.CommandLine -like "*analysis-result-service*" -or
    $_.CommandLine -like "*gateway-service*"
}

if ($processes) {
    Write-Host "`n실행 중인 서비스를 찾았습니다. 중지합니다..." -ForegroundColor Cyan
    $processes | ForEach-Object {
        Write-Host "  프로세스 중지: PID $($_.Id)" -ForegroundColor White
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "`n모든 서비스가 중지되었습니다." -ForegroundColor Green
} else {
    Write-Host "`n실행 중인 서비스를 찾을 수 없습니다." -ForegroundColor Yellow
}
