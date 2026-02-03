import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../utils/axios'
import { useAuth } from '../context/AuthContext'
import './DiaryPage.css'

function DiaryPage() {
  const [content, setContent] = useState('')
  const [diaries, setDiaries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState<number | null>(null)
  const navigate = useNavigate()
  const { authenticated, loading: authLoading } = useAuth()

  useEffect(() => {
    // 인증이 완료되고 인증된 상태에서만 일기 목록 로드
    if (!authLoading && authenticated) {
      loadDiaries()
    }
  }, [authenticated, authLoading])

  const loadDiaries = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/diaries')
      setDiaries(response.data)
    } catch (error) {
      console.error('일기 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await apiClient.post('/diaries', { content })
      setDiaries([response.data, ...diaries])
      setContent('')
    } catch (error) {
      console.error('일기 저장 실패:', error)
      alert('일기 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async (diaryId: number, diaryContent: string) => {
    try {
      setAnalyzing(diaryId)
      const response = await apiClient.post('/analysis', {
        diaryId: diaryId,
        diaryContent: diaryContent
      })
      // 분석 결과를 AnalysisPage로 전달
      navigate('/analysis', { state: { analysis: response.data } })
    } catch (error) {
      console.error('분석 실패:', error)
      alert('분석에 실패했습니다.')
      setAnalyzing(null)
    }
  }

  return (
    <div className="diary-page">
      <h2>일기 작성</h2>
      <form onSubmit={handleSubmit} className="diary-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 하루는 어떠셨나요?"
          className="diary-textarea"
          rows={10}
        />
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? '저장 중...' : '저장'}
        </button>
      </form>
      
      <div className="diary-list">
        <h3>내 일기 목록</h3>
        {loading && diaries.length === 0 ? (
          <p>로딩 중...</p>
        ) : diaries.length === 0 ? (
          <p>작성된 일기가 없습니다.</p>
        ) : (
          diaries.map((diary) => (
          <div key={diary.id} className="diary-item">
            <p>{diary.content}</p>
            <small>{new Date(diary.createdAt).toLocaleString()}</small>
            <button 
              onClick={() => handleAnalyze(diary.id, diary.content)}
              disabled={analyzing === diary.id}
              className="analyze-button"
            >
              {analyzing === diary.id ? '분석 중...' : '분석하기'}
            </button>
          </div>
        )))}
      </div>
    </div>
  )
}

export default DiaryPage
