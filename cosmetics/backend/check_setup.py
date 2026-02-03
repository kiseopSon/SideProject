"""
백엔드 설정 확인 스크립트
"""
import sys
import os

print("=" * 50)
print("백엔드 설정 확인")
print("=" * 50)

# Python 버전
print(f"\n1. Python 버전: {sys.version}")

# Python 실행 경로
print(f"2. Python 실행 경로: {sys.executable}")

# 현재 디렉토리
print(f"3. 현재 디렉토리: {os.getcwd()}")

# 필수 패키지 확인
print("\n4. 필수 패키지 확인:")
required_packages = [
    'fastapi',
    'uvicorn',
    'pydantic',
    'sqlalchemy',
    'requests',
    'beautifulsoup4',
    'lxml'
]

missing_packages = []
for package in required_packages:
    try:
        __import__(package)
        print(f"   ✅ {package}")
    except ImportError:
        print(f"   ❌ {package} (설치 필요)")
        missing_packages.append(package)

# main.py 파일 확인
print("\n5. main.py 파일 확인:")
main_py_path = os.path.join(os.getcwd(), 'main.py')
if os.path.exists(main_py_path):
    print(f"   ✅ main.py 파일 존재: {main_py_path}")
else:
    print(f"   ❌ main.py 파일 없음: {main_py_path}")

# 요약
print("\n" + "=" * 50)
if missing_packages:
    print("⚠️  설치 필요한 패키지:")
    for pkg in missing_packages:
        print(f"   - {pkg}")
    print("\n설치 명령어:")
    print("   pip install -r requirements.txt")
else:
    print("✅ 모든 패키지가 설치되어 있습니다!")
print("=" * 50)
