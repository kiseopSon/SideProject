"""
LLM 체이닝 구조 구현
명세서에 따른 체인: Classifier → Analyzer → Reporter → CS Summary
"""
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from openai import OpenAI

from prompts import (
    PromptTemplates,
    PROMPT_VERSION,
    CONFIDENCE_THRESHOLD,
    SCHEMAS
)

logger = logging.getLogger(__name__)


class LLMChain:
    """LLM 체이닝 구조"""
    
    def __init__(self, client: OpenAI):
        self.client = client
        self.prompts = PromptTemplates()
    
    async def classify_incident(
        self,
        service: str,
        logs: List[str],
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Incident Classifier
        명세서 5.1에 따른 분류
        """
        if not self.client:
            return {
                "incident_type": "UNKNOWN",
                "severity": "MEDIUM",
                "confidence": 0.0,
                "needs_root_cause_analysis": False,
                "error": "LLM client not initialized"
            }
        
        try:
            system_prompt = self.prompts.get_classifier_system_prompt()
            user_prompt = self.prompts.get_classifier_user_prompt(service, logs, metrics)
            
            # Ollama 모델 사용 (완전 무료!)
            import os
            model_name = os.getenv('OLLAMA_MODEL', 'deepseek-coder:6.7b')
            
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result["prompt_version"] = PROMPT_VERSION
            result["timestamp"] = datetime.now().isoformat()
            
            # 신뢰도 검증
            confidence = result.get("confidence", 0.0)
            if confidence < CONFIDENCE_THRESHOLD:
                logger.warning(
                    f"Classification confidence too low: {confidence} < {CONFIDENCE_THRESHOLD}. "
                    "Marking as UNKNOWN."
                )
                result["incident_type"] = "UNKNOWN"
                result["needs_root_cause_analysis"] = False
            
            return result
            
        except Exception as e:
            logger.error(f"Incident classification failed: {e}", exc_info=True)
            return {
                "incident_type": "UNKNOWN",
                "severity": "MEDIUM",
                "confidence": 0.0,
                "needs_root_cause_analysis": False,
                "error": str(e)
            }
    
    async def analyze_root_cause(
        self,
        incident_type: str,
        logs: List[str],
        metrics: Dict[str, Any],
        recent_changes: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Root Cause Analyzer
        명세서 5.2에 따른 분석
        """
        if not self.client:
            return {
                "suspected_root_causes": [],
                "secondary_causes": [],
                "error": "LLM client not initialized"
            }
        
        try:
            system_prompt = self.prompts.get_analyzer_system_prompt()
            user_prompt = self.prompts.get_analyzer_user_prompt(
                incident_type, logs, metrics, recent_changes
            )
            
            # Ollama 모델 사용 (완전 무료!)
            import os
            model_name = os.getenv('OLLAMA_MODEL', 'deepseek-coder:6.7b')
            
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result["prompt_version"] = PROMPT_VERSION
            result["timestamp"] = datetime.now().isoformat()
            
            return result
            
        except Exception as e:
            logger.error(f"Root cause analysis failed: {e}", exc_info=True)
            return {
                "suspected_root_causes": [],
                "secondary_causes": [],
                "error": str(e)
            }
    
    async def generate_incident_report(
        self,
        service: str,
        root_cause: str,
        impact: str,
        start_time: str,
        duration: str,
        recommended_actions: List[str]
    ) -> Dict[str, Any]:
        """
        Incident Reporter (운영팀용)
        명세서 5.3에 따른 리포트 생성
        """
        if not self.client:
            return {
                "title": "Report generation failed",
                "summary": "LLM client not initialized",
                "impact_summary": impact,
                "recommended_actions": recommended_actions,
                "follow_up_required": True,
                "error": "LLM client not initialized"
            }
        
        try:
            system_prompt = self.prompts.get_reporter_system_prompt()
            user_prompt = self.prompts.get_reporter_user_prompt(
                service, root_cause, impact, start_time, duration, recommended_actions
            )
            
            # Ollama 모델 사용 (완전 무료!)
            import os
            model_name = os.getenv('OLLAMA_MODEL', 'deepseek-coder:6.7b')
            
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result["prompt_version"] = PROMPT_VERSION
            result["generated_at"] = datetime.now().isoformat()
            
            return result
            
        except Exception as e:
            logger.error(f"Incident report generation failed: {e}", exc_info=True)
            return {
                "title": "Report generation failed",
                "summary": f"Error: {str(e)}",
                "impact_summary": impact,
                "recommended_actions": recommended_actions,
                "follow_up_required": True,
                "error": str(e)
            }
    
    async def generate_cs_summary(
        self,
        incident_summary: str,
        duration: str
    ) -> Dict[str, Any]:
        """
        CS Summary Generator (비기술자용)
        명세서 5.4에 따른 요약 생성
        """
        if not self.client:
            return {
                "customer_message": "We are currently experiencing technical difficulties. "
                                  "Our team is working to resolve this issue. "
                                  "We apologize for any inconvenience.",
                "error": "LLM client not initialized"
            }
        
        try:
            system_prompt = self.prompts.get_cs_summary_system_prompt()
            user_prompt = self.prompts.get_cs_summary_user_prompt(incident_summary, duration)
            
            # Ollama 모델 사용 (완전 무료!)
            import os
            model_name = os.getenv('OLLAMA_MODEL', 'deepseek-coder:6.7b')
            
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result["prompt_version"] = PROMPT_VERSION
            result["generated_at"] = datetime.now().isoformat()
            
            return result
            
        except Exception as e:
            logger.error(f"CS summary generation failed: {e}", exc_info=True)
            return {
                "customer_message": "We are currently experiencing technical difficulties. "
                                  "Our team is working to resolve this issue. "
                                  "We apologize for any inconvenience.",
                "error": str(e)
            }
    
    async def execute_chain(
        self,
        incident_id: str,
        service: str,
        logs: List[str],
        metrics: Dict[str, Any],
        recent_changes: Optional[List[str]] = None,
        start_time: Optional[str] = None,
        duration: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        전체 체인 실행
        Classifier → Analyzer → Reporter → CS Summary
        """
        chain_result = {
            "incident_id": incident_id,
            "chain_started_at": datetime.now().isoformat(),
            "prompt_version": PROMPT_VERSION
        }
        
        # Step 1: Classification
        logger.info(f"[{incident_id}] Step 1: Classifying incident...")
        classification = await self.classify_incident(service, logs, metrics)
        chain_result["classification"] = classification
        
        # 신뢰도 체크: confidence < 0.7이면 중단
        confidence = classification.get("confidence", 0.0)
        if confidence < CONFIDENCE_THRESHOLD:
            logger.warning(
                f"[{incident_id}] Classification confidence too low ({confidence} < {CONFIDENCE_THRESHOLD}). "
                "Stopping chain execution."
            )
            chain_result["chain_stopped"] = True
            chain_result["chain_stopped_reason"] = f"Low confidence: {confidence} < {CONFIDENCE_THRESHOLD}"
            chain_result["chain_completed_at"] = datetime.now().isoformat()
            return chain_result
        
        # needs_root_cause_analysis 체크
        if not classification.get("needs_root_cause_analysis", False):
            logger.info(f"[{incident_id}] Root cause analysis not needed. Skipping...")
            chain_result["chain_stopped"] = True
            chain_result["chain_stopped_reason"] = "Root cause analysis not needed"
            chain_result["chain_completed_at"] = datetime.now().isoformat()
            return chain_result
        
        # Step 2: Root Cause Analysis
        logger.info(f"[{incident_id}] Step 2: Analyzing root cause...")
        incident_type = classification.get("incident_type", "UNKNOWN")
        root_cause_analysis = await self.analyze_root_cause(
            incident_type, logs, metrics, recent_changes
        )
        chain_result["root_cause_analysis"] = root_cause_analysis
        
        # 주요 원인 추출
        suspected_causes = root_cause_analysis.get("suspected_root_causes", [])
        primary_root_cause = suspected_causes[0].get("cause", "Unknown") if suspected_causes else "Unknown"
        
        # Step 3: Incident Report
        logger.info(f"[{incident_id}] Step 3: Generating incident report...")
        impact = f"Severity: {classification.get('severity', 'MEDIUM')}"
        recommended_actions = [
            cause.get("cause", "") for cause in suspected_causes[:3]
        ]
        
        report = await self.generate_incident_report(
            service=service,
            root_cause=primary_root_cause,
            impact=impact,
            start_time=start_time or datetime.now().isoformat(),
            duration=duration or "Unknown",
            recommended_actions=recommended_actions
        )
        chain_result["incident_report"] = report
        
        # Step 4: CS Summary
        logger.info(f"[{incident_id}] Step 4: Generating CS summary...")
        incident_summary = report.get("summary", "Incident occurred")
        cs_summary = await self.generate_cs_summary(incident_summary, duration or "Unknown")
        chain_result["cs_summary"] = cs_summary
        
        chain_result["chain_completed_at"] = datetime.now().isoformat()
        chain_result["chain_stopped"] = False
        
        logger.info(f"[{incident_id}] Chain execution completed successfully")
        
        return chain_result
