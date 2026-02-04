import IngredientAnalyzer from './components/IngredientAnalyzer'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🧴 화장품 성분 분석기</h1>
        <p>성분표를 입력하면 각 성분의 효과를 분석해드립니다</p>
      </header>
      <main>
        <IngredientAnalyzer />
      </main>
    </div>
  )
}

export default App

