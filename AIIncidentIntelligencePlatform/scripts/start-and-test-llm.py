# -*- coding: utf-8 -*-
"""
LLM 서비스 시작 및 테스트
"""
import sys
import io
import subprocess
import time
import requests
import json
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

LLM_URL = "http://localhost:8000"

def check_service():
    """서비스 상태 확인"""
    try:
        response = requests.get(f"{LLM_URL}/", timeout=5)
        data = response.json()
        return data.get('status') == 'healthy'
    except:
        return False

def start_service():
    """서비스 시작"""
    import os
    llm_layer_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'llm-layer')
    os.chdir(llm_layer_path)
    
    # 가상 환경 확인
    venv_python = os.path.join(llm_layer_path, 'venv', 'Scripts', 'python.exe')
    if not os.path.exists(venv_python):
        print("[INFO] Creating virtual environment...")
        subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True)
    
    # 의존성 설치
    print("[INFO] Installing dependencies...")
    subprocess.run([venv_python, '-m', 'pip', 'install', '--quiet', '-q', '-r', 'requirements.txt'], 
                   check=True, capture_output=True)
    
    # 서비스 시작 (백그라운드)
    print("[INFO] Starting service...")
    process = subprocess.Popen(
        [venv_python, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=llm_layer_path
    )
    
    return process

def test_classify():
    """분류 테스트"""
    test_data = {
        "events": [
            {
                "id": "test-001",
                "timestamp": datetime.now().isoformat(),
                "service": "database",
                "level": "ERROR",
                "message": "Connection timeout after 30 seconds"
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{LLM_URL}/api/v1/classify",
            json=test_data,
            timeout=60
        )
        response.raise_for_status()
        result = response.json()
        
        print("\n[OK] Classification Result:")
        print(f"  Incident ID: {result.get('incident_id')}")
        print(f"  Category: {result.get('category')}")
        print(f"  Severity: {result.get('severity')}")
        print(f"  Confidence: {result.get('confidence', 0):.2%}")
        print(f"  Description: {result.get('description', '')[:100]}")
        
        return True
    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                print(f"  Error details: {error_data}")
            except:
                print(f"  Response: {e.response.text[:200]}")
        return False

def main():
    print("="*60)
    print("LLM Service Start & Test")
    print("="*60)
    print()
    
    # 기존 서비스 확인
    if check_service():
        print("[INFO] Service already running")
    else:
        print("[INFO] Starting new service...")
        process = start_service()
        
        # 서비스 시작 대기
        print("[INFO] Waiting for service to start...")
        for i in range(30):
            time.sleep(1)
            if check_service():
                print("[OK] Service started successfully")
                break
        else:
            print("[ERROR] Service failed to start")
            if process:
                process.terminate()
            return False
    
    # 헬스 체크
    try:
        response = requests.get(f"{LLM_URL}/", timeout=5)
        health = response.json()
        print(f"\n[OK] Service Status: {health.get('status')}")
        print(f"  Prompt Version: {health.get('prompt_version')}")
        print(f"  Confidence Threshold: {health.get('confidence_threshold')}")
    except Exception as e:
        print(f"\n[ERROR] Health check failed: {e}")
        return False
    
    # 테스트 실행
    print("\n" + "="*60)
    print("Running Classification Test...")
    print("="*60)
    
    success = test_classify()
    
    print("\n" + "="*60)
    if success:
        print("[OK] All tests passed!")
    else:
        print("[ERROR] Tests failed")
    print("="*60)
    
    return success

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
