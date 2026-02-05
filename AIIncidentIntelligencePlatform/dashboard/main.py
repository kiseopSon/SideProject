"""AIOps Dashboard - 포트 9000"""
import os
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx

PORT = int(os.getenv("DASHBOARD_PORT", "9000"))
PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://localhost:9201")

app = FastAPI(title="AIOps Dashboard")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])


@app.get("/api/metrics")
async def get_metrics():
    """Prometheus에서 메트릭 조회"""
    metrics = {}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            queries = [
                ("incidents_active", "sum(incidents_active)"),
                ("llm_requests_total", "sum(llm_requests_total)"),
                ("events_processed_total", "sum(events_processed_total)"),
                ("targets_up", "sum(up)"),
            ]
            for key, query in queries:
                try:
                    r = await client.get(
                        f"{PROMETHEUS_URL}/api/v1/query",
                        params={"query": query}
                    )
                    if r.status_code == 200:
                        data = r.json()
                        if data.get("status") == "success" and data.get("data", {}).get("result"):
                            v = data["data"]["result"][0].get("value", [0, "0"])[1]
                            metrics[key] = float(v) if v else 0
                        else:
                            metrics[key] = 0
                    else:
                        metrics[key] = 0
                except Exception:
                    metrics[key] = 0
    except Exception:
        metrics = {
            "incidents_active": 0,
            "llm_requests_total": 0,
            "events_processed_total": 0,
            "targets_up": 0,
        }
    return metrics


@app.get("/", response_class=HTMLResponse)
async def root():
    return """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIOps Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            min-height: 100vh;
            color: #e2e8f0;
            padding: 24px;
        }
        .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 32px;
            padding-bottom: 16px;
            border-bottom: 1px solid #334155;
        }
        .header h1 {
            font-size: 1.75rem;
            font-weight: 700;
        }
        .header .icon { font-size: 2rem; }
        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }
        .card {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 24px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        .card .label {
            font-size: 0.875rem;
            color: #94a3b8;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .card .value {
            font-size: 2rem;
            font-weight: 700;
            color: #38bdf8;
        }
        .card.incident .value { color: #f87171; }
        .card.llm .value { color: #a78bfa; }
        .card.event .value { color: #34d399; }
        .card.target .value { color: #fbbf24; }
        .chart-container {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            height: 300px;
        }
        .chart-container h3 {
            margin-bottom: 16px;
            font-size: 1rem;
            color: #94a3b8;
        }
        .status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-top: 16px;
        }
        .status.connected { background: #065f46; color: #6ee7b7; }
        .status.disconnected { background: #7f1d1d; color: #fca5a5; }
        .footer {
            margin-top: 24px;
            font-size: 0.75rem;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="header">
        <span class="icon">📊</span>
        <h1>AIOps Dashboard</h1>
    </div>

    <div class="cards">
        <div class="card incident">
            <div class="label">⚠️ 활성 인시던트</div>
            <div class="value" id="incidents">-</div>
            <div class="status disconnected" id="status">연결 중...</div>
        </div>
        <div class="card llm">
            <div class="label">🤖 LLM 요청</div>
            <div class="value" id="llm">-</div>
        </div>
        <div class="card event">
            <div class="label">📨 이벤트 처리</div>
            <div class="value" id="events">-</div>
        </div>
        <div class="card target">
            <div class="label">✅ 모니터링 타겟</div>
            <div class="value" id="targets">-</div>
        </div>
    </div>

    <div class="chart-container">
        <h3>📈 메트릭 추이 (최근 10분)</h3>
        <canvas id="chart"></canvas>
    </div>

    <div class="footer">
        인시던트 모니터링 대시보드 · Prometheus: """ + PROMETHEUS_URL + """ · 10초마다 갱신
    </div>

    <script>
        const ctx = document.getElementById('chart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: '인시던트', data: [], borderColor: '#f87171', tension: 0.3, fill: true },
                    { label: 'LLM 요청', data: [], borderColor: '#a78bfa', tension: 0.3, fill: true },
                    { label: '이벤트', data: [], borderColor: '#34d399', tension: 0.3, fill: true }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#334155' } },
                    x: { grid: { color: '#334155' } }
                }
            }
        });

        let history = { labels: [], incidents: [], llm: [], events: [] };

        async function fetchMetrics() {
            try {
                const r = await fetch('/api/metrics');
                const d = await r.json();
                document.getElementById('incidents').textContent = Math.round(d.incidents_active || 0);
                document.getElementById('llm').textContent = Math.round(d.llm_requests_total || 0);
                document.getElementById('events').textContent = Math.round(d.events_processed_total || 0);
                document.getElementById('targets').textContent = Math.round(d.targets_up || 0);
                document.getElementById('status').textContent = '✓ Prometheus 연결됨';
                document.getElementById('status').className = 'status connected';

                const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                history.labels.push(now);
                history.incidents.push(d.incidents_active || 0);
                history.llm.push(d.llm_requests_total || 0);
                history.events.push(d.events_processed_total || 0);
                if (history.labels.length > 20) {
                    history.labels.shift();
                    history.incidents.shift();
                    history.llm.shift();
                    history.events.shift();
                }
                chart.data.labels = history.labels;
                chart.data.datasets[0].data = history.incidents;
                chart.data.datasets[1].data = history.llm;
                chart.data.datasets[2].data = history.events;
                chart.update('none');
            } catch (e) {
                document.getElementById('status').textContent = '✗ Prometheus 연결 실패';
                document.getElementById('status').className = 'status disconnected';
            }
        }

        fetchMetrics();
        setInterval(fetchMetrics, 10000);
    </script>
</body>
</html>
"""


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
