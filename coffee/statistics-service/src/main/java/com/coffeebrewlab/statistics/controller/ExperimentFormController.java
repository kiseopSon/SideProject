package com.coffeebrewlab.statistics.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
public class ExperimentFormController {

    @GetMapping(value = {"/", "/experiment-form"}, produces = MediaType.TEXT_HTML_VALUE)
    public String getExperimentForm() {
        log.info("📝 [EXPERIMENT-FORM] 실험 입력 폼 페이지 요청");
        return generateExperimentFormHtml();
    }

    private String generateExperimentFormHtml() {
        return """
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>☕ Coffee Brew Lab - 실험 입력</title>
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
                        max-width: 800px;
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
                    .form-group select,
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
                    
                    .form-group select {
                        cursor: pointer;
                        appearance: none;
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23f39c12' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                        background-repeat: no-repeat;
                        background-position: right 15px center;
                        padding-right: 40px;
                    }
                    
                    .form-group select option {
                        background: #1a1a2e;
                        color: #fff;
                        padding: 10px;
                    }
                    
                    .form-group input:focus,
                    .form-group select:focus,
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
                    
                    .form-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    }
                    
                    .form-group textarea {
                        resize: vertical;
                        min-height: 100px;
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
                        background: linear-gradient(135deg, #f39c12, #e74c3c);
                        color: white;
                        box-shadow: 0 5px 20px rgba(243, 156, 18, 0.4);
                    }
                    
                    .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 30px rgba(243, 156, 18, 0.6);
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
                    
                    @media (max-width: 768px) {
                        .form-row {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <header>
                        <h1>☕ Coffee Brew Lab</h1>
                        <p>커피 추출 실험 기록</p>
                    </header>
                    
                    <div class="alert alert-success" id="successAlert">
                        ✅ 실험이 성공적으로 생성되었습니다!
                    </div>
                    
                    <div class="alert alert-error" id="errorAlert">
                        ❌ 오류가 발생했습니다. 다시 시도해주세요.
                    </div>
                    
                    <div class="loading" id="loading">
                        <p>⏳ 처리 중...</p>
                    </div>
                    
                    <div class="form-container">
                        <form id="experimentForm">
                            <div class="form-section">
                                <h2>🫘 원두 정보</h2>
                                
                                <div class="form-group">
                                    <label for="coffeeBean">원두 종류 *</label>
                                    <input type="text" id="coffeeBean" name="coffeeBean" 
                                           placeholder="예: Ethiopia Yirgacheffe" required>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="roastLevel">로스팅 레벨 *</label>
                                        <select id="roastLevel" name="roastLevel" required>
                                            <option value="">선택하세요</option>
                                            <option value="1">1단계 - 라이트 (Light)</option>
                                            <option value="2">2단계 - 시나몬 (Cinnamon)</option>
                                            <option value="3">3단계 - 미디엄 (Medium)</option>
                                            <option value="4">4단계 - 하이 (High)</option>
                                            <option value="5">5단계 - 시티 (City)</option>
                                            <option value="6">6단계 - 풀시티 (Full City)</option>
                                            <option value="7">7단계 - 프렌치 (French)</option>
                                            <option value="8">8단계 - 이탈리안 (Italian)</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="grindSize">분쇄도 (1-10) *</label>
                                        <input type="number" id="grindSize" name="grindSize" 
                                               min="1" max="10" step="0.5" 
                                               placeholder="5.0" required>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <h2>💧 추출 파라미터</h2>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="waterTemperature">물 온도 (°C) *</label>
                                        <input type="number" id="waterTemperature" name="waterTemperature" 
                                               min="80" max="100" step="0.1" 
                                               placeholder="93.0" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="extractionTime">추출 시간 (초) *</label>
                                        <input type="number" id="extractionTime" name="extractionTime" 
                                               min="1" placeholder="180" required>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="coffeeAmount">커피 양 (g) *</label>
                                        <input type="number" id="coffeeAmount" name="coffeeAmount" 
                                               min="0.1" step="0.1" placeholder="18.0" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="waterAmount">물 양 (ml) *</label>
                                        <input type="number" id="waterAmount" name="waterAmount" 
                                               min="1" placeholder="300" required>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="brewMethod">추출 방법 *</label>
                                    <select id="brewMethod" name="brewMethod" required>
                                        <option value="">선택하세요</option>
                                        <option value="브루잉">브루잉 (Brewing)</option>
                                        <option value="모카포트">모카포트 (Moka Pot)</option>
                                        <option value="에스프레소머신">에스프레소머신 (Espresso Machine)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <h2>📝 메모</h2>
                                
                                <div class="form-group">
                                    <label for="notes">추가 메모</label>
                                    <textarea id="notes" name="notes" 
                                              placeholder="추가로 기록하고 싶은 내용을 입력하세요..."></textarea>
                                </div>
                            </div>
                            
                            <div class="btn-group">
                                <button type="submit" class="btn btn-primary">
                                    🧪 실험 시작하기
                                </button>
                                <button type="reset" class="btn btn-secondary">
                                    🔄 초기화
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="nav-links">
                        <a href="/dashboard">📊 대시보드</a>
                        <a href="/experiment-form">🔄 새 실험</a>
                    </div>
                </div>
                
                <script>
                    const form = document.getElementById('experimentForm');
                    const successAlert = document.getElementById('successAlert');
                    const errorAlert = document.getElementById('errorAlert');
                    const loading = document.getElementById('loading');
                    
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        // 알림 숨기기
                        successAlert.classList.remove('show');
                        errorAlert.classList.remove('show');
                        loading.classList.add('show');
                        
                        // 폼 데이터 수집
                        const formData = {
                            coffeeBean: document.getElementById('coffeeBean').value,
                            roastLevel: document.getElementById('roastLevel').value,
                            grindSize: parseFloat(document.getElementById('grindSize').value),
                            waterTemperature: parseFloat(document.getElementById('waterTemperature').value),
                            coffeeAmount: parseFloat(document.getElementById('coffeeAmount').value),
                            waterAmount: parseFloat(document.getElementById('waterAmount').value),
                            brewMethod: document.getElementById('brewMethod').value,
                            extractionTime: parseInt(document.getElementById('extractionTime').value),
                            notes: document.getElementById('notes').value
                        };
                        
                        try {
                            const response = await fetch('/api/experiments', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(formData)
                            });
                            
                            if (response.ok) {
                                const result = await response.json();
                                successAlert.classList.add('show');
                                
                                // 실험 ID 저장 (완료 폼에서 사용)
                                sessionStorage.setItem('currentExperimentId', result.id);
                                
                                // 2초 후 완료 폼으로 이동
                                setTimeout(() => {
                                    window.location.href = '/complete-form?id=' + result.id;
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
            """;
    }
}

