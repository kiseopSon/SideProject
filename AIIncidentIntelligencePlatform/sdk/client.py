"""
Python SDK Client
"""
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource

from .events import IncidentEvent

logger = logging.getLogger(__name__)


class IncidentClient:
    """인시던트 클라이언트"""
    
    def __init__(
        self,
        service_name: str,
        otlp_endpoint: str = "http://localhost:4318/v1/traces",
        api_key: Optional[str] = None
    ):
        self.service_name = service_name
        self.otlp_endpoint = otlp_endpoint
        
        # OpenTelemetry 설정
        resource = Resource.create({
            "service.name": service_name
        })
        
        provider = TracerProvider(resource=resource)
        processor = BatchSpanProcessor(
            OTLPSpanExporter(endpoint=otlp_endpoint)
        )
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)
        
        self.tracer = trace.get_tracer(__name__)
        logger.info(f"IncidentClient 초기화: {service_name}")
    
    def log_event(
        self,
        level: str,
        message: str,
        error: Optional[Dict[str, Any]] = None,
        metrics: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        """이벤트 로깅"""
        event = IncidentEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.now().isoformat(),
            service=self.service_name,
            level=level,
            message=message,
            error=error,
            metrics=metrics,
            context=context
        )
        
        # OpenTelemetry Span 생성
        with self.tracer.start_as_current_span("incident.event") as span:
            span.set_attribute("event.id", event.id)
            span.set_attribute("event.level", event.level)
            span.set_attribute("event.message", event.message)
            span.set_attribute("service.name", self.service_name)
            
            if error:
                span.set_attribute("error.type", error.get('type', ''))
                span.set_attribute("error.message", error.get('message', ''))
                span.record_exception(Exception(error.get('message', '')))
            
            if metrics:
                for key, value in metrics.items():
                    span.set_attribute(f"metric.{key}", value)
        
        logger.info(f"[{level}] {message}")
        return event
    
    def log_error(
        self,
        message: str,
        error: Exception,
        context: Optional[Dict[str, Any]] = None
    ):
        """에러 로깅"""
        error_dict = {
            "type": type(error).__name__,
            "message": str(error),
            "traceback": str(error.__traceback__) if hasattr(error, '__traceback__') else None
        }
        return self.log_event(
            level="ERROR",
            message=message,
            error=error_dict,
            context=context
        )
    
    def log_metric(
        self,
        name: str,
        value: float,
        tags: Optional[Dict[str, str]] = None
    ):
        """메트릭 로깅"""
        metrics = {name: value}
        if tags:
            metrics.update(tags)
        return self.log_event(
            level="INFO",
            message=f"Metric: {name}={value}",
            metrics=metrics
        )
