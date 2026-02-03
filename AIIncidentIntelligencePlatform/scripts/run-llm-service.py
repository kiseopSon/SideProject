# -*- coding: utf-8 -*-
"""
LLM 서비스 직접 실행
"""
import sys
import os
import subprocess

# 프로젝트 루트로 이동
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
llm_layer_path = os.path.join(project_root, 'llm-layer')
os.chdir(llm_layer_path)

# 가상 환경 Python 경로
venv_python = os.path.join(llm_layer_path, 'venv', 'Scripts', 'python.exe')

if not os.path.exists(venv_python):
    print("Creating virtual environment...")
    subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True)

print("Installing dependencies...")
subprocess.run([venv_python, '-m', 'pip', 'install', '--quiet', '-q', '-r', 'requirements.txt'], 
               check=True, capture_output=True)

print("Starting LLM service on http://localhost:8000")
print("Press Ctrl+C to stop")
print()

# 서비스 시작
subprocess.run([venv_python, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'])
