import { useState } from 'react'
import { analyzeIngredients, scrapeIngredients } from '../services/api'
import type { IngredientAnalysisResponse } from '../types'
import './IngredientAnalyzer.css'

const IngredientAnalyzer = () => {
  const [ingredients, setIngredients] = useState('')
  const [skinType, setSkinType] = useState('oily')
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [result, setResult] = useState<IngredientAnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scrapeResult, setScrapeResult] = useState<{success: string[], failed: string[], skipped: string[]} | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await analyzeIngredients(ingredients, skinType)
      setResult(data)
    } catch (err) {
      setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4caf50'
    if (score >= 60) return '#8bc34a'
    if (score >= 40) return '#ff9800'
    return '#f44336'
  }

  const getScoreDescription = (score: number): string => {
    if (score >= 80) return '매우 적합'
    if (score >= 60) return '일반적으로 적합'
    if (score >= 40) return '다소 부적합'
    return '권장하지 않음'
  }

  // 알 수 없는 성분들 찾기
  const getUnknownIngredients = (): string[] => {
    if (!result) return []
    return result.analyzed_ingredients
      .filter(ing => ing.effect === '알 수 없음')
      .map(ing => ing.name)
  }

  // 성분 정보 업데이트 및 재분석
  const handleUpdateUnknownIngredients = async () => {
    const unknownIngredientNames = getUnknownIngredients()
    if (unknownIngredientNames.length === 0) return

    setUpdating(true)
    setError(null)

    try {
      // 크롤링 요청
      const scrapeResult = await scrapeIngredients(unknownIngredientNames, 1.0)
      
      console.log('크롤링 결과:', scrapeResult)
      
      // 크롤링 결과를 상태에 저장
      setScrapeResult(scrapeResult.results)
      
      // 업데이트 결과 확인
      const hasUpdates = scrapeResult.results.success.length > 0
      const hasSkipped = scrapeResult.results.skipped.length > 0
      const hasFailed = scrapeResult.results.failed.length > 0
      
      // 항상 재분석 수행 (데이터베이스가 업데이트되었거나, 이미 있는 정보를 찾을 수 있을 수 있으므로)
      const updatedResult = await analyzeIngredients(ingredients, skinType)
      setResult(updatedResult)
      
      // 재분석 후 알 수 없는 성분 개수 확인
      const stillUnknown = updatedResult.analyzed_ingredients.filter(ing => ing.effect === '알 수 없음').length
      const foundCount = unknownIngredientNames.length - stillUnknown
      
      // 오류 메시지 초기화
      setError(null)
    } catch (err) {
      setError('업데이트 중 오류가 발생했습니다. 다시 시도해주세요.')
      console.error('업데이트 오류:', err)
    } finally {
      setUpdating(false)
    }
  }

  const unknownCount = result ? getUnknownIngredients().length : 0

  return (
    <div className="ingredient-analyzer">
      <form onSubmit={handleSubmit} className="analyzer-form">
        <div className="form-group">
          <label htmlFor="skinType">피부 타입</label>
          <select
            id="skinType"
            value={skinType}
            onChange={(e) => setSkinType(e.target.value)}
            className="form-select"
          >
            <option value="oily">지성</option>
            <option value="dry">건성</option>
            <option value="sensitive">민감성</option>
            <option value="combination">복합성</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ingredients">성분표 입력</label>
          <textarea
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="예: 황색 4호, 벤젠, 라우릴설페이트나트륨, 글리세린&#10;성분을 쉼표 또는 줄바꿈으로 구분하여 입력하세요"
            className="form-textarea"
            rows={8}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? '분석 중...' : '분석하기'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      )}
      
      {updating && (
        <div className="updating-message">
          🔄 성분 정보를 검색 중입니다. 잠시만 기다려주세요...
        </div>
      )}

      {/* 크롤링 결과 표시 */}
      {scrapeResult && !updating && (
        <div className="scrape-result">
          <h4>📊 성분 정보 검색 결과</h4>
          
          {scrapeResult.success.length > 0 && (
            <div className="result-item success">
              <strong>✅ 성공 ({scrapeResult.success.length}개):</strong>
              <div className="ingredient-list">
                {scrapeResult.success.map((name, idx) => (
                  <span key={idx} className="ingredient-badge success">{name}</span>
                ))}
              </div>
            </div>
          )}
          
          {scrapeResult.skipped.length > 0 && (
            <div className="result-item info">
              <strong>ℹ️ 데이터베이스에 이미 있음 ({scrapeResult.skipped.length}개):</strong>
              <div className="ingredient-list">
                {scrapeResult.skipped.map((name, idx) => (
                  <span key={idx} className="ingredient-badge info">{name}</span>
                ))}
              </div>
            </div>
          )}
          
          {scrapeResult.failed.length > 0 && (
            <div className="result-item failed">
              <strong>⚠️ 검색 실패 ({scrapeResult.failed.length}개):</strong>
              <div className="ingredient-list">
                {scrapeResult.failed.map((name, idx) => (
                  <span key={idx} className="ingredient-badge failed">{name}</span>
                ))}
              </div>
              <div className="failure-note">
                💡 크롤링 기능이 아직 완전히 구현되지 않았습니다. 
                이 성분들은 수동으로 데이터베이스에 추가되거나, 추후 크롤링 기능이 개선되면 자동으로 업데이트됩니다.
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setScrapeResult(null)} 
            className="close-result-button"
          >
            닫기
          </button>
        </div>
      )}

      {result && (
        <div className="analysis-result">
          <div className="result-header">
            <h2>분석 결과</h2>
            <div className="skin-compatibility">
              {result.skin_type_compatibility}
            </div>
          </div>

          {/* 종합 분석 결과 */}
          {result.comprehensive_analysis && (
            <div className="comprehensive-analysis">
              <h3>🎯 종합 분석</h3>
              
              {/* 적합성 점수 */}
              <div className="score-section">
                <div className="score-label">적합성 점수</div>
                <div className="score-container">
                  <div className="score-circle" style={{
                    background: `conic-gradient(
                      ${getScoreColor(result.comprehensive_analysis.suitability_score)} 0deg ${result.comprehensive_analysis.suitability_score * 3.6}deg,
                      #e0e0e0 ${result.comprehensive_analysis.suitability_score * 3.6}deg 360deg
                    )`
                  }}>
                    <div className="score-inner">
                      <span className="score-number" style={{ color: getScoreColor(result.comprehensive_analysis.suitability_score) }}>
                        {result.comprehensive_analysis.suitability_score}
                      </span>
                      <span className="score-max">/ 100</span>
                    </div>
                  </div>
                  <div className="score-text" style={{ color: getScoreColor(result.comprehensive_analysis.suitability_score) }}>
                    {getScoreDescription(result.comprehensive_analysis.suitability_score)}
                  </div>
                </div>
              </div>

              {/* 주요 효과 */}
              {result.comprehensive_analysis.primary_effects.length > 0 && (
                <div className="analysis-section">
                  <h4>✨ 주요 효과</h4>
                  <div className="effects-list">
                    {result.comprehensive_analysis.primary_effects.map((effect, idx) => (
                      <span key={idx} className="effect-tag">{effect}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 예상 결과 */}
              <div className="analysis-section">
                <h4>📊 예상되는 결과</h4>
                <p className="analysis-text">{result.comprehensive_analysis.expected_results}</p>
              </div>

              {/* 상세 평가 */}
              <div className="analysis-section">
                <h4>📝 상세 평가</h4>
                <p className="analysis-text">{result.comprehensive_analysis.detailed_assessment}</p>
              </div>

              {/* 추천사항 */}
              {result.comprehensive_analysis.recommendations.length > 0 && (
                <div className="analysis-section">
                  <h4>💡 추천사항</h4>
                  <ul className="recommendations-list">
                    {result.comprehensive_analysis.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 주의사항 요약 */}
              {result.comprehensive_analysis.warnings_summary.length > 0 && (
                <div className="analysis-section warning-section">
                  <h4>⚠️ 주의사항</h4>
                  <ul className="warnings-list">
                    {result.comprehensive_analysis.warnings_summary.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="overall-assessment">
            {result.overall_assessment}
          </div>

          <div className="ingredients-list">
            <div className="ingredients-header">
              <h3>성분 상세 분석</h3>
              {unknownCount > 0 && (
                <button
                  onClick={handleUpdateUnknownIngredients}
                  disabled={updating}
                  className="update-button"
                  title={`알 수 없는 성분 ${unknownCount}개의 정보를 자동으로 검색합니다`}
                >
                  {updating ? '🔄 업데이트 중...' : '🔄 성분 정보 업데이트'}
                </button>
              )}
            </div>
            {unknownCount > 0 && !updating && (
              <div className="update-notice">
                💡 알 수 없는 성분이 {unknownCount}개 있습니다. 업데이트 버튼을 눌러 정보를 검색하세요.
              </div>
            )}
            {result.analyzed_ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-card">
                <div className="ingredient-name">{ingredient.name}</div>
                <div className="ingredient-info">
                  <div className="info-item">
                    <span className="info-label">효과:</span>
                    <span className="info-value">{ingredient.effect}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">사용 목적:</span>
                    <span className="info-value">{ingredient.purpose}</span>
                  </div>
                  {ingredient.warning && (
                    <div className="info-item warning">
                      <span className="info-label">⚠️ 주의:</span>
                      <span className="info-value">{ingredient.warning}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default IngredientAnalyzer

