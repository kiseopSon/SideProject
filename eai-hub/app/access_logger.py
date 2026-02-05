"""대시보드 접속 IP 기록 (개인 자료용)"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# 접속 기록 파일 (프로젝트 루트/data/ - .gitignore에 포함 권장)
ACCESS_LOG_PATH = Path(__file__).resolve().parent.parent / "data" / "dashboard_access.jsonl"


def _get_client_ip(request) -> str:
    """클라이언트 IP 추출 (리버스 프록시 X-Forwarded-For, X-Real-IP 고려)"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    if request.client:
        return request.client.host
    return "unknown"


def log_dashboard_access(request, username: Optional[str] = None):
    """대시보드 접속 기록 (개인 자료용)"""
    try:
        ip = _get_client_ip(request)
        entry = {
            "timestamp": datetime.now().isoformat(),
            "ip": ip,
            "path": str(request.url.path),
            "username": username,
        }
        ACCESS_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(ACCESS_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            f.flush()
    except Exception as e:
        logger.warning(f"대시보드 접속 기록 실패: {e}")
