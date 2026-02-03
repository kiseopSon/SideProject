# Windows 방화벽에 8080 포트 인바운드 규칙 추가 (관리자 권한 필요)

# HTTP 8080 포트 인바운드 허용
netsh advfirewall firewall add rule name="Spring Boot Gateway (8080)" dir=in action=allow protocol=TCP localport=8080

Write-Host "방화벽 규칙이 추가되었습니다." -ForegroundColor Green
Write-Host "이제 외부에서 접속을 시도해보세요." -ForegroundColor Yellow

