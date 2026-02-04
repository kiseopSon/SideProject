package com.coffeebrewlab.statistics.controller;

import com.coffeebrewlab.common.dto.StatisticsDto;
import com.coffeebrewlab.common.event.ExperimentEvent;
import com.coffeebrewlab.statistics.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final StatisticsService statisticsService;

    @GetMapping(value = "/dashboard", produces = MediaType.TEXT_HTML_VALUE)
    public String getDashboard() {
        log.info("📊 [DASHBOARD] 대시보드 페이지 요청");
        
        StatisticsDto stats = statisticsService.getOverallStatistics();
        // 최근 실험 데이터는 차트용으로만 사용 (표시는 하지 않음)
        List<ExperimentEvent> recentExperiments = statisticsService.getRecentExperiments(10);
        
        return generateHtml(stats, recentExperiments);
    }

    private String generateHtml(StatisticsDto stats, List<ExperimentEvent> recentExperiments) {
        StringBuilder html = new StringBuilder();
        
        html.append("""
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>☕ Coffee Brew Lab - Dashboard</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    html, body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                    }
                    
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                        background-attachment: fixed;
                        min-height: 100vh;
                        color: #e8e8e8;
                        padding: 20px;
                        position: relative;
                    }
                    
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        position: relative;
                        z-index: 1;
                        padding-bottom: 100px;
                    }
                    
                    header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding: 30px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 20px;
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    header h1 {
                        font-size: 2.5rem;
                        color: #f39c12;
                        text-shadow: 0 0 20px rgba(243, 156, 18, 0.5);
                        margin-bottom: 10px;
                    }
                    
                    header p {
                        color: #bbb;
                        font-size: 1.1rem;
                    }
                    
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        margin-bottom: 40px;
                    }
                    
                    .stat-card {
                        background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                        border-radius: 15px;
                        padding: 25px;
                        text-align: center;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        transition: transform 0.3s, box-shadow 0.3s;
                    }
                    
                    .stat-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    }
                    
                    .stat-card .icon {
                        font-size: 2.5rem;
                        margin-bottom: 15px;
                    }
                    
                    .stat-card .value {
                        font-size: 2.5rem;
                        font-weight: bold;
                        color: #f39c12;
                        text-shadow: 0 0 10px rgba(243, 156, 18, 0.3);
                    }
                    
                    .stat-card .label {
                        color: #aaa;
                        margin-top: 10px;
                        font-size: 0.95rem;
                    }
                    
                    .section {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 15px;
                        padding: 25px;
                        margin-bottom: 30px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .section h2 {
                        color: #f39c12;
                        margin-bottom: 20px;
                        font-size: 1.5rem;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .chart-container {
                        display: flex;
                        gap: 20px;
                        flex-wrap: wrap;
                    }
                    
                    .chart-bar {
                        flex: 1;
                        min-width: 200px;
                    }
                    
                    .bar-item {
                        margin-bottom: 15px;
                    }
                    
                    .bar-label {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                        font-size: 0.9rem;
                    }
                    
                    .bar-track {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                        height: 12px;
                        overflow: hidden;
                    }
                    
                    .bar-fill {
                        height: 100%;
                        border-radius: 10px;
                        background: linear-gradient(90deg, #f39c12, #e74c3c);
                        transition: width 0.5s ease;
                    }
                    
                    .recent-list {
                        list-style: none;
                    }
                    
                    .recent-item {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        padding: 15px 20px;
                        margin-bottom: 10px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-left: 4px solid #f39c12;
                        transition: background 0.3s;
                    }
                    
                    .recent-item:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }
                    
                    .recent-item .info {
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                    }
                    
                    .recent-item .bean {
                        font-weight: bold;
                        color: #fff;
                    }
                    
                    .recent-item .details {
                        font-size: 0.85rem;
                        color: #999;
                    }
                    
                    .recent-item .score {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #f39c12;
                    }
                    
                    .empty-state {
                        text-align: center;
                        padding: 40px;
                        color: #666;
                    }
                    
                    .refresh-btn {
                        background: linear-gradient(135deg, #f39c12, #e74c3c);
                        color: white;
                        border: none;
                        padding: 15px 25px;
                        border-radius: 50px;
                        font-size: 1rem;
                        cursor: pointer;
                        box-shadow: 0 5px 20px rgba(243, 156, 18, 0.4);
                        transition: transform 0.3s, box-shadow 0.3s;
                        width: 100%;
                        min-width: 150px;
                    }
                    
                    .refresh-btn:hover {
                        transform: scale(1.05);
                        box-shadow: 0 8px 30px rgba(243, 156, 18, 0.6);
                    }
                    
                    .floating-buttons {
                        position: fixed;
                        bottom: 30px;
                        right: 30px;
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                        z-index: 1000;
                    }
                    
                    .new-experiment-btn {
                        background: linear-gradient(135deg, #2ecc71, #27ae60);
                        color: white;
                        padding: 15px 25px;
                        border-radius: 50px;
                        text-decoration: none;
                        font-size: 1rem;
                        box-shadow: 0 5px 20px rgba(46, 204, 113, 0.4);
                        transition: transform 0.3s, box-shadow 0.3s;
                        display: inline-block;
                        text-align: center;
                        width: 100%;
                        min-width: 150px;
                    }
                    
                    .new-experiment-btn:hover {
                        transform: scale(1.05);
                        box-shadow: 0 8px 30px rgba(46, 204, 113, 0.6);
                    }
                    
                    .timestamp {
                        text-align: center;
                        color: #666;
                        font-size: 0.85rem;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>☕ Coffee Brew Lab</h1>
                        <p>커피 추출 실험 대시보드</p>
                        <div style="margin-top: 20px; display: flex; gap: 15px; justify-content: center;">
                            <a href="search-page" style="color: #f39c12; text-decoration: none; padding: 10px 20px; background: rgba(243, 156, 18, 0.2); border-radius: 8px; border: 1px solid rgba(243, 156, 18, 0.3);">🔍 검색</a>
                            <a href="history-page" style="color: #f39c12; text-decoration: none; padding: 10px 20px; background: rgba(243, 156, 18, 0.2); border-radius: 8px; border: 1px solid rgba(243, 156, 18, 0.3);">📅 히스토리</a>
                        </div>
                    </header>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="icon">🧪</div>
                            <div class="value">""");
        
        // 값들을 미리 포맷팅
        String totalExperiments = String.valueOf(stats.getTotalExperiments() != null ? stats.getTotalExperiments() : 0);
        String averageScore = String.format("%.1f", stats.getAverageTasteScore() != null ? stats.getAverageTasteScore() : 0.0);
        String mostUsedBrewMethod = stats.getMostUsedBrewMethod() != null ? stats.getMostUsedBrewMethod() : "N/A";
        String bestRatedBean = truncate(stats.getBestRatedCoffeeBean() != null ? stats.getBestRatedCoffeeBean() : "N/A", 15);
        
        html.append(totalExperiments);
        html.append("""
                            </div>
                            <div class="label">전체 실험 수</div>
                        </div>
                        <div class="stat-card">
                            <div class="icon">⭐</div>
                            <div class="value">""");
        html.append(averageScore);
        html.append("""
                            </div>
                            <div class="label">평균 맛 점수</div>
                        </div>
                        <div class="stat-card">
                            <div class="icon">☕</div>
                            <div class="value">""");
        html.append(mostUsedBrewMethod);
        html.append("""
                            </div>
                            <div class="label">인기 추출법</div>
                        </div>
                        <div class="stat-card">
                            <div class="icon">🫘</div>
                            <div class="value">""");
        html.append(bestRatedBean);
        html.append("""
                            </div>
                            <div class="label">인기 원두</div>
                        </div>
                    </div>
            """);

        // 추출법별 통계 섹션
        html.append("""
                    <div class="section">
                        <h2>📊 추출법별 실험 현황</h2>
                        <div class="chart-container">
                            <div class="chart-bar" style="width: 100%;">
            """);
        
        if (stats.getAverageScoreByBrewMethod() != null && !stats.getAverageScoreByBrewMethod().isEmpty()) {
            double maxCount = stats.getAverageScoreByBrewMethod().values().stream()
                    .mapToDouble(Double::doubleValue).max().orElse(1);
            
            for (Map.Entry<String, Double> entry : stats.getAverageScoreByBrewMethod().entrySet()) {
                double percentage = (entry.getValue() / maxCount) * 100;
                html.append("""
                                <div class="bar-item">
                                    <div class="bar-label">
                                        <span>""");
                html.append(entry.getKey());
                html.append("</span><span>");
                html.append(String.format("%.0f", entry.getValue()));
                html.append("회</span></div><div class=\"bar-track\"><div class=\"bar-fill\" style=\"width: ");
                html.append(String.format("%.0f", percentage));
                html.append("%;\"></div></div></div>");
            }
        } else {
            html.append("<div class='empty-state'>아직 데이터가 없습니다</div>");
        }
        
        html.append("""
                            </div>
                        </div>
                    </div>
            """);

        // 원두별 통계 섹션
        html.append("""
                    <div class="section">
                        <h2>🫘 원두별 실험 현황</h2>
                        <div class="chart-container">
                            <div class="chart-bar" style="width: 100%;">
            """);
        
        if (stats.getExperimentCountByBean() != null && !stats.getExperimentCountByBean().isEmpty()) {
            long maxCount = stats.getExperimentCountByBean().values().stream()
                    .mapToLong(Long::longValue).max().orElse(1);
            
            for (Map.Entry<String, Long> entry : stats.getExperimentCountByBean().entrySet()) {
                double percentage = ((double) entry.getValue() / maxCount) * 100;
                html.append("""
                                <div class="bar-item">
                                    <div class="bar-label">
                                        <span>""");
                html.append(truncate(entry.getKey(), 30));
                html.append("</span><span>");
                html.append(entry.getValue());
                html.append("회</span></div><div class=\"bar-track\"><div class=\"bar-fill\" style=\"width: ");
                html.append(String.format("%.0f", percentage));
                html.append("%;\"></div></div></div>");
            }
        } else {
            html.append("<div class='empty-state'>아직 데이터가 없습니다</div>");
        }
        
        html.append("""
                            </div>
                        </div>
                    </div>
            """);

        // 맛 분석 차트 섹션 (고도화)
        html.append("""
                    <div class="section taste-analysis-section">
                        <h2 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 30px; font-size: 2rem; text-align: center;">
                            📊 맛 분석 대시보드
                        </h2>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 25px; margin-bottom: 30px;">
                            <div class="chart-card" style="background: linear-gradient(135deg, rgba(243, 156, 18, 0.1) 0%, rgba(231, 76, 60, 0.1) 100%); border: 2px solid rgba(243, 156, 18, 0.3); border-radius: 20px; padding: 25px; box-shadow: 0 10px 30px rgba(243, 156, 18, 0.2); backdrop-filter: blur(10px);">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <h3 style="color: #f39c12; font-size: 1.5rem; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                        <span style="font-size: 2rem;">🔥</span> 뜨거울 때
                                    </h3>
                                    <div id="hotStats" style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-top: 10px;">
                                        <span class="stat-badge" style="background: rgba(243, 156, 18, 0.2); padding: 5px 12px; border-radius: 15px; font-size: 0.85rem; color: #f39c12;"></span>
                                    </div>
                                </div>
                                <canvas id="tasteChartHot" style="max-height: 350px;"></canvas>
                            </div>
                            
                            <div class="chart-card" style="background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(155, 89, 182, 0.1) 100%); border: 2px solid rgba(52, 152, 219, 0.3); border-radius: 20px; padding: 25px; box-shadow: 0 10px 30px rgba(52, 152, 219, 0.2); backdrop-filter: blur(10px);">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <h3 style="color: #3498db; font-size: 1.5rem; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                        <span style="font-size: 2rem;">❄️</span> 식었을 때
                                    </h3>
                                    <div id="coldStats" style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; margin-top: 10px;">
                                        <span class="stat-badge" style="background: rgba(52, 152, 219, 0.2); padding: 5px 12px; border-radius: 15px; font-size: 0.85rem; color: #3498db;"></span>
                                    </div>
                                </div>
                                <canvas id="tasteChartCold" style="max-height: 350px;"></canvas>
                            </div>
                        </div>
                        
                        <div class="chart-card" style="background: linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(39, 174, 96, 0.1) 100%); border: 2px solid rgba(46, 204, 113, 0.3); border-radius: 20px; padding: 30px; box-shadow: 0 10px 30px rgba(46, 204, 113, 0.2); backdrop-filter: blur(10px); margin-top: 25px;">
                            <div style="text-align: center; margin-bottom: 25px;">
                                <h3 style="color: #2ecc71; font-size: 1.5rem; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                    <span style="font-size: 2rem;">📈</span> 맛 변화 추이 분석
                                </h3>
                                <p style="color: #95a5a6; font-size: 0.9rem;">시간에 따른 맛의 변화를 추적합니다</p>
                            </div>
                            <canvas id="tasteTrendChart" style="max-height: 400px;"></canvas>
                        </div>
                    </div>
            """);
        
        // 최근 실험 섹션 제거됨 (차트 데이터용으로만 recentExperiments 사용)
        
        html.append("""
                    <div class="timestamp">
                        마지막 업데이트: """);
        html.append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        html.append("""
                    </div>
                    
                    <div class="floating-buttons">
                        <button class="refresh-btn" onclick="location.reload()">
                            🔄 새로고침
                        </button>
                        <a href="experiment-form" class="new-experiment-btn">
                            ➕ 새 실험 작성
                        </a>
                    </div>
                </div>
                
                <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
                <script>
                    // 최근 실험 데이터에서 맛 정보 추출
                    const recentExperiments = [
            """);
        
        // 최근 실험 데이터를 JavaScript 배열로 변환
        if (recentExperiments != null && !recentExperiments.isEmpty()) {
            boolean first = true;
            for (ExperimentEvent exp : recentExperiments) {
                if (!first) html.append(",");
                first = false;
                html.append("{");
                html.append("coffeeBean: '").append(exp.getCoffeeBean() != null ? escapeJs(exp.getCoffeeBean()) : "Unknown").append("', ");
                html.append("sournessHot: ").append(exp.getSournessHot() != null ? exp.getSournessHot() : "null").append(", ");
                html.append("sweetnessHot: ").append(exp.getSweetnessHot() != null ? exp.getSweetnessHot() : "null").append(", ");
                html.append("bitternessHot: ").append(exp.getBitternessHot() != null ? exp.getBitternessHot() : "null").append(", ");
                html.append("sournessCold: ").append(exp.getSournessCold() != null ? exp.getSournessCold() : "null").append(", ");
                html.append("sweetnessCold: ").append(exp.getSweetnessCold() != null ? exp.getSweetnessCold() : "null").append(", ");
                html.append("bitternessCold: ").append(exp.getBitternessCold() != null ? exp.getBitternessCold() : "null");
                html.append("}");
            }
        }
        
        html.append("""
                    ];
                    
                    // 유효한 맛 데이터가 있는 실험만 필터링
                    const validExperiments = recentExperiments.filter(exp => 
                        exp.sournessHot != null && exp.sweetnessHot != null && exp.bitternessHot != null &&
                        exp.sournessCold != null && exp.sweetnessCold != null && exp.bitternessCold != null
                    );
                    
                    if (validExperiments.length > 0) {
                        // 뜨거울 때 맛 레이더 차트
                        const ctxHot = document.getElementById('tasteChartHot');
                        if (ctxHot) {
                            const avgHot = {
                                sourness: validExperiments.reduce((sum, e) => sum + e.sournessHot, 0) / validExperiments.length,
                                sweetness: validExperiments.reduce((sum, e) => sum + e.sweetnessHot, 0) / validExperiments.length,
                                bitterness: validExperiments.reduce((sum, e) => sum + e.bitternessHot, 0) / validExperiments.length
                            };
                            
                            new Chart(ctxHot, {
                                type: 'radar',
                                data: {
                                    labels: ['신맛', '단맛', '쓴맛'],
                                    datasets: [{
                                        label: '평균',
                                        data: [avgHot.sourness, avgHot.sweetness, avgHot.bitterness],
                                        borderColor: '#f39c12',
                                        backgroundColor: 'rgba(243, 156, 18, 0.2)',
                                        borderWidth: 2
                                    }]
                                },
                                options: {
                                    scales: {
                                        r: {
                                            beginAtZero: true,
                                            max: 10,
                                            ticks: { stepSize: 2 }
                                        }
                                    },
                                    plugins: {
                                        legend: { display: false }
                                    }
                                }
                            });
                        }
                        
                        // 식었을 때 맛 레이더 차트 (고도화)
                        const ctxCold = document.getElementById('tasteChartCold');
                        if (ctxCold) {
                            const avgCold = {
                                sourness: validExperiments.reduce((sum, e) => sum + e.sournessCold, 0) / validExperiments.length,
                                sweetness: validExperiments.reduce((sum, e) => sum + e.sweetnessCold, 0) / validExperiments.length,
                                bitterness: validExperiments.reduce((sum, e) => sum + e.bitternessCold, 0) / validExperiments.length
                            };
                            
                            // 통계 표시
                            const coldStatsEl = document.getElementById('coldStats');
                            if (coldStatsEl) {
                                coldStatsEl.innerHTML = `
                                    <span class="stat-badge" style="background: rgba(231, 76, 60, 0.2); padding: 5px 12px; border-radius: 15px; font-size: 0.85rem; color: #e74c3c;">
                                        신맛: ${avgCold.sourness.toFixed(1)}
                                    </span>
                                    <span class="stat-badge" style="background: rgba(243, 156, 18, 0.2); padding: 5px 12px; border-radius: 15px; font-size: 0.85rem; color: #f39c12;">
                                        단맛: ${avgCold.sweetness.toFixed(1)}
                                    </span>
                                    <span class="stat-badge" style="background: rgba(142, 68, 173, 0.2); padding: 5px 12px; border-radius: 15px; font-size: 0.85rem; color: #8e44ad;">
                                        쓴맛: ${avgCold.bitterness.toFixed(1)}
                                    </span>
                                `;
                            }
                            
                            new Chart(ctxCold, {
                                type: 'radar',
                                data: {
                                    labels: ['신맛', '단맛', '쓴맛'],
                                    datasets: [{
                                        label: '평균',
                                        data: [avgCold.sourness, avgCold.sweetness, avgCold.bitterness],
                                        borderColor: '#3498db',
                                        backgroundColor: 'rgba(52, 152, 219, 0.3)',
                                        borderWidth: 3,
                                        pointBackgroundColor: '#3498db',
                                        pointBorderColor: '#fff',
                                        pointHoverBackgroundColor: '#fff',
                                        pointHoverBorderColor: '#3498db',
                                        pointRadius: 6,
                                        pointHoverRadius: 8
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: true,
                                    animation: {
                                        duration: 2000,
                                        easing: 'easeInOutQuart'
                                    },
                                    scales: {
                                        r: {
                                            beginAtZero: true,
                                            max: 10,
                                            min: 0,
                                            ticks: { 
                                                stepSize: 2,
                                                color: '#95a5a6',
                                                font: { size: 12, weight: 'bold' }
                                            },
                                            grid: {
                                                color: 'rgba(149, 165, 166, 0.2)',
                                                lineWidth: 1
                                            },
                                            pointLabels: {
                                                color: '#ecf0f1',
                                                font: { size: 14, weight: 'bold' }
                                            }
                                        }
                                    },
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            padding: 12,
                                            titleFont: { size: 14, weight: 'bold' },
                                            bodyFont: { size: 13 },
                                            borderColor: '#3498db',
                                            borderWidth: 2,
                                            cornerRadius: 10,
                                            displayColors: false,
                                            callbacks: {
                                                label: function(context) {
                                                    return context.label + ': ' + context.parsed.r.toFixed(1) + ' / 10';
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                        }
                        
                        // 맛 변화 추이 라인 차트 (고도화)
                        const ctxTrend = document.getElementById('tasteTrendChart');
                        if (ctxTrend) {
                            const labels = validExperiments.map((e, i) => '실험 ' + (i + 1));
                            
                            new Chart(ctxTrend, {
                                type: 'line',
                                data: {
                                    labels: labels,
                                    datasets: [
                                        {
                                            label: '신맛(뜨거울 때)',
                                            data: validExperiments.map(e => e.sournessHot),
                                            borderColor: '#e74c3c',
                                            backgroundColor: 'rgba(231, 76, 60, 0.2)',
                                            borderWidth: 3,
                                            fill: true,
                                            tension: 0.5,
                                            pointRadius: 5,
                                            pointHoverRadius: 7,
                                            pointBackgroundColor: '#e74c3c',
                                            pointBorderColor: '#fff',
                                            pointBorderWidth: 2
                                        },
                                        {
                                            label: '신맛(식었을 때)',
                                            data: validExperiments.map(e => e.sournessCold),
                                            borderColor: '#c0392b',
                                            backgroundColor: 'rgba(192, 57, 43, 0.15)',
                                            borderDash: [8, 4],
                                            borderWidth: 3,
                                            fill: true,
                                            tension: 0.5,
                                            pointRadius: 5,
                                            pointHoverRadius: 7,
                                            pointBackgroundColor: '#c0392b',
                                            pointBorderColor: '#fff',
                                            pointBorderWidth: 2
                                        },
                                        {
                                            label: '단맛(뜨거울 때)',
                                            data: validExperiments.map(e => e.sweetnessHot),
                                            borderColor: '#f39c12',
                                            backgroundColor: 'rgba(243, 156, 18, 0.2)',
                                            borderWidth: 3,
                                            fill: true,
                                            tension: 0.5,
                                            pointRadius: 5,
                                            pointHoverRadius: 7,
                                            pointBackgroundColor: '#f39c12',
                                            pointBorderColor: '#fff',
                                            pointBorderWidth: 2
                                        },
                                        {
                                            label: '단맛(식었을 때)',
                                            data: validExperiments.map(e => e.sweetnessCold),
                                            borderColor: '#e67e22',
                                            backgroundColor: 'rgba(230, 126, 34, 0.15)',
                                            borderDash: [8, 4],
                                            borderWidth: 3,
                                            fill: true,
                                            tension: 0.5,
                                            pointRadius: 5,
                                            pointHoverRadius: 7,
                                            pointBackgroundColor: '#e67e22',
                                            pointBorderColor: '#fff',
                                            pointBorderWidth: 2
                                        },
                                        {
                                            label: '쓴맛(뜨거울 때)',
                                            data: validExperiments.map(e => e.bitternessHot),
                                            borderColor: '#8e44ad',
                                            backgroundColor: 'rgba(142, 68, 173, 0.2)',
                                            borderWidth: 3,
                                            fill: true,
                                            tension: 0.5,
                                            pointRadius: 5,
                                            pointHoverRadius: 7,
                                            pointBackgroundColor: '#8e44ad',
                                            pointBorderColor: '#fff',
                                            pointBorderWidth: 2
                                        },
                                        {
                                            label: '쓴맛(식었을 때)',
                                            data: validExperiments.map(e => e.bitternessCold),
                                            borderColor: '#7d3c98',
                                            backgroundColor: 'rgba(125, 60, 152, 0.15)',
                                            borderDash: [8, 4],
                                            borderWidth: 3,
                                            fill: true,
                                            tension: 0.5,
                                            pointRadius: 5,
                                            pointHoverRadius: 7,
                                            pointBackgroundColor: '#7d3c98',
                                            pointBorderColor: '#fff',
                                            pointBorderWidth: 2
                                        }
                                    ]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: true,
                                    animation: {
                                        duration: 2000,
                                        easing: 'easeInOutQuart'
                                    },
                                    interaction: {
                                        mode: 'index',
                                        intersect: false
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: 10,
                                            min: 0,
                                            ticks: { 
                                                stepSize: 2,
                                                color: '#95a5a6',
                                                font: { size: 12, weight: 'bold' }
                                            },
                                            grid: {
                                                color: 'rgba(149, 165, 166, 0.2)',
                                                lineWidth: 1
                                            }
                                        },
                                        x: {
                                            ticks: {
                                                color: '#95a5a6',
                                                font: { size: 12, weight: 'bold' }
                                            },
                                            grid: {
                                                color: 'rgba(149, 165, 166, 0.1)',
                                                lineWidth: 1
                                            }
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: 'bottom',
                                            labels: {
                                                color: '#ecf0f1',
                                                font: { size: 12, weight: 'bold' },
                                                padding: 15,
                                                usePointStyle: true,
                                                pointStyle: 'circle'
                                            }
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            padding: 12,
                                            titleFont: { size: 14, weight: 'bold' },
                                            bodyFont: { size: 13 },
                                            borderColor: '#2ecc71',
                                            borderWidth: 2,
                                            cornerRadius: 10,
                                            displayColors: true,
                                            callbacks: {
                                                label: function(context) {
                                                    return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + ' / 10';
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    } else {
                        // 데이터가 없을 때 메시지 표시
                        document.getElementById('tasteChartHot').parentElement.innerHTML = '<div class="empty-state">맛 데이터가 없습니다</div>';
                        document.getElementById('tasteChartCold').parentElement.innerHTML = '<div class="empty-state">맛 데이터가 없습니다</div>';
                        document.getElementById('tasteTrendChart').parentElement.innerHTML = '<div class="empty-state">맛 데이터가 없습니다</div>';
                    }
                    
                    // 30초마다 자동 새로고침
                    setTimeout(() => location.reload(), 30000);
                </script>
            </body>
            </html>
            """);
        
        return html.toString();
    }
    
    private String truncate(String text, int maxLength) {
        if (text == null) return "N/A";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength - 2) + "..";
    }
    
    private String escapeJs(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("'", "\\'")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r");
    }
}

