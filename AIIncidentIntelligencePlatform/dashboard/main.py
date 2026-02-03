"""
AIOps Dashboard - FastAPI 기반 웹 대시보드
인시던트 현황을 실시간으로 확인할 수 있는 대시보드
"""
import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import redis.asyncio as redis

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 환경 변수
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))

# FastAPI 앱
app = FastAPI(
    title="AI Incident Intelligence Platform - Dashboard",
    description="인시던트 실시간 대시보드",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis 연결
redis_client: Optional[redis.Redis] = None


async def get_redis_client():
    """Redis 클라이언트 가져오기 (lazy initialization)"""
    global redis_client
    if redis_client is None:
        try:
            redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                decode_responses=True
            )
            # 연결 테스트
            await redis_client.ping()
            logger.info(f"Redis 연결 완료: {REDIS_HOST}:{REDIS_PORT}")
        except Exception as e:
            logger.error(f"Redis 연결 실패: {e}")
            redis_client = None
    return redis_client


@app.on_event("startup")
async def startup():
    """서비스 시작 시 Redis 연결"""
    await get_redis_client()


@app.on_event("shutdown")
async def shutdown():
    """서비스 종료 시 Redis 연결 종료"""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None
        logger.info("Redis 연결 종료")


@app.get("/", response_class=HTMLResponse)
async def dashboard():
    """대시보드 메인 페이지"""
    html_content = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Incident Intelligence Platform - Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .stat-card .value {
            font-size: 36px;
            font-weight: bold;
            color: #333;
        }
        .stat-card.critical .value { color: #ff0000; }
        .stat-card.high .value { color: #ff8800; }
        .stat-card.medium .value { color: #ffaa00; }
        .stat-card.low .value { color: #00aaff; }
        .incidents {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .incidents h2 {
            color: #333;
            margin-bottom: 20px;
        }
        .incident-item {
            border-left: 4px solid #ddd;
            padding: 20px;
            margin-bottom: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            transition: all 0.3s;
        }
        .incident-item:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transform: translateX(5px);
        }
        .incident-item.critical { border-left-color: #ff0000; }
        .incident-item.high { border-left-color: #ff8800; }
        .incident-item.medium { border-left-color: #ffaa00; }
        .incident-item.low { border-left-color: #00aaff; }
        .incident-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .incident-id {
            font-weight: bold;
            color: #333;
            font-size: 18px;
        }
        .severity-badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .severity-badge.critical { background: #ff0000; color: white; }
        .severity-badge.high { background: #ff8800; color: white; }
        .severity-badge.medium { background: #ffaa00; color: white; }
        .severity-badge.low { background: #00aaff; color: white; }
        .incident-summary {
            color: #666;
            margin: 10px 0;
            line-height: 1.6;
        }
        .incident-time {
            color: #999;
            font-size: 12px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 20px;
        }
        .refresh-btn:hover {
            background: #5568d3;
        }
        .auto-refresh {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
        }
        .auto-refresh label {
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 AI Incident Intelligence Platform</h1>
            <p>실시간 인시던트 모니터링 대시보드</p>
        </div>
        
        <div class="stats" id="stats">
            <div class="stat-card critical">
                <h3>Critical</h3>
                <div class="value" id="stat-critical">0</div>
            </div>
            <div class="stat-card high">
                <h3>High</h3>
                <div class="value" id="stat-high">0</div>
            </div>
            <div class="stat-card medium">
                <h3>Medium</h3>
                <div class="value" id="stat-medium">0</div>
            </div>
            <div class="stat-card low">
                <h3>Low</h3>
                <div class="value" id="stat-low">0</div>
            </div>
        </div>
        
        <div class="incidents">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>최근 인시던트</h2>
                <div class="auto-refresh">
                    <button class="refresh-btn" onclick="loadData()">🔄 새로고침</button>
                    <label>
                        <input type="checkbox" id="autoRefresh" checked>
                        자동 새로고침 (5초)
                    </label>
                </div>
            </div>
            <div id="incidents-list" class="loading">로딩 중...</div>
        </div>
    </div>
    
    <script>
        console.log('[Dashboard] JavaScript 로드 시작');
        let autoRefreshInterval = null;
        let isInitialized = false;  // 중복 초기화 방지
        
        async function loadData() {
            try {
                console.log('데이터 로드 시작...');
                
                // 통계 로드
                const response = await fetch('/api/stats');
                if (!response.ok) {
                    throw new Error(`통계 API 오류: HTTP ${response.status}`);
                }
                const stats = await response.json();
                console.log('통계 로드 완료:', stats);
                
                // 통계 업데이트
                const statCritical = document.getElementById('stat-critical');
                const statHigh = document.getElementById('stat-high');
                const statMedium = document.getElementById('stat-medium');
                const statLow = document.getElementById('stat-low');
                
                if (statCritical) statCritical.textContent = stats.severity?.critical || 0;
                if (statHigh) statHigh.textContent = stats.severity?.high || 0;
                if (statMedium) statMedium.textContent = stats.severity?.medium || 0;
                if (statLow) statLow.textContent = stats.severity?.low || 0;
                
                // 인시던트 목록 로드
                const incidentsResponse = await fetch('/api/incidents?limit=20');
                if (!incidentsResponse.ok) {
                    throw new Error(`인시던트 API 오류: HTTP ${incidentsResponse.status}`);
                }
                const incidents = await incidentsResponse.json();
                console.log('인시던트 로드 완료:', incidents.length, '개');
                
                const incidentsList = document.getElementById('incidents-list');
                if (!incidentsList) {
                    console.error('incidents-list 요소를 찾을 수 없습니다.');
                    return;
                }
                
                if (incidents.length === 0) {
                    incidentsList.innerHTML = '<div class="loading">인시던트가 없습니다.<br><small>테스트 리포트를 전송하려면: python scripts/test-notification.py</small></div>';
                    return;
                }
                
                incidentsList.innerHTML = incidents.map(incident => {
                    const severity = (incident.severity || 'medium').toLowerCase();
                    const time = new Date(incident.generated_at || incident.timestamp).toLocaleString('ko-KR');
                    return `
                        <div class="incident-item ${severity}">
                            <div class="incident-header">
                                <div class="incident-id">${incident.incident_id || incident.id || 'Unknown'}</div>
                                <span class="severity-badge ${severity}">${severity.toUpperCase()}</span>
                            </div>
                            <div class="incident-summary">${incident.summary || incident.message || '요약 없음'}</div>
                            <div class="incident-time">${time}</div>
                        </div>
                    `;
                }).join('');
            } catch (error) {
                console.error('데이터 로드 실패:', error);
                const incidentsList = document.getElementById('incidents-list');
                if (incidentsList) {
                    incidentsList.innerHTML = 
                        `<div class="loading" style="color: #ff0000;">
                            데이터를 불러올 수 없습니다.<br>
                            오류: ${error.message || '알 수 없는 오류'}<br>
                            <small>브라우저 콘솔(F12)에서 상세 오류를 확인하세요.</small>
                        </div>`;
                }
            }
        }
        
        function toggleAutoRefresh() {
            const checkbox = document.getElementById('autoRefresh');
            console.log('[Dashboard] 자동 새로고침 토글:', checkbox.checked);
            
            // 기존 인터벌 정리
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
                console.log('[Dashboard] 자동 새로고침 중지됨');
            }
            
            // 체크박스가 체크되어 있으면 새로 시작
            if (checkbox.checked) {
                autoRefreshInterval = setInterval(function() {
                    console.log('[Dashboard] 자동 새로고침 실행');
                    loadData();
                }, 5000);
                console.log('[Dashboard] 자동 새로고침 시작됨 (5초 간격)');
            }
        }
        
        // 초기 로드 및 자동 새로고침 시작
        console.log('[Dashboard] 초기화 시작, readyState:', document.readyState);
        
        function initDashboard() {
            // 중복 초기화 방지
            if (isInitialized) {
                console.log('[Dashboard] 이미 초기화됨, 스킵');
                return;
            }
            
            console.log('[Dashboard] initDashboard 실행');
            isInitialized = true;
            
            // 초기 데이터 로드
            loadData();
            
            // 체크박스 상태에 따라 자동 새로고침 시작
            const autoRefreshCheckbox = document.getElementById('autoRefresh');
            if (autoRefreshCheckbox) {
                // 체크박스 상태 변경 이벤트 리스너 등록
                autoRefreshCheckbox.addEventListener('change', toggleAutoRefresh);
                
                // 초기 상태 확인
                if (autoRefreshCheckbox.checked) {
                    toggleAutoRefresh();
                }
            }
        }
        
        // 페이지 로드 완료 후 한 번만 실행
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            console.log('[Dashboard] 즉시 실행');
            setTimeout(initDashboard, 100);
        } else {
            console.log('[Dashboard] DOMContentLoaded 대기');
            document.addEventListener('DOMContentLoaded', function() {
                console.log('[Dashboard] DOMContentLoaded 발생');
                setTimeout(initDashboard, 100);
            });
        }
    </script>
</body>
</html>
    """
    return HTMLResponse(content=html_content)


@app.get("/api/stats")
async def get_stats():
    """인시던트 통계 조회"""
    try:
        client = await get_redis_client()
        if not client:
            # Redis 연결 실패 시 빈 통계 반환
            return {
                'total_incidents': 0,
                'total_services': 0,
                'severity': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
            }
        
        # 서비스별 카운트 조회
        keys = await client.keys('service:*:count')
        severity_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        
        # 최근 인시던트에서 심각도 추출
        recent_incidents = await client.lrange('incidents:recent', 0, 999)
        for incident_json in recent_incidents:
            try:
                incident = json.loads(incident_json)
                severity = (incident.get('severity', 'medium') or 'medium').lower()
                if severity in severity_counts:
                    severity_counts[severity] += 1
            except:
                continue
        
        total_incidents = len(recent_incidents)
        total_services = len(keys)
        
        return {
            'total_incidents': total_incidents,
            'total_services': total_services,
            'severity': severity_counts
        }
    except Exception as e:
        logger.error(f"통계 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/incidents")
async def get_incidents(limit: int = 20, severity: Optional[str] = None):
    """최근 인시던트 목록 조회"""
    try:
        client = await get_redis_client()
        if not client:
            # Redis 연결 실패 시 빈 목록 반환
            return []
        
        # 최근 인시던트 조회
        recent_incidents = await client.lrange('incidents:recent', 0, limit - 1)
        
        incidents = []
        for incident_json in recent_incidents:
            try:
                incident = json.loads(incident_json)
                
                # 심각도 필터링
                if severity and incident.get('severity', '').lower() != severity.lower():
                    continue
                
                incidents.append(incident)
            except Exception as e:
                logger.debug(f"인시던트 파싱 실패: {e}")
                continue
        
        # 생성 시간 기준 정렬 (최신순)
        incidents.sort(key=lambda x: x.get('generated_at', x.get('timestamp', '')), reverse=True)
        
        return incidents[:limit]
    except Exception as e:
        logger.error(f"인시던트 목록 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/incidents/{incident_id}")
async def get_incident_detail(incident_id: str):
    """인시던트 상세 정보 조회"""
    try:
        client = await get_redis_client()
        if not client:
            raise HTTPException(status_code=503, detail="Redis 연결이 없습니다")
        
        # Redis에서 인시던트 상세 정보 조회
        incident_json = await client.get(f'incident:{incident_id}')
        
        if not incident_json:
            raise HTTPException(status_code=404, detail="인시던트를 찾을 수 없습니다")
        
        incident = json.loads(incident_json)
        return incident
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"인시던트 상세 조회 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
