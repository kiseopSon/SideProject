package com.coffeebrewlab.statistics.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
public class CompleteFormController {

    @Value("${gateway.port:8101}")
    private int gatewayPort;

    @GetMapping(value = "/complete-form", produces = MediaType.TEXT_HTML_VALUE)
    public String getCompleteForm(@RequestParam(required = false) String id) {
        log.info("✅ [COMPLETE-FORM] 실험 완료 폼 페이지 요청 - Experiment ID: {}", id);
        return generateCompleteFormHtml(id).replace("{{GATEWAY_PORT}}", String.valueOf(gatewayPort));
    }

    private String generateCompleteFormHtml(String experimentId) {
        StringBuilder html = new StringBuilder();
        html.append("""
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>☕ Coffee Brew Lab - 실험 완료</title>
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
                        max-width: 700px;
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
                    
                    header p {
                        color: #bbb;
                        font-size: 1.1rem;
                    }
                    
                    .form-container {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 20px;
                        padding: 40px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        margin-bottom: 20px;
                    }
                    
                    .form-section {
                        margin-bottom: 30px;
                    }
                    
                    .form-section h2 {
                        color: #f39c12;
                        margin-bottom: 20px;
                        font-size: 1.3rem;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .form-group {
                        margin-bottom: 20px;
                    }
                    
                    .form-group label {
                        display: block;
                        margin-bottom: 8px;
                        color: #ddd;
                        font-weight: 500;
                    }
                    
                    .form-group input,
                    .form-group textarea {
                        width: 100%;
                        padding: 12px 15px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 10px;
                        color: #fff;
                        font-size: 1rem;
                        transition: all 0.3s;
                    }
                    
                    .form-group input:focus,
                    .form-group textarea:focus {
                        outline: none;
                        border-color: #f39c12;
                        box-shadow: 0 0 10px rgba(243, 156, 18, 0.3);
                        background: rgba(255, 255, 255, 0.15);
                    }
                    
                    .form-group input::placeholder,
                    .form-group textarea::placeholder {
                        color: #999;
                    }
                    
                    .form-group textarea {
                        resize: vertical;
                        min-height: 120px;
                    }
                    
                    .score-input {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }
                    
                    .score-input input {
                        flex: 1;
                    }
                    
                    .score-display {
                        font-size: 2rem;
                        color: #f39c12;
                        font-weight: bold;
                        min-width: 80px;
                        text-align: center;
                    }
                    
                    .btn-group {
                        display: flex;
                        gap: 15px;
                        margin-top: 30px;
                    }
                    
                    .btn {
                        flex: 1;
                        padding: 15px 30px;
                        border: none;
                        border-radius: 10px;
                        font-size: 1.1rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s;
                        text-decoration: none;
                        text-align: center;
                        display: inline-block;
                    }
                    
                    .btn-primary {
                        background: linear-gradient(135deg, #2ecc71, #27ae60);
                        color: white;
                        box-shadow: 0 5px 20px rgba(46, 204, 113, 0.4);
                    }
                    
                    .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 30px rgba(46, 204, 113, 0.6);
                    }
                    
                    .btn-secondary {
                        background: rgba(255, 255, 255, 0.1);
                        color: #fff;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    
                    .btn-secondary:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                    
                    .alert {
                        padding: 15px 20px;
                        border-radius: 10px;
                        margin-bottom: 20px;
                        display: none;
                    }
                    
                    .alert-success {
                        background: rgba(46, 204, 113, 0.2);
                        border: 1px solid #2ecc71;
                        color: #2ecc71;
                    }
                    
                    .alert-error {
                        background: rgba(231, 76, 60, 0.2);
                        border: 1px solid #e74c3c;
                        color: #e74c3c;
                    }
                    
                    .alert.show {
                        display: block;
                    }
                    
                    .nav-links {
                        text-align: center;
                        margin-top: 20px;
                    }
                    
                    .nav-links a {
                        color: #f39c12;
                        text-decoration: none;
                        margin: 0 15px;
                        transition: color 0.3s;
                    }
                    
                    .nav-links a:hover {
                        color: #fff;
                    }
                    
                    .loading {
                        display: none;
                        text-align: center;
                        padding: 20px;
                        color: #f39c12;
                    }
                    
                    .loading.show {
                        display: block;
                    }
                    
                    .experiment-id {
                        background: rgba(243, 156, 18, 0.1);
                        padding: 10px 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        font-size: 0.9rem;
                        color: #f39c12;
                        border: 1px solid rgba(243, 156, 18, 0.3);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>✅ 실험 완료</h1>
                        <p>맛 점수와 풍미를 기록하세요</p>
                    </header>
                    
                    <div class="alert alert-success" id="successAlert">
                        ✅ 실험이 성공적으로 완료되었습니다!
                    </div>
                    
                    <div class="alert alert-error" id="errorAlert">
                        ❌ 오류가 발생했습니다. 다시 시도해주세요.
                    </div>
                    
                    <div class="loading" id="loading">
                        <p>⏳ 처리 중...</p>
                    </div>
                    
                    <div class="form-container">
                        <div class="experiment-id" id="experimentIdDisplay">
                            실험 ID: <span id="experimentId">""");
        
        if (experimentId != null) {
            html.append(experimentId);
        }
        
        html.append("""
                            </span>
                        </div>
                        
                        <form id="completeForm">
                            <div class="form-section">
                                <h2>⭐ 맛 평가</h2>
                                
                                <div class="form-group">
                                    <label for="tasteScore">맛 점수 (1-10) *</label>
                                    <div class="score-input">
                                        <input type="range" id="tasteScore" name="tasteScore" 
                                               min="1" max="10" step="0.1" value="5" required>
                                        <div class="score-display" id="scoreDisplay">5.0</div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label style="font-size: 1.1rem; color: #f39c12; margin-bottom: 15px; display: block;">🔥 뜨거울 때 맛 (1-10)</label>
                                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                                        <div>
                                            <label for="sournessHot" style="font-size: 0.9rem;">신맛</label>
                                            <div class="score-input">
                                                <input type="range" id="sournessHot" name="sournessHot" 
                                                       min="1" max="10" step="0.5" value="5" required>
                                                <div class="score-display" id="sournessHotDisplay" style="font-size: 1.2rem;">5.0</div>
                                            </div>
                                        </div>
                                        <div>
                                            <label for="sweetnessHot" style="font-size: 0.9rem;">단맛</label>
                                            <div class="score-input">
                                                <input type="range" id="sweetnessHot" name="sweetnessHot" 
                                                       min="1" max="10" step="0.5" value="5" required>
                                                <div class="score-display" id="sweetnessHotDisplay" style="font-size: 1.2rem;">5.0</div>
                                            </div>
                                        </div>
                                        <div>
                                            <label for="bitternessHot" style="font-size: 0.9rem;">쓴맛</label>
                                            <div class="score-input">
                                                <input type="range" id="bitternessHot" name="bitternessHot" 
                                                       min="1" max="10" step="0.5" value="5" required>
                                                <div class="score-display" id="bitternessHotDisplay" style="font-size: 1.2rem;">5.0</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label style="font-size: 1.1rem; color: #3498db; margin-bottom: 15px; display: block;">❄️ 식었을 때 맛 (1-10)</label>
                                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                                        <div>
                                            <label for="sournessCold" style="font-size: 0.9rem;">신맛</label>
                                            <div class="score-input">
                                                <input type="range" id="sournessCold" name="sournessCold" 
                                                       min="1" max="10" step="0.5" value="5" required>
                                                <div class="score-display" id="sournessColdDisplay" style="font-size: 1.2rem;">5.0</div>
                                            </div>
                                        </div>
                                        <div>
                                            <label for="sweetnessCold" style="font-size: 0.9rem;">단맛</label>
                                            <div class="score-input">
                                                <input type="range" id="sweetnessCold" name="sweetnessCold" 
                                                       min="1" max="10" step="0.5" value="5" required>
                                                <div class="score-display" id="sweetnessColdDisplay" style="font-size: 1.2rem;">5.0</div>
                                            </div>
                                        </div>
                                        <div>
                                            <label for="bitternessCold" style="font-size: 0.9rem;">쓴맛</label>
                                            <div class="score-input">
                                                <input type="range" id="bitternessCold" name="bitternessCold" 
                                                       min="1" max="10" step="0.5" value="5" required>
                                                <div class="score-display" id="bitternessColdDisplay" style="font-size: 1.2rem;">5.0</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="flavorNotes">풍미 노트 *</label>
                                    <textarea id="flavorNotes" name="flavorNotes" 
                                              placeholder="예: Floral, Citrus, Bright acidity, Sweet..." required></textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label for="notes">추가 메모</label>
                                    <textarea id="notes" name="notes" 
                                              placeholder="추가로 기록하고 싶은 내용을 입력하세요..."></textarea>
                                </div>
                            </div>
                            
                            <div class="btn-group">
                                <button type="submit" class="btn btn-primary">
                                    ✅ 실험 완료하기
                                </button>
                                <a href="experiment-form" class="btn btn-secondary">
                                    🔄 새 실험
                                </a>
                            </div>
                        </form>
                    </div>
                    
                    <div class="nav-links">
                        <a href="dashboard">📊 대시보드</a>
                        <a href="experiment-form">➕ 새 실험</a>
                    </div>
                </div>
                
                <script>
                    const API_BASE = (window.location.port === '8000' || window.location.pathname.startsWith('/api/coffee-gateway'))
                        ? '/api/coffee-gateway'
                        : ((window.location.port === '9002' || window.location.port === '8103')
                            ? (window.location.protocol + '//' + window.location.hostname + ':{{GATEWAY_PORT}}') : '');
                    const form = document.getElementById('completeForm');
                    const successAlert = document.getElementById('successAlert');
                    const errorAlert = document.getElementById('errorAlert');
                    const loading = document.getElementById('loading');
                    const tasteScoreInput = document.getElementById('tasteScore');
                    const scoreDisplay = document.getElementById('scoreDisplay');
                    const experimentIdSpan = document.getElementById('experimentId');
                    
                    // URL에서 ID 가져오기
                    const urlParams = new URLSearchParams(window.location.search);
                    const experimentId = urlParams.get('id') || sessionStorage.getItem('currentExperimentId');
                    
                    if (experimentId) {
                        experimentIdSpan.textContent = experimentId;
                    } else {
                        document.getElementById('experimentIdDisplay').style.display = 'none';
                    }
                    
                    // 점수 슬라이더 업데이트
                    tasteScoreInput.addEventListener('input', (e) => {
                        scoreDisplay.textContent = parseFloat(e.target.value).toFixed(1);
                    });
                    
                    // 뜨거울 때 맛 슬라이더 업데이트
                    document.getElementById('sournessHot').addEventListener('input', (e) => {
                        document.getElementById('sournessHotDisplay').textContent = parseFloat(e.target.value).toFixed(1);
                    });
                    document.getElementById('sweetnessHot').addEventListener('input', (e) => {
                        document.getElementById('sweetnessHotDisplay').textContent = parseFloat(e.target.value).toFixed(1);
                    });
                    document.getElementById('bitternessHot').addEventListener('input', (e) => {
                        document.getElementById('bitternessHotDisplay').textContent = parseFloat(e.target.value).toFixed(1);
                    });
                    
                    // 식었을 때 맛 슬라이더 업데이트
                    document.getElementById('sournessCold').addEventListener('input', (e) => {
                        document.getElementById('sournessColdDisplay').textContent = parseFloat(e.target.value).toFixed(1);
                    });
                    document.getElementById('sweetnessCold').addEventListener('input', (e) => {
                        document.getElementById('sweetnessColdDisplay').textContent = parseFloat(e.target.value).toFixed(1);
                    });
                    document.getElementById('bitternessCold').addEventListener('input', (e) => {
                        document.getElementById('bitternessColdDisplay').textContent = parseFloat(e.target.value).toFixed(1);
                    });
                    
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        if (!experimentId) {
                            errorAlert.textContent = '❌ 실험 ID가 없습니다. 새 실험을 먼저 생성해주세요.';
                            errorAlert.classList.add('show');
                            return;
                        }
                        
                        // 알림 숨기기
                        successAlert.classList.remove('show');
                        errorAlert.classList.remove('show');
                        loading.classList.add('show');
                        
                        // 폼 데이터 수집
                        const formData = {
                            tasteScore: parseFloat(document.getElementById('tasteScore').value),
                            sournessHot: parseFloat(document.getElementById('sournessHot').value),
                            sweetnessHot: parseFloat(document.getElementById('sweetnessHot').value),
                            bitternessHot: parseFloat(document.getElementById('bitternessHot').value),
                            sournessCold: parseFloat(document.getElementById('sournessCold').value),
                            sweetnessCold: parseFloat(document.getElementById('sweetnessCold').value),
                            bitternessCold: parseFloat(document.getElementById('bitternessCold').value),
                            flavorNotes: document.getElementById('flavorNotes').value,
                            notes: document.getElementById('notes').value
                        };
                        
                        try {
                            const response = await fetch((API_BASE || '') + `/api/experiments/${experimentId}/complete`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(formData)
                            });
                            
                            if (response.ok) {
                                successAlert.classList.add('show');
                                
                                // 2초 후 대시보드로 이동
                                setTimeout(() => {
                                    window.location.href = (API_BASE || window.location.origin) + '/dashboard';
                                }, 2000);
                            } else {
                                const error = await response.json();
                                errorAlert.textContent = '❌ 오류: ' + (error.message || '알 수 없는 오류');
                                errorAlert.classList.add('show');
                            }
                        } catch (error) {
                            errorAlert.textContent = '❌ 네트워크 오류: ' + error.message;
                            errorAlert.classList.add('show');
                        } finally {
                            loading.classList.remove('show');
                        }
                    });
                </script>
            </body>
            </html>
            """);
        
        return html.toString();
    }
}

