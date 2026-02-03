"""
실제 착용 합성(Virtual Try-On) 백엔드. 로컬 IDM-VTON만 사용 (무료, GPU).
- IDM-VTON: 프로젝트 루트 IDM-VTON/ 또는 IDM_VTON_PATH 환경변수.
- conda env 'idm' Python 직접 사용 (conda run 대신, Windows chcp 오류 회피).
"""
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional


def _idm_python() -> Optional[Path]:
    """idm conda env의 python.exe 경로. IDM_PYTHON > miniconda3 > anaconda3 순."""
    explicit = os.environ.get("IDM_PYTHON", "").strip()
    if explicit and Path(explicit).exists():
        return Path(explicit)
    home = Path(os.environ.get("USERPROFILE", os.path.expanduser("~")))
    bases = [home / "miniconda3", home / "anaconda3"]
    la = os.environ.get("LOCALAPPDATA")
    if la:
        bases.append(Path(la) / "miniconda3")
    for base in bases:
        if not base.exists():
            continue
        cand = base / "envs" / "idm" / "python.exe"
        if cand.exists():
            return cand
    return None


def _idm_root() -> Optional[Path]:
    base = os.environ.get("IDM_VTON_PATH", "").strip()
    if base and Path(base).exists():
        return Path(base)
    # 기본: myDressRoom/IDM-VTON (프로젝트 루트 기준)
    # inference/app/viton_backend.py -> inference -> myDressRoom -> IDM-VTON
    current_file = Path(__file__).resolve()
    candidates = [
        current_file.parents[2] / "IDM-VTON",  # inference/app -> inference -> myDressRoom -> IDM-VTON
        current_file.parents[1].parent / "IDM-VTON",  # inference/app -> inference -> myDressRoom -> IDM-VTON
        Path.cwd() / "IDM-VTON",  # 현재 작업 디렉토리 기준
        Path.cwd().parent / "IDM-VTON",  # inference -> myDressRoom -> IDM-VTON
    ]
    # 절대 경로로 변환하여 중복 제거
    seen = set()
    for candidate in candidates:
        try:
            abs_candidate = candidate.resolve()
            if abs_candidate not in seen and abs_candidate.exists():
                seen.add(abs_candidate)
                if (abs_candidate / "gradio_demo" / "run_tryon_cli.py").exists():
                    return abs_candidate
        except (OSError, ValueError):
            continue
    # 마지막으로 존재만 확인
    for candidate in candidates:
        try:
            abs_candidate = candidate.resolve()
            if abs_candidate.exists():
                return abs_candidate
        except (OSError, ValueError):
            continue
    return None


def run_viton(
    person_bytes: bytes,
    garment_bytes: bytes,
    *,
    category: str = "upper_body",
) -> Optional[bytes]:
    """
    로컬 IDM-VTON 실행 (GPU). human + garment -> 합성 PNG 바이트.
    """
    root = _idm_root()
    if not root:
        return None

    cli = root / "gradio_demo" / "run_tryon_cli.py"
    if not cli.exists():
        return None

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        person_path = tmpdir / "person.png"
        garment_path = tmpdir / "garment.png"
        output_path = tmpdir / "result.png"

        person_path.write_bytes(person_bytes)
        garment_path.write_bytes(garment_bytes)

        py = _idm_python()
        if not py:
            return None
        cmd = [
            str(py),
            str(cli),
            "--human", str(person_path),
            "--garment", str(garment_path),
            "--output", str(output_path),
            "--garment_des", "upper body clothing",
            "--seed", "42",
            "--denoise_steps", "30",
        ]
        try:
            env = os.environ.copy()
            env["CUDA_VISIBLE_DEVICES"] = os.environ.get("CUDA_VISIBLE_DEVICES", "0")
            env.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
            env.setdefault("OMP_NUM_THREADS", "4")
            env.setdefault("MKL_NUM_THREADS", "4")
            r = subprocess.run(
                cmd,
                cwd=str(root),
                capture_output=True,
                timeout=600,
                check=False,
                env=env,
            )
            if r.returncode != 0:
                err_msg = (r.stderr.decode("utf-8", errors="ignore") or "")[:2000]
                print(f"[IDM-VTON] Exit code {r.returncode}", flush=True)
                print(f"[IDM-VTON] stderr:\n{err_msg}", flush=True)
                return None
            if not output_path.exists():
                print(f"[IDM-VTON] Output file not created: {output_path}", flush=True)
                return None
            return output_path.read_bytes()
        except subprocess.TimeoutExpired:
            print("[IDM-VTON] Timeout (600s)", flush=True)
            return None
        except FileNotFoundError as e:
            print(f"[IDM-VTON] FileNotFoundError: {e}", flush=True)
            return None
        except Exception as e:
            print(f"[IDM-VTON] Exception: {type(e).__name__}: {e}", flush=True)
            return None


def is_viton_configured() -> bool:
    r = _idm_root()
    return (
        r is not None
        and (r / "gradio_demo" / "run_tryon_cli.py").exists()
        and _idm_python() is not None
    )
