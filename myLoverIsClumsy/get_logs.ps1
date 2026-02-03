# Android 로그 수집 스크립트
# PowerShell에서 실행: .\get_logs.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Android 앱 로그 수집 스크립트" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ADB 경로 확인
$adbPath = "adb"
try {
    $null = & $adbPath version 2>&1
} catch {
    Write-Host "❌ ADB를 찾을 수 없습니다!" -ForegroundColor Red
    Write-Host "Android SDK Platform Tools를 설치하거나 PATH에 추가하세요." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Android Studio가 설치되어 있다면:" -ForegroundColor Yellow
    Write-Host '$env:Path += ";C:\Users\$env:USERNAME\AppData\Local\Android\Sdk\platform-tools"' -ForegroundColor Gray
    exit 1
}

# 디바이스 연결 확인
Write-Host "디바이스 연결 확인 중..." -ForegroundColor Yellow
$devices = & $adbPath devices 2>&1 | Select-String -Pattern "device$"

if (-not $devices) {
    Write-Host "❌ 연결된 Android 디바이스가 없습니다!" -ForegroundColor Red
    Write-Host ""
    Write-Host "해결 방법:" -ForegroundColor Yellow
    Write-Host "1. USB 디버깅 활성화 (설정 > 개발자 옵션 > USB 디버깅)" -ForegroundColor Gray
    Write-Host "2. USB 케이블로 연결" -ForegroundColor Gray
    Write-Host "3. 디바이스에서 'USB 디버깅 허용' 선택" -ForegroundColor Gray
    Write-Host "4. 에뮬레이터 사용 시 에뮬레이터 실행 확인" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ 디바이스 연결됨: $($devices.Count)개" -ForegroundColor Green
Write-Host ""

# 이전 로그 삭제 (선택사항)
Write-Host "이전 로그 삭제 중..." -ForegroundColor Yellow
& $adbPath logcat -c 2>&1 | Out-Null
Write-Host "✅ 완료" -ForegroundColor Green
Write-Host ""

# 로그 파일 이름 생성 (타임스탬프 포함)
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "app_logs_$timestamp.txt"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "로그 수집 시작" -ForegroundColor Cyan
Write-Host "파일: $logFile" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 이제 앱을 실행하고 회원가입을 시도하세요!" -ForegroundColor Yellow
Write-Host ""
Write-Host "로그 수집을 중지하려면 Ctrl+C를 누르세요." -ForegroundColor Gray
Write-Host ""

# 로그 수집 (필터링)
try {
    # Supabase, 환경 변수, 네트워크 관련 로그만 필터링
    & $adbPath logcat -v time | 
        Select-String -Pattern "Supabase|환경|Placeholder|EXPO_PUBLIC|network request|ReactNative|Expo" | 
        Tee-Object -FilePath $logFile
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "로그 수집 완료!" -ForegroundColor Green
    Write-Host "파일: $logFile" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "로그 파일을 확인하려면:" -ForegroundColor Yellow
    Write-Host "Get-Content $logFile | Select-String 'Supabase|Placeholder'" -ForegroundColor Gray
}
