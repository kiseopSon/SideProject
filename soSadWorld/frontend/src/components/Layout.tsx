import { ReactNode, memo, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

const Layout = memo(function Layout({ children }: LayoutProps) {
  const { authenticated, login, logout, loading } = useAuth()

  // 인증 버튼 렌더링 메모이제이션
  const authButton = useMemo(() => {
    if (loading) {
      return <div className="auth-button-placeholder"></div>
    }
    return authenticated ? (
      <button onClick={logout} className="auth-button">로그아웃</button>
    ) : (
      <button onClick={login} className="auth-button">로그인</button>
    )
  }, [loading, authenticated, login, logout])

  // 메인 컨텐츠 렌더링 메모이제이션
  const mainContent = useMemo(() => {
    // 로딩 중이면 항상 로딩 화면 표시
    if (loading) {
      return <div className="loading">로딩 중...</div>
    }
    
    // 로딩이 완료되고 인증되었을 때만 컨텐츠 표시
    if (authenticated) {
      return children
    }
    
    // 로딩이 완료되었지만 인증되지 않았으면 로그인 프롬프트 표시
    return (
      <div className="login-prompt">
        <p>로그인이 필요합니다.</p>
        <button onClick={login} className="login-button">로그인</button>
      </div>
    )
  }, [loading, authenticated, children, login])

  return (
    <div className="layout">
      <header className="header">
        <h1>soSadWorld</h1>
        <nav>
          <Link to="/">일기</Link>
          <Link to="/analysis">분석</Link>
          {authButton}
        </nav>
      </header>
      <main className="main">
        {mainContent}
      </main>
    </div>
  )
})

export default Layout
