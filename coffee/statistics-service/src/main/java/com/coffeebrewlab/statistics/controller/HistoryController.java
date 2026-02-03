package com.coffeebrewlab.statistics.controller;

import com.coffeebrewlab.statistics.document.ExperimentSearchDocument;
import com.coffeebrewlab.statistics.service.SearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequiredArgsConstructor
public class HistoryController {

    private final SearchService searchService;

    @GetMapping(value = "/history-page", produces = MediaType.TEXT_HTML_VALUE)
    public String getHistoryPage() {
        log.info("📅 [HISTORY] 히스토리 페이지 요청");
        return generateHistoryPageHtml();
    }


    private String generateHistoryPageHtml() {
        return """
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>☕ Coffee Brew Lab - 실험 히스토리</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                        min-height: 100vh;
                        color: #e8e8e8;
                        padding: 20px;
                    }
                    
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    
                    header {
                        text-align: center;
                        margin-bottom: 30px;
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
                    
                    .history-container {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 20px;
                        padding: 30px;
                        margin-bottom: 30px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .date-selector {
                        display: flex;
                        gap: 15px;
                        margin-bottom: 30px;
                        align-items: center;
                    }
                    
                    .date-selector input,
                    .date-selector select {
                        padding: 12px 15px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 10px;
                        color: #fff;
                        font-size: 1rem;
                    }
                    
                    .date-selector select {
                        cursor: pointer;
                        appearance: none;
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f39c12' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                        background-repeat: no-repeat;
                        background-position: right 15px center;
                        padding-right: 40px;
                    }
                    
                    .date-selector select option {
                        background: #1a1a2e !important;
                        color: #fff !important;
                        padding: 10px;
                    }
                    
                    .date-selector button {
                        padding: 12px 25px;
                        background: linear-gradient(135deg, #f39c12, #e74c3c);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: bold;
                        cursor: pointer;
                    }
                    
                    .stats-summary {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .stat-card {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        padding: 20px;
                        text-align: center;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .stat-card .value {
                        font-size: 2rem;
                        font-weight: bold;
                        color: #f39c12;
                        margin-bottom: 5px;
                    }
                    
                    .stat-card .label {
                        color: #bbb;
                        font-size: 0.9rem;
                    }
                    
                    .timeline {
                        position: relative;
                        padding-left: 30px;
                    }
                    
                    .timeline::before {
                        content: '';
                        position: absolute;
                        left: 10px;
                        top: 0;
                        bottom: 0;
                        width: 2px;
                        background: #f39c12;
                    }
                    
                    .timeline-item {
                        position: relative;
                        margin-bottom: 30px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        padding: 20px;
                        margin-left: 20px;
                        border-left: 4px solid #f39c12;
                    }
                    
                    .timeline-item::before {
                        content: '';
                        position: absolute;
                        left: -30px;
                        top: 20px;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: #f39c12;
                        border: 2px solid #1a1a2e;
                    }
                    
                    .timeline-date {
                        color: #f39c12;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    
                    .timeline-content {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 10px;
                        font-size: 0.9rem;
                        color: #bbb;
                    }
                    
                    .timeline-score {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #2ecc71;
                        text-align: right;
                    }
                    
                    .nav-links {
                        text-align: center;
                        margin-top: 20px;
                    }
                    
                    .nav-links a {
                        color: #f39c12;
                        text-decoration: none;
                        margin: 0 15px;
                    }
                    
                    .empty-state {
                        text-align: center;
                        padding: 40px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>📅 실험 히스토리</h1>
                        <p>날짜별 실험 기록을 확인하세요</p>
                    </header>
                    
                    <div class="history-container">
                        <div class="date-selector">
                            <label>날짜 선택:</label>
                            <input type="date" id="datePicker" onchange="loadDateHistory()">
                            <label>또는</label>
                            <select id="yearSelect" onchange="updateMonthOptions()">
                                <option value="">연도 선택</option>
                            </select>
                            <select id="monthSelect" onchange="loadMonthHistory()">
                                <option value="">월 선택</option>
                            </select>
                            <button onclick="loadTodayHistory()">오늘</button>
                        </div>
                        
                        <div class="stats-summary" id="statsSummary"></div>
                        
                        <div class="timeline" id="timeline"></div>
                    </div>
                    
                    <div class="nav-links">
                        <a href="/dashboard">📊 대시보드</a>
                        <a href="/search-page">🔍 검색</a>
                        <a href="/experiment-form">➕ 새 실험</a>
                    </div>
                </div>
                
                <script>
                    // 전역 함수 정의
                    window.displayStats = function(count, avgScore) {
                        const statsDiv = document.getElementById('statsSummary');
                        if (!statsDiv) return;
                        statsDiv.innerHTML = `
                            <div class="stat-card">
                                <div class="value">${count}</div>
                                <div class="label">실험 수</div>
                            </div>
                            <div class="stat-card">
                                <div class="value">${avgScore.toFixed(1)}</div>
                                <div class="label">평균 점수</div>
                            </div>
                        `;
                    };
                    
                    window.displayTimeline = function(experiments) {
                        const timelineDiv = document.getElementById('timeline');
                        if (!timelineDiv) return;
                        
                        if (!experiments || experiments.length === 0) {
                            timelineDiv.innerHTML = '<div class="empty-state">해당 기간에 실험이 없습니다.</div>';
                            return;
                        }
                        
                        timelineDiv.innerHTML = experiments.map(exp => {
                            const date = new Date(exp.timestamp);
                            const isDeleted = exp.eventType === 'EXPERIMENT_DELETED';
                            const deletedStyle = isDeleted ? 'opacity: 0.6; border-left-color: #e74c3c;' : '';
                            const deletedBadge = isDeleted ? '<span style="background: #e74c3c; color: white; padding: 3px 8px; border-radius: 5px; font-size: 0.8rem; margin-left: 10px;">🗑️ 삭제된 건</span>' : '';
                            return `
                                <div class="timeline-item" style="${deletedStyle}">
                                    <div class="timeline-date">${date.toLocaleString('ko-KR')}${deletedBadge}</div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div class="timeline-content">
                                            <div><strong>원두:</strong> ${exp.coffeeBean || 'Unknown'}</div>
                                            <div><strong>추출법:</strong> ${exp.brewMethod || '-'}</div>
                                            <div><strong>로스팅:</strong> ${exp.roastLevel || '-'}</div>
                                            <div><strong>온도:</strong> ${exp.waterTemperature || '-'}°C</div>
                                        </div>
                                        <div class="timeline-score">${exp.tasteScore ? exp.tasteScore.toFixed(1) : '-'}/10</div>
                                    </div>
                                    ${exp.flavorNotes ? `<div style="margin-top: 10px; color: #bbb; font-size: 0.9rem;">풍미: ${exp.flavorNotes}</div>` : ''}
                                </div>
                            `;
                        }).join('');
                    };
                    
                    window.loadDateHistory = function() {
                        const datePicker = document.getElementById('datePicker');
                        if (!datePicker) return;
                        const date = datePicker.value;
                        if (!date) return;
                        
                        fetch(`/api/statistics/history/date?date=${date}`)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Network response was not ok: ' + response.status);
                                }
                                return response.json();
                            })
                            .then(data => {
                                if (data && data.content) {
                                    const avgScore = data.content.filter(e => e.tasteScore).length > 0
                                        ? data.content.filter(e => e.tasteScore).reduce((sum, e) => sum + e.tasteScore, 0) / data.content.filter(e => e.tasteScore).length
                                        : 0;
                                    window.displayStats(data.content.length, avgScore);
                                    window.displayTimeline(data.content);
                                } else {
                                    window.displayStats(0, 0);
                                    window.displayTimeline([]);
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                const timelineDiv = document.getElementById('timeline');
                                if (timelineDiv) {
                                    timelineDiv.innerHTML = '<div class="empty-state">데이터를 불러오는 중 오류가 발생했습니다: ' + error.message + '</div>';
                                }
                            });
                    };
                    
                    window.loadMonthHistory = function() {
                        const yearSelect = document.getElementById('yearSelect');
                        const monthSelect = document.getElementById('monthSelect');
                        if (!yearSelect || !monthSelect) return;
                        
                        const year = yearSelect.value;
                        const month = monthSelect.value;
                        if (!year || !month) return;
                        
                        fetch(`/api/statistics/history/month?year=${year}&month=${month}`)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Network response was not ok: ' + response.status);
                                }
                                return response.json();
                            })
                            .then(data => {
                                if (data && data.experiments) {
                                    window.displayStats(data.totalCount || 0, data.averageScore || 0);
                                    window.displayTimeline(data.experiments);
                                } else {
                                    window.displayStats(0, 0);
                                    window.displayTimeline([]);
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                const timelineDiv = document.getElementById('timeline');
                                if (timelineDiv) {
                                    timelineDiv.innerHTML = '<div class="empty-state">데이터를 불러오는 중 오류가 발생했습니다: ' + error.message + '</div>';
                                }
                            });
                    };
                    
                    window.updateMonthOptions = function() {
                        const yearSelect = document.getElementById('yearSelect');
                        const monthSelect = document.getElementById('monthSelect');
                        if (!yearSelect || !monthSelect) return;
                        
                        monthSelect.innerHTML = '<option value="">월 선택</option>';
                        const year = yearSelect.value;
                        if (year) {
                            for (let month = 1; month <= 12; month++) {
                                const option = document.createElement('option');
                                option.value = month;
                                option.textContent = month + '월';
                                monthSelect.appendChild(option);
                            }
                        }
                    };
                    
                    // 로컬 시간대 기준 오늘 날짜 가져오기
                    function getTodayLocalDate() {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = String(now.getMonth() + 1).padStart(2, '0');
                        const day = String(now.getDate()).padStart(2, '0');
                        return year + '-' + month + '-' + day;
                    }
                    
                    window.loadTodayHistory = function() {
                        const today = getTodayLocalDate();
                        const datePicker = document.getElementById('datePicker');
                        if (datePicker) {
                            datePicker.value = today;
                            window.loadDateHistory();
                        }
                    };
                    
                    // 초기화 함수
                    function init() {
                        console.log('초기화 시작');
                        
                        // 연도/월 옵션 초기화
                        const currentYear = new Date().getFullYear();
                        const yearSelect = document.getElementById('yearSelect');
                        const monthSelect = document.getElementById('monthSelect');
                        
                        if (!yearSelect || !monthSelect) {
                            console.error('요소를 찾을 수 없습니다 - 재시도');
                            setTimeout(init, 100);
                            return;
                        }
                        
                        console.log('요소 찾음, 옵션 추가 시작');
                        
                        // 연도 옵션 추가 (기존 옵션 제거 후 추가)
                        yearSelect.innerHTML = '<option value="">연도 선택</option>';
                        for (let year = currentYear; year >= currentYear - 5; year--) {
                            const option = document.createElement('option');
                            option.value = year;
                            option.textContent = year + '년';
                            yearSelect.appendChild(option);
                        }
                        
                        console.log('연도 옵션 추가 완료');
                        
                        // 오늘 날짜로 초기화
                        const today = getTodayLocalDate();
                        const datePicker = document.getElementById('datePicker');
                        if (datePicker) {
                            datePicker.value = today;
                            console.log('오늘 날짜 설정:', today);
                            window.loadDateHistory();
                        }
                    }
                    
                    // DOM이 준비되면 초기화
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', function() {
                            console.log('DOMContentLoaded 이벤트 발생');
                            init();
                        });
                    } else {
                        console.log('DOM 이미 준비됨');
                        init();
                    }
                </script>
            </body>
            </html>
            """;
    }
}

