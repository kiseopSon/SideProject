# -*- coding: utf-8 -*-
"""
Ollama 연결 확인 스크립트
"""
import sys
import io
import requests
import os
from dotenv import load_dotenv

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv()

OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'deepseek-coder:6.7b')

print("="*60)
print("Ollama 연결 확인")
print("="*60)
print()

# 1. Ollama 서버 확인
print("[1] Ollama 서버 확인...")
try:
    response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
    if response.status_code == 200:
        print(f"[OK] Ollama 서버 실행 중: {OLLAMA_BASE_URL}")
        models = response.json().get('models', [])
        print(f"[OK] 다운로드된 모델 수: {len(models)}")
        for model in models:
            print(f"  - {model.get('name', 'unknown')}")
    else:
        print(f"[ERROR] Ollama 서버 응답 오류: {response.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"[ERROR] Ollama 서버 연결 실패: {e}")
    print(f"  URL: {OLLAMA_BASE_URL}")
    print("  Ollama를 실행해주세요!")
    sys.exit(1)

print()

# 2. 모델 확인
print(f"[2] 모델 확인: {OLLAMA_MODEL}")
model_found = False
for model in models:
    if OLLAMA_MODEL in model.get('name', ''):
        model_found = True
        print(f"[OK] 모델 발견: {model.get('name')}")
        break

if not model_found:
    print(f"[WARN] 모델 '{OLLAMA_MODEL}'을 찾을 수 없습니다")
    print(f"  실행: ollama pull {OLLAMA_MODEL}")

print()

# 3. 모델 테스트
print("[3] 모델 테스트...")
try:
    test_response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": "Say hello in one word",
            "stream": False
        },
        timeout=10
    )
    if test_response.status_code == 200:
        result = test_response.json()
        print(f"[OK] 모델 테스트 성공")
        print(f"  응답: {result.get('response', '')[:50]}...")
    else:
        print(f"[ERROR] 모델 테스트 실패: {test_response.status_code}")
except Exception as e:
    print(f"[ERROR] 모델 테스트 실패: {e}")

print()
print("="*60)
print("[OK] Ollama 연결 확인 완료")
print("="*60)
