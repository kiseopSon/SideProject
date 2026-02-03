"""
LLM 프롬프트 정의 및 버전 관리
명세서: AI Incident Report & Automatic Classification System
"""
import json
from typing import Dict, Any

# 프롬프트 버전
PROMPT_VERSION = "v1"

# 신뢰도 임계값
CONFIDENCE_THRESHOLD = 0.7


class PromptTemplates:
    """프롬프트 템플릿 클래스"""
    
    @staticmethod
    def get_classifier_system_prompt() -> str:
        """Incident Classifier System Prompt"""
        return """You are a senior Site Reliability Engineer (SRE).
Your job is to classify incidents based on logs and metrics.
Do not speculate.
If evidence is insufficient, mark the incident type as UNKNOWN.
Always respond in valid JSON."""

    @staticmethod
    def get_classifier_user_prompt(service: str, logs: list, metrics: Dict[str, Any]) -> str:
        """Incident Classifier User Prompt"""
        logs_text = "\n".join([f"- {log}" for log in logs[:20]])
        metrics_text = json.dumps(metrics, ensure_ascii=False) if metrics else "N/A"
        
        return f"""Analyze the following incident data and classify it.

Service: {service}

Logs:
{logs_text}

Metrics:
{metrics_text}

Respond in the following JSON format:
{{
    "incident_type": "DATABASE | NETWORK | TIMEOUT | UNKNOWN",
    "severity": "LOW | MEDIUM | HIGH",
    "confidence": 0.0,
    "needs_root_cause_analysis": true
}}"""

    @staticmethod
    def get_analyzer_system_prompt() -> str:
        """Root Cause Analyzer System Prompt"""
        return """You are an expert SRE analyzing production incidents.
Use only the provided data.
If multiple causes are possible, list them in order of likelihood.
Never invent missing facts."""

    @staticmethod
    def get_analyzer_user_prompt(
        incident_type: str,
        logs: list,
        metrics: Dict[str, Any],
        recent_changes: list = None
    ) -> str:
        """Root Cause Analyzer User Prompt"""
        logs_text = "\n".join([f"- {log}" for log in logs[:30]])
        metrics_text = json.dumps(metrics, ensure_ascii=False) if metrics else "N/A"
        changes_text = "\n".join([f"- {change}" for change in (recent_changes or [])[:10]])
        
        return f"""Analyze the root cause of this incident.

Incident Type: {incident_type}

Logs:
{logs_text}

Metrics:
{metrics_text}

Recent Changes:
{changes_text if changes_text else "None"}

Respond in the following JSON format:
{{
    "suspected_root_causes": [
        {{
            "cause": "string",
            "evidence": ["string"],
            "likelihood": 0.0
        }}
    ],
    "secondary_causes": [
        {{
            "cause": "string",
            "evidence": ["string"],
            "likelihood": 0.0
        }}
    ]
}}"""

    @staticmethod
    def get_reporter_system_prompt() -> str:
        """Incident Reporter System Prompt"""
        return """You are generating an incident report for operations and support teams.
Be concise, factual, and actionable.
Avoid unnecessary technical jargon."""

    @staticmethod
    def get_reporter_user_prompt(
        service: str,
        root_cause: str,
        impact: str,
        start_time: str,
        duration: str,
        recommended_actions: list
    ) -> str:
        """Incident Reporter User Prompt"""
        actions_text = "\n".join([f"- {action}" for action in recommended_actions])
        
        return f"""Generate an incident report for operations teams.

Service: {service}
Root Cause: {root_cause}
Impact: {impact}
Start Time: {start_time}
Duration: {duration}

Recommended Actions:
{actions_text}

Respond in the following JSON format:
{{
    "title": "string",
    "summary": "string",
    "impact_summary": "string",
    "recommended_actions": ["string"],
    "follow_up_required": true
}}"""

    @staticmethod
    def get_cs_summary_system_prompt() -> str:
        """CS Summary Generator System Prompt"""
        return """You are explaining a system incident to customer support agents.
Use simple and clear language.
Do not mention internal system or infrastructure details."""

    @staticmethod
    def get_cs_summary_user_prompt(incident_summary: str, duration: str) -> str:
        """CS Summary Generator User Prompt"""
        return f"""Create a customer-facing message about this incident.

Incident Summary: {incident_summary}
Duration: {duration}

Respond in the following JSON format:
{{
    "customer_message": "string"
}}"""


# JSON 스키마 검증용
SCHEMAS = {
    "classifier": {
        "type": "object",
        "properties": {
            "incident_type": {"type": "string", "enum": ["DATABASE", "NETWORK", "TIMEOUT", "UNKNOWN"]},
            "severity": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH"]},
            "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
            "needs_root_cause_analysis": {"type": "boolean"}
        },
        "required": ["incident_type", "severity", "confidence", "needs_root_cause_analysis"]
    },
    "analyzer": {
        "type": "object",
        "properties": {
            "suspected_root_causes": {"type": "array"},
            "secondary_causes": {"type": "array"}
        },
        "required": ["suspected_root_causes", "secondary_causes"]
    },
    "reporter": {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "summary": {"type": "string"},
            "impact_summary": {"type": "string"},
            "recommended_actions": {"type": "array"},
            "follow_up_required": {"type": "boolean"}
        },
        "required": ["title", "summary", "impact_summary", "recommended_actions", "follow_up_required"]
    },
    "cs_summary": {
        "type": "object",
        "properties": {
            "customer_message": {"type": "string"}
        },
        "required": ["customer_message"]
    }
}
