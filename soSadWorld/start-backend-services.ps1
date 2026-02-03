# soSadWorld Backend Services Startup Script
# Starts all Spring Boot services in separate PowerShell windows

# Set JAVA_HOME to Java 17 if not already set
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
}
if (Test-Path "$env:JAVA_HOME\bin\java.exe") {
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
    Write-Host "Using Java 17 from: $env:JAVA_HOME" -ForegroundColor Green
} else {
    Write-Host "Warning: Java 17 not found at $env:JAVA_HOME" -ForegroundColor Yellow
    Write-Host "Please set JAVA_HOME to Java 17 installation directory" -ForegroundColor Yellow
}

Write-Host "=== soSadWorld Backend Services Starting ===" -ForegroundColor Green

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$javaHome = "C:\Program Files\Java\jdk-17"

# Diary Service (Port 8081)
Write-Host "`n[1/4] Starting Diary Service... (Port 8081)" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:JAVA_HOME='$javaHome'; `$env:Path='$javaHome\bin;' + `$env:Path; cd '$projectRoot\diary-service'; Write-Host 'Diary Service (Port 8081)' -ForegroundColor Yellow; ./gradlew bootRun"

Start-Sleep -Seconds 2

# AI Analysis Service (Port 8082)
Write-Host "[2/4] Starting AI Analysis Service... (Port 8082)" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:JAVA_HOME='$javaHome'; `$env:Path='$javaHome\bin;' + `$env:Path; cd '$projectRoot\ai-analysis-service'; Write-Host 'AI Analysis Service (Port 8082)' -ForegroundColor Yellow; ./gradlew bootRun"

Start-Sleep -Seconds 2

# Analysis Result Service (Port 8083)
Write-Host "[3/4] Starting Analysis Result Service... (Port 8083)" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:JAVA_HOME='$javaHome'; `$env:Path='$javaHome\bin;' + `$env:Path; cd '$projectRoot\analysis-result-service'; Write-Host 'Analysis Result Service (Port 8083)' -ForegroundColor Yellow; ./gradlew bootRun"

Start-Sleep -Seconds 2

# Gateway Service (Port 8080) - Start last
Write-Host "[4/4] Starting Gateway Service... (Port 8080)" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:JAVA_HOME='$javaHome'; `$env:Path='$javaHome\bin;' + `$env:Path; cd '$projectRoot\gateway-service'; Write-Host 'Gateway Service (Port 8080)' -ForegroundColor Yellow; ./gradlew bootRun"

Write-Host "`n=== All services have been started ===" -ForegroundColor Green
Write-Host "Each service is running in a separate PowerShell window." -ForegroundColor Yellow
Write-Host "`nService Ports:" -ForegroundColor Cyan
Write-Host "  - Gateway Service: http://localhost:8080" -ForegroundColor White
Write-Host "  - Diary Service: http://localhost:8081" -ForegroundColor White
Write-Host "  - AI Analysis Service: http://localhost:8082" -ForegroundColor White
Write-Host "  - Analysis Result Service: http://localhost:8083" -ForegroundColor White
Write-Host "`nTo stop services, close each PowerShell window." -ForegroundColor Yellow
