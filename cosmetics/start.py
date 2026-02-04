"""
Script to run both frontend and backend simultaneously
"""
import subprocess
import sys
import os
from pathlib import Path

def main():
    project_root = Path(__file__).parent
    
    # Backend directory
    backend_dir = project_root / "backend"
    # Frontend directory
    frontend_dir = project_root / "frontend"
    
    # Backend command
    # 가상환경이 있으면 가상환경의 Python 사용 시도
    venv_python = backend_dir / "venv" / "Scripts" / "python.exe"  # Windows
    if not venv_python.exists():
        venv_python = backend_dir / "venv" / "bin" / "python"  # Linux/Mac
    
    python_exec = str(venv_python) if venv_python.exists() else sys.executable
    
    backend_cmd = [
        python_exec, "-m", "uvicorn",
        "main:app",
        "--reload",
        "--host", "127.0.0.1",
        "--port", "8500"
    ]
    
    # Frontend command
    frontend_cmd = ["npm", "run", "dev"]
    
    try:
        print("Starting servers...")
        print("Backend: http://localhost:8500")
        print("Frontend: http://localhost:9005 (or other port)")
        print("=" * 50)
        print("Press Ctrl+C to stop")
        print("=" * 50)
        
        # Start backend process
        backend_process = subprocess.Popen(
            backend_cmd,
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Start frontend process
        frontend_process = subprocess.Popen(
            frontend_cmd,
            cwd=frontend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # 출력 실시간 표시
        def print_output(process, prefix):
            for line in iter(process.stdout.readline, ''):
                if line:
                    print(f"[{prefix}] {line}", end='')
        
        import threading
        
        backend_thread = threading.Thread(
            target=print_output,
            args=(backend_process, "BACKEND"),
            daemon=True
        )
        frontend_thread = threading.Thread(
            target=print_output,
            args=(frontend_process, "FRONTEND"),
            daemon=True
        )
        
        backend_thread.start()
        frontend_thread.start()
        
        # 프로세스가 실행 중인지 확인
        backend_process.wait()
        frontend_process.wait()
        
    except KeyboardInterrupt:
        print("\n\nStopping servers...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("Servers stopped.")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        if 'backend_process' in locals():
            backend_process.terminate()
        if 'frontend_process' in locals():
            frontend_process.terminate()
        sys.exit(1)

if __name__ == "__main__":
    main()
