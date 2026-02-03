import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DiaryPage from './pages/DiaryPage'
import AnalysisPage from './pages/AnalysisPage'
import Layout from './components/Layout'
import './App.css'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Layout>
        <Routes>
          <Route path="/" element={<DiaryPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
