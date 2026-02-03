#!/bin/bash
# AI Incident Intelligence Platform - 설정 스크립트
# Linux/Mac용

echo "=== AI Incident Intelligence Platform 설정 ==="
echo ""

# 가상환경 생성 및 패키지 설치 함수
setup_service() {
    local service_name=$1
    local service_path=$2
    
    echo "[$service_name] 설정 중..."
    
    # 디렉토리로 이동
    cd "$service_path" || return 1
    
    # 가상환경 생성
    if [ ! -d "venv" ]; then
        echo "  가상환경 생성 중..."
        python3 -m venv venv || python -m venv venv
        if [ $? -ne 0 ]; then
            echo "  [오류] 가상환경 생성 실패"
            cd ..
            return 1
        fi
    else
        echo "  가상환경이 이미 존재합니다."
    fi
    
    # 가상환경 활성화
    echo "  가상환경 활성화 중..."
    source venv/bin/activate
    
    # 패키지 설치
    echo "  패키지 설치 중..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    if [ $? -ne 0 ]; then
        echo "  [오류] 패키지 설치 실패"
        deactivate
        cd ..
        return 1
    fi
    
    echo "  [$service_name] 설정 완료!"
    echo ""
    
    deactivate
    cd ..
    return 0
}

# 각 서비스 설정
services=(
    "Event Processor:event-processor"
    "LLM Layer:llm-layer"
    "Notification Service:notification"
)

all_success=true

for service in "${services[@]}"; do
    IFS=':' read -r name path <<< "$service"
    if [ ! -d "$path" ]; then
        echo "[경고] $path 디렉토리를 찾을 수 없습니다."
        continue
    fi
    setup_service "$name" "$path"
    if [ $? -ne 0 ]; then
        all_success=false
    fi
done

echo ""
if [ "$all_success" = true ]; then
    echo "=== 모든 서비스 설정 완료! ==="
    echo ""
    echo "다음 단계:"
    echo "1. .env 파일을 열어 SLACK_WEBHOOK_URL 설정 (Ollama는 자동 설정됨)"
    echo "2. docker-compose up -d 로 인프라 실행"
    echo "3. 각 서비스 디렉토리에서 다음 명령으로 실행:"
    echo "   - Event Processor: python main.py"
    echo "   - LLM Layer: uvicorn main:app --reload --port 8000"
    echo "   - Notification: python main.py"
else
    echo "=== 일부 서비스 설정 중 오류가 발생했습니다 ==="
fi
