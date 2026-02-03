# -*- coding: utf-8 -*-
"""
LLM 레이어 완전 테스트 - LLM에게 직접 말하기
한글 인코딩 문제 해결
"""
import sys
import io
import requests
import json
import time
from datetime import datetime

# UTF-8 인코딩 강제 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

LLM_URL = "http://localhost:8000"

def print_utf8(text):
    """UTF-8 출력"""
    print(text.encode('utf-8', errors='replace').decode('utf-8', errors='replace'))

def check_service():
    """서비스 상태 확인"""
    print_utf8("=" * 60)
    print_utf8("LLM 레이어 직접 테스트")
    print_utf8("=" * 60)
    print()
    
    print_utf8("1. 서비스 상태 확인...")
    try:
        response = requests.get(f"{LLM_URL}/", timeout=5)
        response.raise_for_status()
        health = response.json()
        print_utf8(f"   [OK] 서비스 상태: {health.get('status')}")
        print_utf8(f"   [OK] 프롬프트 버전: {health.get('prompt_version')}")
        print_utf8(f"   [OK] 신뢰도 임계값: {health.get('confidence_threshold')}")
        print()
        return True
    except Exception as e:
        print_utf8(f"   [ERROR] 서비스 연결 실패: {e}")
        print_utf8("   → LLM 레이어 서비스를 먼저 시작하세요")
        print_utf8("   → python llm-layer/main.py")
        return False

def test_llm_chain():
    """LLM 체이닝 테스트"""
    print_utf8("2. 테스트 데이터 준비...")
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
            "Connection pool size increased to 100",
            "New index created on users table"
        ],
        "start_time": datetime.now().isoformat(),
        "duration": "15 minutes"
    }
    print_utf8(f"   [OK] 인시던트 ID: {test_data['incident_id']}")
    print_utf8(f"   [OK] 서비스: {test_data['service']}")
    print_utf8(f"   [OK] 로그 수: {len(test_data['logs'])}")
    print()
    
    print_utf8("3. LLM 체이닝 실행 중...")
    print_utf8("   (LLM에게 직접 분석 요청 중 - 30-60초 소요)")
    print()
    
    try:
        response = requests.post(
            f"{LLM_URL}/api/v1/chain",
            json=test_data,
            timeout=120
        )
        response.raise_for_status()
        result = response.json()
        
        print_utf8("=" * 60)
        print_utf8("[OK] LLM 체이닝 실행 완료!")
        print_utf8("=" * 60)
        print()
        
        # 1. Classification
        if "classification" in result:
            cls = result["classification"]
            print_utf8("[1단계: 인시던트 분류]")
            print_utf8(f"  인시던트 유형: {cls.get('incident_type', 'N/A')}")
            print_utf8(f"  심각도: {cls.get('severity', 'N/A')}")
            print_utf8(f"  신뢰도: {cls.get('confidence', 0):.2%}")
            print_utf8(f"  근본 원인 분석 필요: {cls.get('needs_root_cause_analysis', False)}")
            if cls.get('description'):
                desc = cls.get('description', '')[:100]
                print_utf8(f"  설명: {desc}...")
            print()
        
        # 2. Root Cause Analysis
        if "root_cause_analysis" in result and result["root_cause_analysis"].get("suspected_root_causes"):
            analysis = result["root_cause_analysis"]
            primary = analysis["suspected_root_causes"][0]
            print_utf8("[2단계: 근본 원인 분석]")
            print_utf8(f"  주요 원인: {primary.get('cause', 'N/A')}")
            print_utf8(f"  가능성: {primary.get('likelihood', 0):.2%}")
            if primary.get('evidence'):
                print_utf8("  근거:")
                for evidence in primary['evidence'][:3]:
                    print_utf8(f"    - {evidence}")
            print()
        
        # 3. Incident Report
        if "incident_report" in result:
            report = result["incident_report"]
            print_utf8("[3단계: 인시던트 리포트]")
            print_utf8(f"  제목: {report.get('title', 'N/A')}")
            summary = report.get('summary', '')
            print_utf8(f"  요약: {summary[:200]}...")
            if report.get('recommended_actions'):
                print_utf8("  권장 조치:")
                for action in report['recommended_actions'][:3]:
                    print_utf8(f"    - {action}")
            print()
        
        # 4. CS Summary
        if "cs_summary" in result:
            cs = result["cs_summary"]
            print_utf8("[4단계: 고객 지원 요약]")
            msg = cs.get('customer_message', '')
            print_utf8(f"  고객 메시지: {msg[:200]}...")
            print()
        
        # Chain Status
        print_utf8("[체인 실행 상태]")
        print_utf8(f"  시작 시간: {result.get('chain_started_at', 'N/A')}")
        print_utf8(f"  완료 시간: {result.get('chain_completed_at', 'N/A')}")
        print_utf8(f"  중단 여부: {'예' if result.get('chain_stopped', False) else '아니오'}")
        if result.get('chain_stopped_reason'):
            print_utf8(f"  중단 사유: {result.get('chain_stopped_reason')}")
        print()
        
        print_utf8("=" * 60)
        print_utf8("[OK] 모든 테스트 성공!")
        print_utf8("=" * 60)
        return True
        
    except requests.exceptions.Timeout:
        print_utf8("[ERROR] 요청 시간 초과 (120초)")
        return False
    except Exception as e:
        print_utf8(f"[ERROR] 테스트 실패: {e}")
        return False

if __name__ == '__main__':
    if not check_service():
        sys.exit(1)
    
    success = test_llm_chain()
    sys.exit(0 if success else 1)
