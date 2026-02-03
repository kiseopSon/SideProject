# -*- coding: utf-8 -*-
"""
심각도별 에러 시나리오 테스트
약한 에러, 중간 에러, 하이 에러, 매우 하이 에러
"""
import sys
import io
import requests
import json
import time
from datetime import datetime
from typing import Dict, Any

# UTF-8 인코딩 강제 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

LLM_URL = "http://localhost:8000"

def print_header(text: str):
    """헤더 출력"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_section(text: str):
    """섹션 출력"""
    print(f"\n[{text}]")

def print_result(success: bool, message: str):
    """결과 출력"""
    status = "[OK]" if success else "[FAIL]"
    color = "\033[92m" if success else "\033[91m"
    reset = "\033[0m"
    print(f"{color}{status}{reset} {message}")

def check_service() -> bool:
    """서비스 상태 확인"""
    try:
        response = requests.get(f"{LLM_URL}/", timeout=5)
        response.raise_for_status()
        return True
    except Exception as e:
        print_result(False, f"서비스 연결 실패: {e}")
        return False

def test_low_severity():
    """약한 에러 (Low Severity)"""
    print_header("약한 에러 (Low Severity) 테스트")
    
    test_data = {
        "incident_id": f"low-severity-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "service": "web-frontend",
        "logs": [
            "[WARN] Slow response time detected: 2.5s",
            "[INFO] Request processed successfully",
            "[WARN] Cache miss for static asset: /images/logo.png",
            "[INFO] User session created"
        ],
        "metrics": {
            "response_time": "2.5s",
            "error_rate": "0.5%",
            "cache_hit_rate": "85%"
        },
        "start_time": datetime.now().isoformat(),
        "duration": "5 minutes"
    }
    
    print_section("테스트 데이터")
    print(f"  인시던트 ID: {test_data['incident_id']}")
    print(f"  서비스: {test_data['service']}")
    print(f"  로그: 경미한 WARN만 존재")
    
    try:
        print_section("LLM 체인 실행 중...")
        response = requests.post(
            f"{LLM_URL}/api/v1/chain",
            json=test_data,
            timeout=120
        )
        response.raise_for_status()
        result = response.json()
        
        # 결과 출력
        if "classification" in result:
            cls = result["classification"]
            print_section("Classification 결과")
            print(f"  인시던트 유형: {cls.get('incident_type', 'N/A')}")
            print(f"  심각도: {cls.get('severity', 'N/A')}")
            print(f"  신뢰도: {cls.get('confidence', 0):.2%}")
            print(f"  근본 원인 분석 필요: {cls.get('needs_root_cause_analysis', False)}")
        
        chain_stopped = result.get("chain_stopped", False)
        print_section("체인 실행 상태")
        print(f"  중단 여부: {'예' if chain_stopped else '아니오'}")
        if chain_stopped:
            print(f"  중단 사유: {result.get('chain_stopped_reason', 'N/A')}")
        
        print_result(True, "약한 에러 테스트 완료")
        return True
        
    except Exception as e:
        print_result(False, f"테스트 실패: {e}")
        return False

def test_medium_severity():
    """중간 에러 (Medium Severity)"""
    print_header("중간 에러 (Medium Severity) 테스트")
    
    test_data = {
        "incident_id": f"medium-severity-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "service": "api-gateway",
        "logs": [
            "[ERROR] Rate limit exceeded for user 12345",
            "[WARN] High request volume: 3000 req/s",
            "[ERROR] Timeout waiting for downstream service: payment-service",
            "[WARN] Circuit breaker opened for payment-service",
            "[ERROR] Failed to process payment request"
        ],
        "metrics": {
            "request_rate": "3000 req/s",
            "error_rate": "8%",
            "latency_p95": "1.8s",
            "circuit_breaker_open": True
        },
        "recent_changes": [
            "API rate limit increased to 5000 req/s at 10:00 AM",
            "Payment service deployment at 9:30 AM"
        ],
        "start_time": datetime.now().isoformat(),
        "duration": "15 minutes"
    }
    
    print_section("테스트 데이터")
    print(f"  인시던트 ID: {test_data['incident_id']}")
    print(f"  서비스: {test_data['service']}")
    print(f"  로그: ERROR와 WARN 혼합")
    
    try:
        print_section("LLM 체인 실행 중...")
        response = requests.post(
            f"{LLM_URL}/api/v1/chain",
            json=test_data,
            timeout=180
        )
        response.raise_for_status()
        result = response.json()
        
        # 결과 출력
        if "classification" in result:
            cls = result["classification"]
            print_section("Classification 결과")
            print(f"  인시던트 유형: {cls.get('incident_type', 'N/A')}")
            print(f"  심각도: {cls.get('severity', 'N/A')}")
            print(f"  신뢰도: {cls.get('confidence', 0):.2%}")
            print(f"  근본 원인 분석 필요: {cls.get('needs_root_cause_analysis', False)}")
        
        if "root_cause_analysis" in result:
            analysis = result["root_cause_analysis"]
            print_section("Root Cause Analysis 결과")
            if analysis.get("suspected_root_causes"):
                primary = analysis["suspected_root_causes"][0]
                print(f"  주요 원인: {primary.get('cause', 'N/A')[:100]}")
                print(f"  가능성: {primary.get('likelihood', 0):.2%}")
        
        if "incident_report" in result:
            report = result["incident_report"]
            print_section("Incident Report 결과")
            print(f"  제목: {report.get('title', 'N/A')[:80]}")
            if report.get('recommended_actions'):
                print("  권장 조치:")
                for action in report['recommended_actions'][:3]:
                    print(f"    - {action[:80]}")
        
        print_result(True, "중간 에러 테스트 완료")
        return True
        
    except Exception as e:
        print_result(False, f"테스트 실패: {e}")
        return False

def test_high_severity():
    """하이 에러 (High Severity)"""
    print_header("하이 에러 (High Severity) 테스트")
    
    test_data = {
        "incident_id": f"high-severity-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "service": "database",
        "logs": [
            "[CRITICAL] Database connection pool exhausted",
            "[ERROR] All database connections lost",
            "[CRITICAL] Primary database server not responding",
            "[ERROR] Failed to establish connection to replica",
            "[CRITICAL] Database timeout after 30 seconds",
            "[ERROR] Transaction rollback failed",
            "[CRITICAL] Data consistency check failed"
        ],
        "metrics": {
            "error_rate": "45%",
            "resource_usage": "98%",
            "response_time": "12.5s",
            "connection_count": "150/100",
            "database_latency": "8500ms",
            "active_connections": "150",
            "max_connections": "100"
        },
        "recent_changes": [
            "Database migration executed at 10:00 AM",
            "Connection pool size increased from 50 to 100 at 9:30 AM",
            "New index created on users table at 9:00 AM"
        ],
        "start_time": datetime.now().isoformat(),
        "duration": "25 minutes"
    }
    
    print_section("테스트 데이터")
    print(f"  인시던트 ID: {test_data['incident_id']}")
    print(f"  서비스: {test_data['service']}")
    print(f"  로그: CRITICAL과 ERROR 혼합")
    
    try:
        print_section("LLM 체인 실행 중...")
        response = requests.post(
            f"{LLM_URL}/api/v1/chain",
            json=test_data,
            timeout=180
        )
        response.raise_for_status()
        result = response.json()
        
        # 결과 출력
        if "classification" in result:
            cls = result["classification"]
            print_section("Classification 결과")
            print(f"  인시던트 유형: {cls.get('incident_type', 'N/A')}")
            print(f"  심각도: {cls.get('severity', 'N/A')}")
            print(f"  신뢰도: {cls.get('confidence', 0):.2%}")
            print(f"  근본 원인 분석 필요: {cls.get('needs_root_cause_analysis', False)}")
        
        if "root_cause_analysis" in result:
            analysis = result["root_cause_analysis"]
            print_section("Root Cause Analysis 결과")
            if analysis.get("suspected_root_causes"):
                print("  주요 원인들:")
                for i, cause in enumerate(analysis["suspected_root_causes"][:3], 1):
                    print(f"    {i}. {cause.get('cause', 'N/A')[:80]}")
                    print(f"       가능성: {cause.get('likelihood', 0):.2%}")
        
        if "incident_report" in result:
            report = result["incident_report"]
            print_section("Incident Report 결과")
            print(f"  제목: {report.get('title', 'N/A')}")
            summary = report.get('summary', '')
            if summary:
                print(f"  요약: {summary[:200]}...")
            if report.get('recommended_actions'):
                print("  권장 조치:")
                for action in report['recommended_actions'][:5]:
                    print(f"    - {action[:80]}")
        
        if "cs_summary" in result:
            cs = result["cs_summary"]
            print_section("CS Summary 결과")
            msg = cs.get('customer_message', '')
            if msg:
                print(f"  고객 메시지: {msg[:200]}...")
        
        print_result(True, "하이 에러 테스트 완료")
        return True
        
    except Exception as e:
        print_result(False, f"테스트 실패: {e}")
        return False

def test_critical_severity():
    """매우 하이 에러 (Critical Severity)"""
    print_header("매우 하이 에러 (Critical Severity) 테스트")
    
    test_data = {
        "incident_id": f"critical-severity-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "service": "payment-service",
        "logs": [
            "[CRITICAL] Payment processing service completely down",
            "[CRITICAL] All payment gateways unreachable",
            "[CRITICAL] Database corruption detected in transactions table",
            "[CRITICAL] Financial data integrity compromised",
            "[CRITICAL] All backup systems failed",
            "[CRITICAL] Service unavailable - all instances down",
            "[CRITICAL] Data loss detected: 5000+ transactions",
            "[CRITICAL] Security breach detected in payment module",
            "[CRITICAL] Emergency rollback required immediately"
        ],
        "metrics": {
            "error_rate": "100%",
            "service_availability": "0%",
            "response_time": "N/A (service down)",
            "payment_success_rate": "0%",
            "affected_transactions": "5000+",
            "data_loss": True,
            "security_breach": True
        },
        "recent_changes": [
            "Payment gateway integration updated at 11:00 AM",
            "Database schema migration at 10:30 AM",
            "Security patch deployed at 10:00 AM",
            "New payment processor added at 9:00 AM"
        ],
        "start_time": datetime.now().isoformat(),
        "duration": "45 minutes"
    }
    
    print_section("테스트 데이터")
    print(f"  인시던트 ID: {test_data['incident_id']}")
    print(f"  서비스: {test_data['service']}")
    print(f"  로그: 모든 CRITICAL 로그")
    print(f"  메트릭: 서비스 완전 다운, 데이터 손실, 보안 침해")
    
    try:
        print_section("LLM 체인 실행 중...")
        print("  (Critical 에러 - 전체 체인 분석 중...)")
        response = requests.post(
            f"{LLM_URL}/api/v1/chain",
            json=test_data,
            timeout=180
        )
        response.raise_for_status()
        result = response.json()
        
        # 결과 출력
        if "classification" in result:
            cls = result["classification"]
            print_section("Classification 결과")
            print(f"  인시던트 유형: {cls.get('incident_type', 'N/A')}")
            print(f"  심각도: {cls.get('severity', 'N/A')}")
            print(f"  신뢰도: {cls.get('confidence', 0):.2%}")
            print(f"  근본 원인 분석 필요: {cls.get('needs_root_cause_analysis', False)}")
        
        if "root_cause_analysis" in result:
            analysis = result["root_cause_analysis"]
            print_section("Root Cause Analysis 결과")
            if analysis.get("suspected_root_causes"):
                print("  주요 원인들:")
                for i, cause in enumerate(analysis["suspected_root_causes"][:5], 1):
                    print(f"    {i}. {cause.get('cause', 'N/A')[:100]}")
                    print(f"       가능성: {cause.get('likelihood', 0):.2%}")
                    if cause.get('evidence'):
                        print(f"       근거: {', '.join(cause['evidence'][:2])}")
        
        if "incident_report" in result:
            report = result["incident_report"]
            print_section("Incident Report 결과")
            print(f"  제목: {report.get('title', 'N/A')}")
            summary = report.get('summary', '')
            if summary:
                print(f"  요약: {summary[:300]}...")
            impact = report.get('impact_summary', '')
            if impact:
                print(f"  영향: {impact[:200]}...")
            if report.get('recommended_actions'):
                print("  긴급 권장 조치:")
                for action in report['recommended_actions'][:5]:
                    print(f"    - {action[:100]}")
            if report.get('follow_up_required'):
                print("  후속 조치 필요: 예")
        
        if "cs_summary" in result:
            cs = result["cs_summary"]
            print_section("CS Summary 결과")
            msg = cs.get('customer_message', '')
            if msg:
                print(f"  고객 메시지: {msg[:300]}...")
        
        chain_stopped = result.get("chain_stopped", False)
        print_section("체인 실행 상태")
        print(f"  중단 여부: {'예' if chain_stopped else '아니오'}")
        print(f"  시작 시간: {result.get('chain_started_at', 'N/A')}")
        print(f"  완료 시간: {result.get('chain_completed_at', 'N/A')}")
        
        print_result(True, "매우 하이 에러 테스트 완료")
        return True
        
    except Exception as e:
        print_result(False, f"테스트 실패: {e}")
        return False

def main():
    """메인 함수"""
    print_header("심각도별 에러 시나리오 테스트 시작")
    
    if not check_service():
        print_result(False, "서비스가 실행 중이 아닙니다.")
        sys.exit(1)
    
    print_result(True, "서비스 연결 성공")
    
    results = []
    
    # 각 심각도별 테스트 실행
    print("\n" + "=" * 70)
    print("  테스트 순서: 약한 → 중간 → 하이 → 매우 하이")
    print("=" * 70)
    
    results.append(("약한 에러 (Low)", test_low_severity()))
    time.sleep(2)  # 각 테스트 사이 간격
    
    results.append(("중간 에러 (Medium)", test_medium_severity()))
    time.sleep(2)
    
    results.append(("하이 에러 (High)", test_high_severity()))
    time.sleep(2)
    
    results.append(("매우 하이 에러 (Critical)", test_critical_severity()))
    
    # 최종 결과
    print_header("최종 테스트 결과")
    all_passed = True
    for severity_name, passed in results:
        print_result(passed, severity_name)
        if not passed:
            all_passed = False
    
    print()
    if all_passed:
        print_result(True, "모든 심각도별 테스트 통과!")
    else:
        print_result(False, "일부 테스트 실패")
    
    sys.exit(0 if all_passed else 1)

if __name__ == '__main__':
    main()
