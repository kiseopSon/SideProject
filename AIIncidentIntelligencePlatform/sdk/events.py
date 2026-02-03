"""
Event Models
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel


class IncidentEvent(BaseModel):
    """인시던트 이벤트 모델"""
    id: str
    timestamp: str
    service: str
    level: str
    message: str
    error: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None
