# -*- coding: utf-8 -*-
"""
간단한 분류만 테스트 (빠른 확인)
"""
import sys
import io
import requests
import json
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

LLM_URL = "http://localhost:8000"

def test_classify():
    """분류만 테스트"""
    print("="*60)
    print("LLM Classification Test (Quick)")
    print("="*60)
    print()
    
    # 헬스 체크
    try:
        response = requests.get(f"{LLM_URL}/", timeout=5)
        health = response.json()
        print(f"[OK] Service: {health.get('status')}")
        print()
    except:
        print("[ERROR] Service not available")
        return False
    
    # 분류 테스트
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
    
    print("Testing classification only...")
    print("(Faster than full chain)")
    print()
    
    try:
        response = requests.post(
            f"{LLM_URL}/api/v1/classify",
            json=test_data,
            timeout=60
        )
        response.raise_for_status()
        result = response.json()
        
        print("[OK] Classification Result:")
        print(f"  Incident ID: {result.get('incident_id')}")
        print(f"  Category: {result.get('category')}")
        print(f"  Severity: {result.get('severity')}")
        print(f"  Confidence: {result.get('confidence', 0):.2%}")
        print(f"  Description: {result.get('description', '')[:100]}...")
        print()
        print("[OK] Test successful!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        return False

if __name__ == '__main__':
    success = test_classify()
    sys.exit(0 if success else 1)
