# -*- coding: utf-8 -*-
"""
LLM 레이어 자동 시작 및 테스트 스크립트
의존성 설치 → 서비스 시작 → 테스트 실행
"""
import sys
import os
import io
import subprocess
import time
import requests
import json
from datetime import datetime

# UTF-8 인코딩 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

LLM_URL = "http://localhost:8000"
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LLM_LAYER_PATH = os.path.join(PROJECT_ROOT, "llm-layer")

def print_step(step, message):
    """단계 출력"""
    print(f"\n{'='*60}")
    print(f"Step {step}: {message}")
    print('='*60)

def install_dependencies():
    """의존성 설치"""
    print_step(1, "Installing Dependencies")
    
    requirements_file = os.path.join(LLM_LAYER_PATH, "requirements.txt")
    if not os.path.exists(requirements_file):
        print("[ERROR] requirements.txt not found")
        return False
    
    try:
        print("Installing packages...")
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", "-r", requirements_file],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            print("[OK] Dependencies installed")
            return True
        else:
            print(f"[WARN] Some dependencies may have failed")
            print(f"Error: {result.stderr[:200]}")
            return True  # 계속 진행
    except Exception as e:
        print(f"[ERROR] Dependency installation failed: {e}")
        return False

def start_service():
    """서비스 시작"""
    print_step(2, "Starting LLM Layer Service")
    
    main_py = os.path.join(LLM_LAYER_PATH, "main.py")
    if not os.path.exists(main_py):
        print("[ERROR] main.py not found")
        return None
    
    try:
        print("Starting service in background...")
        process = subprocess.Popen(
            [sys.executable, main_py],
            cwd=LLM_LAYER_PATH,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print(f"[OK] Service process started (PID: {process.pid})")
        print("Waiting 30 seconds for initialization...")
        time.sleep(30)
        return process
    except Exception as e:
        print(f"[ERROR] Failed to start service: {e}")
        return None

def check_service(max_attempts=20):
    """서비스 상태 확인"""
    print_step(3, "Checking Service Status")
    
    for i in range(1, max_attempts + 1):
        try:
            response = requests.get(f"{LLM_URL}/", timeout=3)
            response.raise_for_status()
            health = response.json()
            
            print(f"\n[OK] LLM Layer Service is RUNNING!\n")
            print(f"  Status: {health.get('status')}")
            print(f"  Prompt Version: {health.get('prompt_version')}")
            print(f"  Confidence Threshold: {health.get('confidence_threshold')}")
            print(f"\n  Available Endpoints:")
            for ep_name, ep_path in health.get('endpoints', {}).items():
                print(f"    - {ep_name}: {ep_path}")
            print()
            return True
        except requests.exceptions.ConnectionError:
            if i < max_attempts:
                print(f"  Attempt {i}/{max_attempts}...")
                time.sleep(2)
            else:
                print(f"\n[ERROR] Service not responding after {max_attempts} attempts")
                return False
        except Exception as e:
            print(f"[ERROR] Service check failed: {e}")
            return False
    
    return False

def test_llm_chain():
    """LLM 체이닝 테스트"""
    print_step(4, "LLM Chain Test")
    
    test_data = {
        "incident_id": f"test-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "service": "database",
        "logs": [
            "ERROR: Connection timeout after 30 seconds",
            "WARN: Connection pool exhausted",
            "ERROR: Failed to establish database connection",
            "ERROR: Database server not responding"
        ],
        "metrics": {
            "error_rate": "25%",
            "resource_usage": "98%",
            "response_time": "8.5s",
            "connection_count": "150/100"
        },
        "recent_changes": [
            "Database migration at 10:00 AM",
            "Connection pool size increased to 100"
        ],
        "start_time": datetime.now().isoformat(),
        "duration": "15 minutes"
    }
    
    print("Test Data:")
    print(f"  Incident ID: {test_data['incident_id']}")
    print(f"  Service: {test_data['service']}")
    print(f"  Logs: {len(test_data['logs'])} entries")
    print()
    print("Executing LLM chain...")
    print("(This will take 30-60 seconds)")
    print()
    
    try:
        # 타임아웃을 5분으로 증가 (LLM 응답이 느릴 수 있음)
        response = requests.post(
            f"{LLM_URL}/api/v1/chain",
            json=test_data,
            timeout=300  # 5분
        )
        response.raise_for_status()
        result = response.json()
        
        print("\n" + "="*60)
        print("[OK] LLM Chain Execution Complete!")
        print("="*60)
        print()
        
        # 1. Classification
        if "classification" in result:
            cls = result["classification"]
            print("[1. Incident Classification]")
            print(f"  Type: {cls.get('incident_type', 'N/A')}")
            print(f"  Severity: {cls.get('severity', 'N/A')}")
            print(f"  Confidence: {cls.get('confidence', 0):.2%}")
            print(f"  Needs Analysis: {cls.get('needs_root_cause_analysis', False)}")
            if cls.get('description'):
                desc = cls.get('description', '')[:100]
                print(f"  Description: {desc}...")
            print()
        
        # 2. Root Cause Analysis
        if "root_cause_analysis" in result and result["root_cause_analysis"].get("suspected_root_causes"):
            analysis = result["root_cause_analysis"]
            primary = analysis["suspected_root_causes"][0]
            print("[2. Root Cause Analysis]")
            print(f"  Primary Cause: {primary.get('cause', 'N/A')}")
            print(f"  Likelihood: {primary.get('likelihood', 0):.2%}")
            if primary.get('evidence'):
                print("  Evidence:")
                for evidence in primary['evidence'][:3]:
                    print(f"    - {evidence}")
            print()
        
        # 3. Incident Report
        if "incident_report" in result:
            report = result["incident_report"]
            print("[3. Incident Report]")
            print(f"  Title: {report.get('title', 'N/A')}")
            summary = report.get('summary', '')
            print(f"  Summary: {summary[:200]}...")
            if report.get('recommended_actions'):
                print("  Recommended Actions:")
                for action in report['recommended_actions'][:3]:
                    print(f"    - {action}")
            print()
        
        # 4. CS Summary
        if "cs_summary" in result:
            cs = result["cs_summary"]
            print("[4. CS Summary]")
            msg = cs.get('customer_message', '')
            print(f"  Customer Message: {msg[:200]}...")
            print()
        
        # Chain Status
        print("[Chain Execution Status]")
        print(f"  Started: {result.get('chain_started_at', 'N/A')}")
        print(f"  Completed: {result.get('chain_completed_at', 'N/A')}")
        print(f"  Stopped: {result.get('chain_stopped', False)}")
        if result.get('chain_stopped_reason'):
            print(f"  Reason: {result.get('chain_stopped_reason')}")
        print()
        
        print("="*60)
        print("[OK] All Tests Passed!")
        print("="*60)
        return True
        
    except requests.exceptions.Timeout:
        print("[ERROR] Request timeout (120 seconds)")
        return False
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """메인 실행"""
    print("\n" + "="*60)
    print("LLM Layer Auto Start & Test")
    print("="*60)
    print()
    
    # 1. 의존성 설치
    if not install_dependencies():
        print("\n[ERROR] Dependency installation failed")
        sys.exit(1)
    
    # 2. 서비스 시작
    process = start_service()
    if not process:
        print("\n[ERROR] Service start failed")
        sys.exit(1)
    
    # 3. 서비스 확인
    if not check_service():
        print("\n[ERROR] Service not ready")
        if process:
            process.terminate()
        sys.exit(1)
    
    # 4. 테스트 실행
    success = test_llm_chain()
    
    # 5. 정리 (서비스는 계속 실행)
    if process:
        print("\n[INFO] Service will continue running in background")
        print(f"  Process PID: {process.pid}")
        print("  To stop: kill the process or restart the terminal")
    
    print("\n" + "="*60)
    if success:
        print("[OK] All tests completed successfully!")
    else:
        print("[ERROR] Some tests failed")
    print("="*60)
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
