@echo off
chcp 65001 >nul
cd /d %~dp0

echo EAI Hub 의존성 설치 중...
pip install -r requirements.txt -q

echo EAI Hub 시작 중...
python main.py
pause
