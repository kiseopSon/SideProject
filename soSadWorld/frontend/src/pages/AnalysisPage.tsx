import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import './AnalysisPage.css'

function AnalysisPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<any>(location.state?.analysis || null)

  useEffect(() => {
    if (location.state?.analysis) {
      setAnalysis(location.state.analysis)
    }
  }, [location.state])

  // 분석 결과가 있으면 차트 데이터 생성
  const chartData = analysis?.emotionScores ? [
    { 
      name: '우울', 
      value: analysis.emotionScores.depressionPercent || 0, 
      color: '#8884d8' 
    },
    { 
      name: '기쁨', 
      value: analysis.emotionScores.joyPercent || 0, 
      color: '#82ca9d' 
    },
    { 
      name: '화남', 
      value: analysis.emotionScores.angerPercent || 0, 
      color: '#ffc658' 
    },
  ] : []

  return (
    <div className="analysis-page">
      <h2>감정 분석 결과</h2>
      
      {analysis && chartData.length > 0 ? (
        <div className="analysis-result">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="analysis-details">
            <h3>현재 상황</h3>
            <p>{analysis.currentSituation || '분석 결과가 없습니다'}</p>
            
            <h3>문제 행실</h3>
            <p>{analysis.problematicBehavior || '분석 결과가 없습니다'}</p>
            
            <h3>추천 사항</h3>
            <p>{analysis.recommendation || '분석 결과가 없습니다'}</p>
            
            <div className="professional-help">
              <h3>전문가 상담 필요 여부</h3>
              <p className={analysis.needsProfessionalHelp ? 'needs-help' : 'no-help'}>
                {analysis.needsProfessionalHelp ? '상담이 필요합니다' : '현재는 상담이 필요하지 않습니다'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-analysis">
          <p>분석할 일기를 선택해주세요</p>
          <button onClick={() => navigate('/')} className="back-button">
            일기 목록으로 돌아가기
          </button>
        </div>
      )}
    </div>
  )
}

export default AnalysisPage
