"""
백엔드 서버 연결 테스트 스크립트
"""
import requests
import sys

def test_backend():
    try:
        # Health check
        response = requests.get("http://localhost:8000/health", timeout=2)
        if response.status_code == 200:
            print("✅ 백엔드 서버가 정상적으로 실행 중입니다!")
            print(f"   응답: {response.json()}")
            return True
        else:
            print(f"❌ 백엔드 서버가 응답하지만 상태 코드가 {response.status_code}입니다.")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 백엔드 서버에 연결할 수 없습니다.")
        print("   백엔드 서버가 실행 중인지 확인하세요:")
        print("   cd backend")
        print("   python -m uvicorn main:app --reload")
        return False
    except requests.exceptions.Timeout:
        print("❌ 백엔드 서버 응답 시간 초과")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

if __name__ == "__main__":
    success = test_backend()
    sys.exit(0 if success else 1)
