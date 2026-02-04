# 포트 포워딩 작동 여부 확인 스크립트

Write-Host "=== 포트 포워딩 진단 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 서버 리스닝 상태 확인
Write-Host "1. 서버 리스닝 상태 확인..." -ForegroundColor Yellow
$listening = netstat -ano | findstr ":8101" | findstr "LISTENING"
if ($listening) {
    Write-Host "   ✅ 서버가 8101 포트에서 리스닝 중입니다." -ForegroundColor Green
    Write-Host "   $listening" -ForegroundColor Gray
} else {
    Write-Host "   ❌ 서버가 8101 포트에서 리스닝하지 않습니다." -ForegroundColor Red
}
Write-Host ""

# 2. 로컬 네트워크 접속 테스트
Write-Host "2. 로컬 네트워크 접속 테스트 (192.168.0.3:8101)..." -ForegroundColor Yellow
try {
    $response = Test-NetConnection -ComputerName 192.168.0.3 -Port 8101 -WarningAction SilentlyContinue
    if ($response.TcpTestSucceeded) {
        Write-Host "   ✅ 로컬 네트워크에서 접속 가능합니다." -ForegroundColor Green
    } else {
        Write-Host "   ❌ 로컬 네트워크에서 접속 불가능합니다." -ForegroundColor Red
        Write-Host "   → 방화벽 설정을 확인하세요." -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ 테스트 실패: $_" -ForegroundColor Red
}
Write-Host ""

# 3. 방화벽 규칙 확인
Write-Host "3. Windows 방화벽 규칙 확인..." -ForegroundColor Yellow
$firewallRule = netsh advfirewall firewall show rule name="Spring Boot Gateway (8101)" 2>$null
if ($firewallRule -match "확인됨|Ok") {
    Write-Host "   ✅ 방화벽 규칙이 설정되어 있습니다." -ForegroundColor Green
} else {
    Write-Host "   ❌ 방화벽 규칙이 없습니다." -ForegroundColor Red
    Write-Host "   → 다음 명령어를 관리자 권한으로 실행하세요:" -ForegroundColor Yellow
    Write-Host "   netsh advfirewall firewall add rule name=`"Spring Boot Gateway (8101)`" dir=in action=allow protocol=TCP localport=8101" -ForegroundColor Gray
}
Write-Host ""

# 4. 현재 IP 주소 확인
Write-Host "4. 네트워크 정보 확인..." -ForegroundColor Yellow
$ipconfig = ipconfig | Select-String "IPv4"
Write-Host "   $ipconfig" -ForegroundColor Gray
Write-Host ""

# 5. 공인 IP 확인
Write-Host "5. 공인 IP 확인..." -ForegroundColor Yellow
try {
    $publicIP = (Invoke-WebRequest -Uri "http://ifconfig.me/ip" -UseBasicParsing -TimeoutSec 5).Content.Trim()
    Write-Host "   공인 IP: $publicIP" -ForegroundColor Cyan
    Write-Host "   외부 접속 URL: http://$publicIP:8101" -ForegroundColor Cyan
} catch {
    Write-Host "   ⚠️ 공인 IP 확인 실패 (인터넷 연결 확인)" -ForegroundColor Yellow
}
Write-Host ""

# 6. 체크리스트
Write-Host "=== 체크리스트 ===" -ForegroundColor Cyan
Write-Host "다음 항목들을 확인하세요:" -ForegroundColor Yellow
Write-Host "  □ 라우터 관리 페이지에서 포트 포워딩 규칙이 활성화되어 있는가?" -ForegroundColor White
Write-Host "  □ 내부 IP가 정확히 192.168.0.3으로 설정되어 있는가?" -ForegroundColor White
Write-Host "  □ 외부 포트와 내부 포트가 모두 8101인가?" -ForegroundColor White
Write-Host "  □ 프로토콜이 TCP 또는 Both로 설정되어 있는가?" -ForegroundColor White
Write-Host "  □ 라우터를 재부팅했는가?" -ForegroundColor White
Write-Host "  □ 같은 네트워크의 다른 기기에서 192.168.0.3:8101 접속이 되는가?" -ForegroundColor White
Write-Host ""

Write-Host "=== iptime 라우터 설정 경로 ===" -ForegroundColor Cyan
Write-Host "고급설정 > NAT/라우터 관리 > 포트포워드 설정" -ForegroundColor Yellow
Write-Host "또는" -ForegroundColor Yellow
Write-Host "고급설정 > 방화벽 > 포트포워드 설정" -ForegroundColor Yellow
Write-Host ""

