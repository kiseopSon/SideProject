package com.coffeebrewlab.statistics.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
public class SearchController {

    @GetMapping(value = "/search-page", produces = MediaType.TEXT_HTML_VALUE)
    public String getSearchPage() {
        log.info("🔍 [SEARCH] 검색 페이지 요청");
        return generateSearchPageHtml();
    }

    private String generateSearchPageHtml() {
        return """
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>☕ Coffee Brew Lab - 실험 검색</title>
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
                    
                    .search-container {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 20px;
                        padding: 30px;
                        margin-bottom: 30px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .search-box {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    
                    .search-box input {
                        flex: 1;
                        padding: 15px 20px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 10px;
                        color: #fff;
                        font-size: 1rem;
                    }
                    
                    .search-box input:focus {
                        outline: none;
                        border-color: #f39c12;
                        box-shadow: 0 0 10px rgba(243, 156, 18, 0.3);
                    }
                    
                    .search-box button {
                        padding: 15px 30px;
                        background: linear-gradient(135deg, #f39c12, #e74c3c);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: transform 0.3s;
                    }
                    
                    .search-box button:hover {
                        transform: translateY(-2px);
                    }
                    
                    .filters {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin-bottom: 20px;
                    }
                    
                    .filter-group {
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                    }
                    
                    .filter-group label {
                        font-size: 0.9rem;
                        color: #bbb;
                    }
                    
                    .filter-group input,
                    .filter-group select {
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 8px;
                        color: #fff;
                    }
                    
                    .filter-group select {
                        cursor: pointer;
                        appearance: none;
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f39c12' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                        background-repeat: no-repeat;
                        background-position: right 10px center;
                        padding-right: 35px;
                    }
                    
                    .filter-group select option {
                        background: #1a1a2e !important;
                        color: #fff !important;
                        padding: 10px;
                    }
                    
                    .sort-options {
                        display: flex;
                        gap: 10px;
                        align-items: center;
                        flex-wrap: wrap;
                    }
                    
                    .sort-options label {
                        color: #bbb;
                        font-size: 0.9rem;
                    }
                    
                    .sort-options select {
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 8px;
                        color: #fff;
                        cursor: pointer;
                        appearance: none;
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f39c12' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                        background-repeat: no-repeat;
                        background-position: right 10px center;
                        padding-right: 35px;
                    }
                    
                    .sort-options select option {
                        background: #1a1a2e !important;
                        color: #fff !important;
                    }
                    
                    .apply-filter-btn {
                        padding: 10px 25px;
                        background: linear-gradient(135deg, #f39c12, #e74c3c);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: transform 0.3s, box-shadow 0.3s;
                        margin-left: auto;
                    }
                    
                    .apply-filter-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(243, 156, 18, 0.4);
                    }
                    
                    .results-container {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 20px;
                        padding: 30px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }
                    
                    .result-item {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        padding: 20px;
                        margin-bottom: 15px;
                        border-left: 4px solid #f39c12;
                        transition: background 0.3s;
                    }
                    
                    .result-item:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }
                    
                    .result-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }
                    
                    .result-actions {
                        display: flex;
                        gap: 10px;
                        align-items: center;
                    }
                    
                    .delete-btn {
                        background: linear-gradient(135deg, #e74c3c, #c0392b);
                        color: white;
                        border: none;
                        padding: 8px 15px;
                        border-radius: 8px;
                        font-size: 0.9rem;
                        cursor: pointer;
                        transition: all 0.3s;
                    }
                    
                    .delete-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);
                    }
                    
                    .result-title {
                        font-size: 1.2rem;
                        font-weight: bold;
                        color: #f39c12;
                    }
                    
                    .result-score {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #2ecc71;
                    }
                    
                    .result-details {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 10px;
                        margin-top: 10px;
                        font-size: 0.9rem;
                        color: #bbb;
                    }
                    
                    .result-notes {
                        margin-top: 10px;
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 5px;
                        font-size: 0.9rem;
                        color: #ddd;
                    }
                    
                    .pagination {
                        display: flex;
                        justify-content: center;
                        gap: 10px;
                        margin-top: 20px;
                    }
                    
                    .pagination button {
                        padding: 10px 20px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 8px;
                        color: #fff;
                        cursor: pointer;
                    }
                    
                    .pagination button:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                    
                    .pagination button.active {
                        background: #f39c12;
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
                        <h1>🔍 실험 검색</h1>
                        <p>원두, 풍미, 메모로 실험을 검색하세요</p>
                    </header>
                    
                    <div class="search-container">
                        <div class="search-box">
                            <input type="text" id="searchQuery" placeholder="검색어를 입력하세요...">
                            <button onclick="performSearch()">🔍 검색</button>
                        </div>
                        
                        <div class="filters">
                            <div class="filter-group">
                                <label>원두</label>
                                <input type="text" id="filterCoffeeBean" placeholder="원두명">
                            </div>
                            <div class="filter-group">
                                <label>추출 방법</label>
                                <select id="filterBrewMethod">
                                    <option value="">전체</option>
                                    <option value="브루잉">브루잉</option>
                                    <option value="모카포트">모카포트</option>
                                    <option value="에스프레소머신">에스프레소머신</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>로스팅 레벨</label>
                                <select id="filterRoastLevel">
                                    <option value="">전체</option>
                                    <option value="1">1단계 - 라이트</option>
                                    <option value="2">2단계 - 시나몬</option>
                                    <option value="3">3단계 - 미디엄</option>
                                    <option value="4">4단계 - 하이</option>
                                    <option value="5">5단계 - 시티</option>
                                    <option value="6">6단계 - 풀시티</option>
                                    <option value="7">7단계 - 프렌치</option>
                                    <option value="8">8단계 - 이탈리안</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>최소 점수</label>
                                <input type="number" id="filterMinScore" min="1" max="10" step="0.1" placeholder="1.0">
                            </div>
                            <div class="filter-group">
                                <label>최대 점수</label>
                                <input type="number" id="filterMaxScore" min="1" max="10" step="0.1" placeholder="10.0">
                            </div>
                        </div>
                        
                        <div class="sort-options">
                            <label>정렬:</label>
                            <select id="sortBy">
                                <option value="timestamp">날짜</option>
                                <option value="tasteScore">점수</option>
                                <option value="coffeeBean">원두</option>
                            </select>
                            <select id="sortOrder">
                                <option value="desc">내림차순</option>
                                <option value="asc">오름차순</option>
                            </select>
                            <button class="apply-filter-btn" onclick="performSearch()">필터 적용</button>
                        </div>
                    </div>
                    
                    <div class="results-container">
                        <div id="results"></div>
                        <div class="pagination" id="pagination"></div>
                    </div>
                    
                    <div class="nav-links">
                        <a href="/dashboard">📊 대시보드</a>
                        <a href="/experiment-form">➕ 새 실험</a>
                        <a href="/history-page">📅 히스토리</a>
                    </div>
                </div>
                
                <script>
                    let currentPage = 0;
                    const pageSize = 10;
                    
                    function performSearch() {
                        const query = document.getElementById('searchQuery').value;
                        const coffeeBean = document.getElementById('filterCoffeeBean').value;
                        const brewMethod = document.getElementById('filterBrewMethod').value;
                        const roastLevel = document.getElementById('filterRoastLevel').value;
                        const minScore = document.getElementById('filterMinScore').value;
                        const maxScore = document.getElementById('filterMaxScore').value;
                        const sortBy = document.getElementById('sortBy').value;
                        const sortOrder = document.getElementById('sortOrder').value;
                        
                        let url = '/api/statistics/experiments?';
                        url += 'sortBy=' + sortBy + '&sortOrder=' + sortOrder;
                        url += '&page=' + currentPage + '&size=' + pageSize;
                        
                        if (query) {
                            url = '/api/statistics/search?query=' + encodeURIComponent(query) + 
                                  '&page=' + currentPage + '&size=' + pageSize;
                        } else {
                            if (coffeeBean) url += '&coffeeBean=' + encodeURIComponent(coffeeBean);
                            if (brewMethod) url += '&brewMethod=' + encodeURIComponent(brewMethod);
                            if (roastLevel) url += '&roastLevel=' + encodeURIComponent(roastLevel);
                            if (minScore) url += '&minScore=' + minScore;
                            if (maxScore) url += '&maxScore=' + maxScore;
                        }
                        
                        fetch(url)
                            .then(response => response.json())
                            .then(data => {
                                displayResults(data.content);
                                displayPagination(data.totalPages, data.number);
                            })
                            .catch(error => {
                                document.getElementById('results').innerHTML = 
                                    '<div class="empty-state">검색 중 오류가 발생했습니다.</div>';
                            });
                    }
                    
                    function displayResults(experiments) {
                        const resultsDiv = document.getElementById('results');
                        
                        if (experiments.length === 0) {
                            resultsDiv.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
                            return;
                        }
                        
                        resultsDiv.innerHTML = experiments.map(exp => `
                            <div class="result-item" data-experiment-id="${exp.experimentId || ''}">
                                <div class="result-header">
                                    <div class="result-title">${exp.coffeeBean || 'Unknown'}</div>
                                    <div class="result-actions">
                                        <div class="result-score">${exp.tasteScore ? exp.tasteScore.toFixed(1) : '-'}/10</div>
                                        <button class="delete-btn" onclick="deleteExperiment('${exp.experimentId || ''}', '${(exp.coffeeBean || 'Unknown').replace(/'/g, "\\'")}', this)">
                                            🗑️ 삭제
                                        </button>
                                    </div>
                                </div>
                                <div class="result-details">
                                    <div>추출법: ${exp.brewMethod || '-'}</div>
                                    <div>로스팅: ${exp.roastLevel || '-'}</div>
                                    <div>온도: ${exp.waterTemperature || '-'}°C</div>
                                    <div>시간: ${exp.extractionTime || '-'}초</div>
                                    <div>날짜: ${new Date(exp.timestamp).toLocaleDateString('ko-KR')}</div>
                                </div>
                                ${exp.flavorNotes ? `<div class="result-notes"><strong>풍미:</strong> ${exp.flavorNotes}</div>` : ''}
                                ${exp.notes ? `<div class="result-notes"><strong>메모:</strong> ${exp.notes}</div>` : ''}
                            </div>
                        `).join('');
                    }
                    
                    function deleteExperiment(experimentId, coffeeBean, buttonElement) {
                        if (!experimentId) {
                            alert('실험 ID가 없습니다.');
                            return;
                        }
                        
                        if (!confirm(`"${coffeeBean}" 실험을 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
                            return;
                        }
                        
                        // 삭제 버튼 비활성화
                        if (buttonElement) {
                            buttonElement.disabled = true;
                            buttonElement.textContent = '삭제 중...';
                        }
                        
                        fetch(`/api/experiments/${experimentId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                        .then(response => {
                            if (response.ok || response.status === 204) {
                                // 삭제 성공 메시지
                                if (buttonElement) {
                                    buttonElement.textContent = '✅ 삭제됨';
                                }
                                // 잠시 대기 후 검색 결과 다시 로드 (Elasticsearch/Redis 동기화 시간 확보)
                                setTimeout(() => {
                                    // 현재 검색 조건 유지하면서 다시 검색
                                    const query = document.getElementById('searchQuery').value;
                                    const coffeeBean = document.getElementById('filterCoffeeBean').value;
                                    const brewMethod = document.getElementById('filterBrewMethod').value;
                                    const roastLevel = document.getElementById('filterRoastLevel').value;
                                    const minScore = document.getElementById('filterMinScore').value;
                                    const maxScore = document.getElementById('filterMaxScore').value;
                                    const sortBy = document.getElementById('sortBy').value;
                                    const sortOrder = document.getElementById('sortOrder').value;
                                    
                                    // 검색 조건에 맞게 URL 구성
                                    let url = '/api/statistics/experiments?';
                                    url += 'sortBy=' + sortBy + '&sortOrder=' + sortOrder;
                                    url += '&page=' + currentPage + '&size=' + pageSize;
                                    
                                    if (query) {
                                        url = '/api/statistics/search?query=' + encodeURIComponent(query) + 
                                              '&page=' + currentPage + '&size=' + pageSize;
                                    } else {
                                        if (coffeeBean) url += '&coffeeBean=' + encodeURIComponent(coffeeBean);
                                        if (brewMethod) url += '&brewMethod=' + encodeURIComponent(brewMethod);
                                        if (roastLevel) url += '&roastLevel=' + encodeURIComponent(roastLevel);
                                        if (minScore) url += '&minScore=' + minScore;
                                        if (maxScore) url += '&maxScore=' + maxScore;
                                    }
                                    
                                    fetch(url)
                                        .then(response => response.json())
                                        .then(data => {
                                            displayResults(data.content);
                                            displayPagination(data.totalPages, data.number);
                                        })
                                        .catch(error => {
                                            console.error('검색 결과 갱신 실패:', error);
                                        });
                                }, 2000);
                            } else {
                                throw new Error('삭제 실패: ' + response.status);
                            }
                        })
                        .catch(error => {
                            alert('삭제 중 오류가 발생했습니다: ' + error.message);
                            if (buttonElement) {
                                buttonElement.disabled = false;
                                buttonElement.textContent = '🗑️ 삭제';
                            }
                        });
                    }
                    
                    function displayPagination(totalPages, current) {
                        const paginationDiv = document.getElementById('pagination');
                        if (totalPages <= 1) {
                            paginationDiv.innerHTML = '';
                            return;
                        }
                        
                        let html = '';
                        for (let i = 0; i < totalPages; i++) {
                            html += `<button class="${i === current ? 'active' : ''}" onclick="goToPage(${i})">${i + 1}</button>`;
                        }
                        paginationDiv.innerHTML = html;
                    }
                    
                    function goToPage(page) {
                        currentPage = page;
                        performSearch();
                    }
                    
                    // Enter 키로 검색
                    document.getElementById('searchQuery').addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') performSearch();
                    });
                </script>
            </body>
            </html>
            """;
    }
}

