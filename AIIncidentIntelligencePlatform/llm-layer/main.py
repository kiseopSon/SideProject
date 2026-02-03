"""
LLM Layer - FastAPI 서비스
Incident Classifier, Root Cause Analyzer, Incident Reporter
"""
import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from confluent_kafka import Producer
from confluent_kafka.admin import AdminClient, NewTopic
from confluent_kafka import KafkaException
from openai import OpenAI  # Ollama는 OpenAI 호환 API를 사용
from elasticsearch import Elasticsearch
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import requests
import httpx

# LLM 체이닝 구조 import
from llm_chain import LLMChain
from prompts import CONFIDENCE_THRESHOLD, PROMPT_VERSION

# Prometheus 메트릭 정의
llm_requests_total = Counter(
    'llm_requests_total',
    'Total number of LLM requests',
    ['endpoint', 'status']
)

llm_request_duration = Histogram(
    'llm_request_duration_seconds',
    'Time taken to process LLM requests',
    ['endpoint'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 환경 변수 (Ollama 사용 - 완전 무료!)
# 코딩 전용 모델 사용 (deepseek-coder:6.7b)
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'deepseek-coder:6.7b')
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
KAFKA_REPORT_TOPIC = os.getenv('KAFKA_REPORT_TOPIC', 'incident-reports')
KAFKA_CLASSIFICATION_TOPIC = os.getenv('KAFKA_CLASSIFICATION_TOPIC', 'incident-classifications')
KAFKA_ANALYSIS_TOPIC = os.getenv('KAFKA_ANALYSIS_TOPIC', 'incident-analyses')
ELASTICSEARCH_HOST = os.getenv('ELASTICSEARCH_HOST', 'localhost:9200')

# FastAPI 앱
app = FastAPI(
    title="AI Incident Intelligence Platform - LLM Layer",
    description="인시던트 자동 분류, 근본 원인 분석, 리포트 생성",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LLM 클라이언트 초기화 (Ollama - 완전 무료!)
def create_ollama_client():
    """Ollama 클라이언트 생성 (OpenAI 호환 API 사용)"""
    try:
        # Ollama 서버 확인
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
        if response.status_code == 200:
            logger.info(f"Using Ollama: {OLLAMA_BASE_URL} (model: {OLLAMA_MODEL})")
            # Ollama는 OpenAI 호환 API를 제공하므로 base_url만 변경
            # 환경 변수에서 proxies 관련 설정 제거
            import os
            old_proxies = os.environ.pop('HTTP_PROXY', None)
            old_https_proxies = os.environ.pop('HTTPS_PROXY', None)
            old_no_proxy = os.environ.pop('NO_PROXY', None)
            
            try:
                client = OpenAI(
                    api_key="ollama",  # Ollama는 키가 필요 없지만 필수 필드
                    base_url=f"{OLLAMA_BASE_URL}/v1",
                    timeout=60.0
                )
                return client
            finally:
                # 환경 변수 복원
                if old_proxies:
                    os.environ['HTTP_PROXY'] = old_proxies
                if old_https_proxies:
                    os.environ['HTTPS_PROXY'] = old_https_proxies
                if old_no_proxy:
                    os.environ['NO_PROXY'] = old_no_proxy
        else:
            logger.warning(f"Ollama server not available at {OLLAMA_BASE_URL}")
            return None
    except Exception as e:
        logger.error(f"Ollama connection failed: {e}")
        logger.error("Please ensure Ollama is installed and running:")
        logger.error("  1. Install: https://ollama.com/download")
        logger.error("  2. Run: ollama pull deepseek-coder:6.7b")
        logger.error("  3. Ensure Ollama server is running")
        return None

client = create_ollama_client()

# Kafka Producer
kafka_producer = Producer({'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS})

# 토픽 자동 생성 함수
def ensure_topic_exists(topic_name: str):
    """토픽이 존재하는지 확인하고 없으면 생성"""
    try:
        admin_client = AdminClient({
            'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS
        })
        
        # 기존 토픽 목록 조회
        metadata = admin_client.list_topics(timeout=10)
        if topic_name in metadata.topics:
            logger.debug(f"토픽 '{topic_name}'이 이미 존재합니다.")
            return
        
        # 토픽 생성
        logger.info(f"토픽 '{topic_name}' 생성 중...")
        topic = NewTopic(topic_name, num_partitions=3, replication_factor=1)
        futures = admin_client.create_topics([topic])
        
        # 결과 대기
        for topic_name, future in futures.items():
            try:
                future.result()
                logger.info(f"토픽 '{topic_name}' 생성 완료")
            except KafkaException as e:
                if 'already exists' in str(e) or 'TopicExistsException' in str(e):
                    logger.info(f"토픽 '{topic_name}'이 이미 존재합니다.")
                else:
                    logger.warning(f"토픽 '{topic_name}' 생성 실패: {e}")
    except Exception as e:
        logger.warning(f"토픽 확인/생성 중 오류: {e}")

# 앱 시작 시 토픽 생성
ensure_topic_exists(KAFKA_REPORT_TOPIC)
ensure_topic_exists(KAFKA_CLASSIFICATION_TOPIC)
ensure_topic_exists(KAFKA_ANALYSIS_TOPIC)

# Elasticsearch 클라이언트 (과거 분석 결과 조회용)
es_client = Elasticsearch([f'http://{ELASTICSEARCH_HOST}']) if ELASTICSEARCH_HOST else None

# LLM 체인 초기화
def get_llm_chain():
    """LLM Chain을 런타임에 가져오기 (client가 None이면 재생성 시도)"""
    global client
    if not client:
        logger.warning("Client is None, attempting to recreate...")
        client = create_ollama_client()
    if client:
        return LLMChain(client)
    return None

llm_chain = get_llm_chain()


# Pydantic 모델
class IncidentEvent(BaseModel):
    id: str
    timestamp: str
    service: str
    level: str
    message: str
    error: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None


class ClassificationRequest(BaseModel):
    events: List[IncidentEvent]


class ClassificationResponse(BaseModel):
    incident_id: str
    category: str
    severity: str
    confidence: float
    description: str


class RootCauseAnalysisRequest(BaseModel):
    incident_id: str
    events: List[IncidentEvent]


class RootCauseAnalysisResponse(BaseModel):
    incident_id: str
    root_cause: str
    contributing_factors: List[str]
    confidence: float
    analysis: str


class IncidentReportRequest(BaseModel):
    incident_id: str
    events: List[IncidentEvent]
    classification: Optional[ClassificationResponse] = None
    root_cause: Optional[RootCauseAnalysisResponse] = None


class IncidentReportResponse(BaseModel):
    incident_id: str
    summary: str
    root_cause: str
    impact: str
    recommendations: List[str]
    timeline: List[Dict[str, Any]]
    generated_at: str


class LLMService:
    """LLM 서비스 클래스"""
    
    @staticmethod
    async def classify_incident(events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """인시던트 분류"""
        # client 재확인 (런타임에 다시 생성 시도)
        global client
        if not client:
            logger.warning("Client is None, attempting to recreate...")
            client = create_ollama_client()
        
        if not client:
            # Ollama가 없을 경우 기본 분류
            return {
                'category': 'error',
                'severity': 'medium',
                'confidence': 0.5,
                'description': 'Ollama 서비스가 설정되지 않았습니다. Ollama를 설치하고 실행해주세요.'
            }
        
        # 이벤트 요약
        event_summary = "\n".join([
            f"- [{e.get('level', 'INFO')}] {e.get('service', 'unknown')}: {e.get('message', '')}"
            for e in events[:10]  # 최대 10개만
        ])
        
        prompt = f"""다음 로그 이벤트들을 분석하여 인시던트를 분류해주세요.

이벤트:
{event_summary}

다음 JSON 형식으로 응답해주세요:
{{
    "category": "error|performance|security|availability|other",
    "severity": "critical|high|medium|low",
    "confidence": 0.0-1.0,
    "description": "분류 근거 설명"
}}
"""
        
        try:
            import os
            model_name = os.getenv('OLLAMA_MODEL', 'deepseek-coder:6.7b')
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "당신은 인시던트 분류 전문가입니다. 로그를 분석하여 인시던트를 정확히 분류합니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"인시던트 분류 실패: {e}", exc_info=True)
            return {
                'category': 'unknown',
                'severity': 'medium',
                'confidence': 0.0,
                'description': f'분류 실패: {str(e)}'
            }
    
    @staticmethod
    async def analyze_root_cause(incident_id: str, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """근본 원인 분석"""
        if not client:
            return {
                'root_cause': 'LLM 서비스가 설정되지 않았습니다.',
                'contributing_factors': [],
                'confidence': 0.0,
                'analysis': '근본 원인 분석을 수행할 수 없습니다.'
            }
        
        # 이벤트 상세 정보
        event_details = "\n".join([
            f"- {e.get('timestamp', '')} [{e.get('level', 'INFO')}] {e.get('service', 'unknown')}: {e.get('message', '')}"
            for e in events[:20]
        ])
        
        prompt = f"""다음 인시던트의 근본 원인을 분석해주세요.

인시던트 ID: {incident_id}

이벤트 목록:
{event_details}

다음 JSON 형식으로 응답해주세요:
{{
    "root_cause": "근본 원인 설명",
    "contributing_factors": ["요인1", "요인2"],
    "confidence": 0.0-1.0,
    "analysis": "상세 분석 내용"
}}
"""
        
        try:
            import os
            model_name = os.getenv('OLLAMA_MODEL', 'deepseek-coder:6.7b')
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "당신은 근본 원인 분석 전문가입니다. 로그와 메트릭을 분석하여 문제의 근본 원인을 찾습니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"근본 원인 분석 실패: {e}", exc_info=True)
            return {
                'root_cause': '분석 실패',
                'contributing_factors': [],
                'confidence': 0.0,
                'analysis': f'분석 실패: {str(e)}'
            }
    
    @staticmethod
    async def generate_report(
        incident_id: str,
        events: List[Dict[str, Any]],
        classification: Optional[Dict[str, Any]] = None,
        root_cause: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """인시던트 리포트 생성"""
        if not client:
            return {
                'summary': 'LLM 서비스가 설정되지 않아 리포트를 생성할 수 없습니다.',
                'root_cause': root_cause.get('root_cause', '') if root_cause else '',
                'impact': '영향 분석 불가',
                'recommendations': ['LLM 서비스를 설정해주세요.'],
                'timeline': [],
                'generated_at': datetime.now().isoformat()
            }
        
        classification_text = json.dumps(classification, ensure_ascii=False) if classification else "없음"
        root_cause_text = json.dumps(root_cause, ensure_ascii=False) if root_cause else "없음"
        
        prompt = f"""다음 인시던트에 대한 종합 리포트를 작성해주세요.

인시던트 ID: {incident_id}

분류 정보:
{classification_text}

근본 원인 분석:
{root_cause_text}

다음 JSON 형식으로 응답해주세요:
{{
    "summary": "인시던트 요약 (한 문단)",
    "root_cause": "근본 원인",
    "impact": "영향 범위 및 심각도",
    "recommendations": ["조치 사항 1", "조치 사항 2"],
    "timeline": [{{"time": "시간", "event": "이벤트 설명"}}]
}}
"""
        
        try:
            import os
            model_name = os.getenv('OLLAMA_MODEL', 'deepseek-coder:6.7b')
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "당신은 인시던트 리포트 작성 전문가입니다. 명확하고 실용적인 리포트를 작성합니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result['generated_at'] = datetime.now().isoformat()
            return result
            
        except Exception as e:
            logger.error(f"리포트 생성 실패: {e}", exc_info=True)
            return {
                'summary': '리포트 생성 실패',
                'root_cause': root_cause.get('root_cause', '') if root_cause else '',
                'impact': '영향 분석 실패',
                'recommendations': ['리포트 생성 기능을 확인해주세요.'],
                'timeline': [],
                'generated_at': datetime.now().isoformat()
            }


llm_service = LLMService()


def publish_to_kafka_topic(topic: str, key: str, value: Dict[str, Any]):
    """Kafka로 이벤트 발행 (모든 LLM 결과 저장)"""
    try:
        value_json = json.dumps(value, ensure_ascii=False)
        kafka_producer.produce(topic, key=key, value=value_json)
        kafka_producer.flush(timeout=10)
        logger.info(f"Kafka 발행 완료: {key} → {topic}")
    except Exception as e:
        logger.error(f"Kafka 발행 실패 ({topic}): {e}", exc_info=True)


async def get_past_analysis(service: str, incident_type: str) -> Optional[Dict[str, Any]]:
    """과거 분석 결과 조회 (명세서 6: 동일 인시던트 재발 시 과거 분석 결과 제공)"""
    if not es_client:
        return None
    
    try:
        # Elasticsearch에서 동일 서비스/타입의 최근 분석 결과 조회
        query = {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"service": service}},
                        {"term": {"classification.incident_type": incident_type}}
                    ]
                }
            },
            "sort": [{"timestamp": {"order": "desc"}}],
            "size": 1
        }
        
        response = es_client.search(index="incidents", body=query)
        hits = response.get("hits", {}).get("hits", [])
        
        if hits:
            return hits[0]["_source"]
        return None
    except Exception as e:
        logger.debug(f"과거 분석 결과 조회 실패: {e}")
        return None


@app.get("/")
async def root():
    """헬스 체크"""
    return {
        "service": "LLM Layer",
        "status": "healthy",
        "prompt_version": PROMPT_VERSION,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "endpoints": {
            "chain": "/api/v1/chain (명세서 체이닝 구조)",
            "classify": "/api/v1/classify",
            "analyze": "/api/v1/analyze",
            "report": "/api/v1/report",
            "metrics": "/metrics (Prometheus)"
        }
    }


@app.get("/metrics")
async def metrics():
    """Prometheus 메트릭 엔드포인트"""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.post("/api/v1/classify", response_model=ClassificationResponse)
async def classify_incident(request: ClassificationRequest):
    """인시던트 분류"""
    with llm_request_duration.labels(endpoint='classify').time():
        try:
            # LLM Chain 사용 (명세서에 따른 구조)
            chain = get_llm_chain()
            if not chain:
                raise HTTPException(
                    status_code=503,
                    detail="LLM service not available. Please ensure Ollama is running."
                )
            
            # 이벤트를 로그와 메트릭으로 변환
            service = request.events[0].service if request.events else "unknown"
            logs = [f"[{e.level}] {e.message}" for e in request.events]
            metrics = {}
            
            # LLM Chain의 classify_incident 사용
            classification = await chain.classify_incident(service, logs, metrics)
            
            # 응답 형식 변환
            incident_type = classification.get('incident_type', 'UNKNOWN')
            severity = classification.get('severity', 'MEDIUM')
            confidence = classification.get('confidence', 0.0)
            
            # category 매핑
            category_map = {
                'DATABASE': 'error',
                'NETWORK': 'error',
                'TIMEOUT': 'performance',
                'UNKNOWN': 'other'
            }
            category = category_map.get(incident_type, 'other')
            
            # severity 매핑
            severity_map = {
                'LOW': 'low',
                'MEDIUM': 'medium',
                'HIGH': 'critical'
            }
            severity_lower = severity_map.get(severity, 'medium')
            
            result = ClassificationResponse(
                incident_id=request.events[0].id if request.events else "unknown",
                category=category,
                severity=severity_lower,
                confidence=confidence,
                description=classification.get('error', f"Incident type: {incident_type}, Severity: {severity}")
            )
            llm_requests_total.labels(endpoint='classify', status='success').inc()
            return result
        except HTTPException:
            llm_requests_total.labels(endpoint='classify', status='error').inc()
            raise
        except Exception as e:
            logger.error(f"인시던트 분류 API 오류: {e}", exc_info=True)
            llm_requests_total.labels(endpoint='classify', status='error').inc()
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/analyze", response_model=RootCauseAnalysisResponse)
async def analyze_root_cause(request: RootCauseAnalysisRequest):
    """근본 원인 분석"""
    try:
        events_dict = [event.dict() for event in request.events]
        result = await llm_service.analyze_root_cause(request.incident_id, events_dict)
        
        return RootCauseAnalysisResponse(
            incident_id=request.incident_id,
            root_cause=result.get('root_cause', ''),
            contributing_factors=result.get('contributing_factors', []),
            confidence=result.get('confidence', 0.0),
            analysis=result.get('analysis', '')
        )
    except Exception as e:
        logger.error(f"근본 원인 분석 API 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/report", response_model=IncidentReportResponse)
async def generate_report(request: IncidentReportRequest, background_tasks: BackgroundTasks):
    """인시던트 리포트 생성"""
    try:
        events_dict = [event.dict() for event in request.events]
        classification_dict = request.classification.dict() if request.classification else None
        root_cause_dict = request.root_cause.dict() if request.root_cause else None
        
        result = await llm_service.generate_report(
            request.incident_id,
            events_dict,
            classification_dict,
            root_cause_dict
        )
        
        response = IncidentReportResponse(
            incident_id=request.incident_id,
            summary=result.get('summary', ''),
            root_cause=result.get('root_cause', ''),
            impact=result.get('impact', ''),
            recommendations=result.get('recommendations', []),
            timeline=result.get('timeline', []),
            generated_at=result.get('generated_at', datetime.now().isoformat())
        )
        
        # Kafka로 리포트 발행
        background_tasks.add_task(
            publish_to_kafka_topic,
            KAFKA_REPORT_TOPIC,
            request.incident_id,
            {
                "incident_id": request.incident_id,
                "type": "incident_report",
                "data": response.dict(),
                "timestamp": datetime.now().isoformat()
            }
        )
        
        return response
        
    except Exception as e:
        logger.error(f"리포트 생성 API 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# 새로운 체이닝 API 엔드포인트 추가
class ChainRequest(BaseModel):
    incident_id: str
    service: str
    logs: List[str]
    metrics: Dict[str, Any] = {}
    recent_changes: Optional[List[str]] = None
    start_time: Optional[str] = None
    duration: Optional[str] = None


@app.post("/api/v1/chain")
async def execute_llm_chain(request: ChainRequest, background_tasks: BackgroundTasks):
    """
    LLM 체이닝 실행 (명세서 4)
    Classifier → Analyzer → Reporter → CS Summary
    모든 결과를 Kafka에 저장 (명세서 6)
    """
    chain = get_llm_chain()
    if not chain:
        raise HTTPException(status_code=503, detail="LLM chain not initialized")
    
    try:
        # 과거 분석 결과 조회 (명세서 6)
        past_analysis = await get_past_analysis(request.service, "UNKNOWN")
        
        # 체인 실행
        chain_result = await chain.execute_chain(
            incident_id=request.incident_id,
            service=request.service,
            logs=request.logs,
            metrics=request.metrics,
            recent_changes=request.recent_changes,
            start_time=request.start_time,
            duration=request.duration
        )
        
        # 과거 분석 결과 추가
        if past_analysis:
            chain_result["past_analysis_reference"] = {
                "incident_id": past_analysis.get("incident_id"),
                "timestamp": past_analysis.get("timestamp")
            }
        
        # 모든 결과를 Kafka에 저장 (명세서 6)
        background_tasks.add_task(
            publish_all_results_to_kafka,
            request.incident_id,
            chain_result
        )
        
        return chain_result
        
    except Exception as e:
        logger.error(f"LLM chain execution failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def publish_all_results_to_kafka(incident_id: str, chain_result: Dict[str, Any]):
    """모든 LLM 결과를 Kafka에 저장 (명세서 6)"""
    try:
        # Classification 결과 저장
        if "classification" in chain_result:
            publish_to_kafka_topic(
                KAFKA_CLASSIFICATION_TOPIC,
                incident_id,
                {
                    "incident_id": incident_id,
                    "type": "classification",
                    "data": chain_result["classification"],
                    "timestamp": datetime.now().isoformat()
                }
            )
        
        # Root Cause Analysis 결과 저장
        if "root_cause_analysis" in chain_result:
            publish_to_kafka_topic(
                KAFKA_ANALYSIS_TOPIC,
                incident_id,
                {
                    "incident_id": incident_id,
                    "type": "root_cause_analysis",
                    "data": chain_result["root_cause_analysis"],
                    "timestamp": datetime.now().isoformat()
                }
            )
        
        # Incident Report 저장
        if "incident_report" in chain_result:
            publish_to_kafka_topic(
                KAFKA_REPORT_TOPIC,
                incident_id,
                {
                    "incident_id": incident_id,
                    "type": "incident_report",
                    "data": chain_result["incident_report"],
                    "timestamp": datetime.now().isoformat()
                }
            )
        
        # CS Summary 저장
        if "cs_summary" in chain_result:
            publish_to_kafka_topic(
                KAFKA_REPORT_TOPIC,
                incident_id,
                {
                    "incident_id": incident_id,
                    "type": "cs_summary",
                    "data": chain_result["cs_summary"],
                    "timestamp": datetime.now().isoformat()
                }
            )
        
        logger.info(f"All LLM results published to Kafka for incident: {incident_id}")
        
    except Exception as e:
        logger.error(f"Failed to publish all results to Kafka: {e}", exc_info=True)


if __name__ == "__main__":
    import uvicorn
    # 포트 9092는 Prometheus 메트릭용이지만, FastAPI는 하나의 포트만 사용
    # /metrics 엔드포인트는 포트 8000에서 제공됨
    uvicorn.run(app, host="0.0.0.0", port=8000)
