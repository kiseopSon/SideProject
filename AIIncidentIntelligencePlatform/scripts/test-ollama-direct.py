# -*- coding: utf-8 -*-
"""
Ollama deepseek-coder:6.7b 모델 직접 테스트
"""
import sys
import io
import requests
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

OLLAMA_BASE_URL = "http://localhost:11434"
MODEL = "deepseek-coder:6.7b"

print("="*60)
print("Ollama deepseek-coder:6.7b 직접 테스트")
print("="*60)
print()

# 테스트 1: 간단한 인사
print("[테스트 1] 간단한 인사")
print("-" * 60)
try:
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": MODEL,
            "prompt": "Say hello in Korean",
            "stream": False
        },
        timeout=30
    )
    response.raise_for_status()
    result = response.json()
    print(f"응답: {result.get('response', '')}")
    print()
except Exception as e:
    print(f"[ERROR] {e}")
    print()

# 테스트 2: 코딩 작업
print("[테스트 2] 코딩 작업 (Python 함수 생성)")
print("-" * 60)
try:
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": MODEL,
            "prompt": "Write a Python function to calculate fibonacci numbers. Return only the code, no explanation.",
            "stream": False
        },
        timeout=60
    )
    response.raise_for_status()
    result = response.json()
    print("생성된 코드:")
    print(result.get('response', ''))
    print()
except Exception as e:
    print(f"[ERROR] {e}")
    print()

# 테스트 3: 인시던트 분류 (실제 사용 케이스)
print("[테스트 3] 인시던트 분류 (실제 사용 케이스)")
print("-" * 60)
test_prompt = """다음 로그를 분석하여 인시던트를 분류해주세요. JSON 형식으로 응답해주세요.

로그:
- [ERROR] database: Connection timeout after 30 seconds
- [ERROR] database: Connection pool exhausted
- [WARN] database: High connection count detected

다음 JSON 형식으로 응답:
{
    "category": "error|performance|security|availability|other",
    "severity": "critical|high|medium|low",
    "confidence": 0.0-1.0,
    "description": "분류 근거 설명"
}"""

try:
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": MODEL,
            "prompt": test_prompt,
            "stream": False,
            "options": {
                "temperature": 0.3
            }
        },
        timeout=60
    )
    response.raise_for_status()
    result = response.json()
    print("분류 결과:")
    print(result.get('response', ''))
    print()
except Exception as e:
    print(f"[ERROR] {e}")
    print()

# 테스트 4: OpenAI 호환 API 테스트
print("[테스트 4] OpenAI 호환 API 테스트")
print("-" * 60)
try:
    from openai import OpenAI
    
    client = OpenAI(
        api_key="ollama",
        base_url=f"{OLLAMA_BASE_URL}/v1"
    )
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "You are a helpful coding assistant."},
            {"role": "user", "content": "Write a simple Python function to add two numbers."}
        ],
        temperature=0.3
    )
    
    print("OpenAI 호환 API 응답:")
    print(response.choices[0].message.content)
    print()
except Exception as e:
    print(f"[ERROR] {e}")
    print()

print("="*60)
print("[OK] 모든 테스트 완료")
print("="*60)
