"""
Dashboard 테스트 스크립트
Dashboard API가 정상 작동하는지 확인
"""
import requests
import sys

BASE_URL = "http://localhost:8080"

def test_dashboard():
    """Dashboard API 테스트"""
    print("=== Dashboard API 테스트 ===\n")
    
    # 1. 메인 페이지 테스트
    print("1. 메인 페이지 테스트...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("   ✓ 메인 페이지 정상 (200 OK)")
        else:
            print(f"   ✗ 메인 페이지 오류: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("   ✗ Dashboard 서비스가 실행되지 않았습니다.")
        print("   → dashboard 디렉토리에서 'uvicorn main:app --reload --port 8080' 실행")
        return False
    except Exception as e:
        print(f"   ✗ 오류: {e}")
        return False
    
    # 2. 통계 API 테스트
    print("\n2. 통계 API 테스트...")
    try:
        response = requests.get(f"{BASE_URL}/api/stats", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print(f"   ✓ 통계 API 정상")
            print(f"   - 총 인시던트: {stats.get('total_incidents', 0)}")
            print(f"   - Critical: {stats.get('severity', {}).get('critical', 0)}")
            print(f"   - High: {stats.get('severity', {}).get('high', 0)}")
            print(f"   - Medium: {stats.get('severity', {}).get('medium', 0)}")
            print(f"   - Low: {stats.get('severity', {}).get('low', 0)}")
        else:
            print(f"   ✗ 통계 API 오류: {response.status_code}")
    except Exception as e:
        print(f"   ✗ 오류: {e}")
    
    # 3. 인시던트 목록 API 테스트
    print("\n3. 인시던트 목록 API 테스트...")
    try:
        response = requests.get(f"{BASE_URL}/api/incidents?limit=5", timeout=5)
        if response.status_code == 200:
            incidents = response.json()
            print(f"   ✓ 인시던트 목록 API 정상")
            print(f"   - 인시던트 수: {len(incidents)}")
            if incidents:
                print(f"   - 최신 인시던트: {incidents[0].get('incident_id', 'N/A')}")
        else:
            print(f"   ✗ 인시던트 목록 API 오류: {response.status_code}")
    except Exception as e:
        print(f"   ✗ 오류: {e}")
    
    print("\n=== 테스트 완료 ===")
    print(f"\n대시보드 접속: {BASE_URL}")
    return True

if __name__ == '__main__':
    try:
        test_dashboard()
    except KeyboardInterrupt:
        print("\n테스트 중단")
        sys.exit(1)
