"""Inference 서버. 가상환경 없이 py run.py 해도 .venv Python으로 자동 실행."""
from __future__ import annotations

import os
import sys
from pathlib import Path

_DIR = Path(__file__).resolve().parent
_VENV_PY = _DIR / ".venv" / "Scripts" / "python.exe"


def _ensure_venv_and_reexec() -> None:
    if _VENV_PY.exists():
        os.execv(str(_VENV_PY), [str(_VENV_PY), str(__file__)] + sys.argv[1:])
        return
    print("오류: .venv가 없습니다. 아래 실행 후 다시 시도하세요.", file=sys.stderr)
    print("  python -m venv .venv", file=sys.stderr)
    print("  .venv\\Scripts\\pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    try:
        import uvicorn
    except ModuleNotFoundError:
        _ensure_venv_and_reexec()

    print("\n  >> 브라우저에서 접속: http://localhost:8000\n")
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
    )
