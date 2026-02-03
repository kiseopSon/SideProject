import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import keycloak, { keycloakConfig } from '../config/keycloak'
import type Keycloak from 'keycloak-js'

interface AuthContextType {
  keycloak: Keycloak | null
  authenticated: boolean
  loading: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  keycloak: null,
  authenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // URL에서 인증 코드 제거 함수
  const cleanAuthCodeFromUrl = () => {
    if (typeof window === 'undefined') return
    
    const hash = window.location.hash
    if (hash && (hash.includes('state=') || hash.includes('code=') || hash.includes('session_state='))) {
      // 즉시 URL에서 해시 제거
      window.history.replaceState({}, '', window.location.pathname + window.location.search)
    }
  }

  // Keycloak 토큰을 동기적으로 확인하여 즉시 인증 상태 설정
  // 주의: Keycloak이 실제로 초기화되었는지 확인해야 함
  const checkTokenSync = () => {
    // keycloak 인스턴스가 없으면 false
    if (!keycloak) {
      return false
    }
    
    // Keycloak이 이미 초기화되었는지 확인 (authenticated가 undefined가 아님)
    // 초기화되지 않았으면 false 반환 (localStorage에 토큰이 있어도 초기화 전까지는 false)
    if (keycloak.authenticated === undefined) {
      return false
    }
    
    // Keycloak이 이미 초기화되어 있고 인증된 경우
    if (keycloak.authenticated === true) {
      return true
    }
    
    // Keycloak 인스턴스에 토큰이 있는지 확인 (초기화 후)
    if (keycloak.token) {
      return true
    }
    
    return false
  }

  // 초기 상태: 토큰이 있으면 인증 상태로 시작, 없으면 로딩 상태
  const hasInitialToken = checkTokenSync()
  
  // 컴포넌트 마운트 시 즉시 URL 정리
  if (typeof window !== 'undefined') {
    cleanAuthCodeFromUrl()
  }
  
  // 토큰이 있으면 인증 상태로 시작, 없으면 로딩 상태로 시작
  const [authenticated, setAuthenticated] = useState(hasInitialToken)
  const [loading, setLoading] = useState(!hasInitialToken) // 토큰이 없을 때만 로딩

  useEffect(() => {
    // hashchange 이벤트 리스너: URL 해시 변경 시 즉시 정리 (무한 리다이렉트 방지)
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash && (hash.includes('state=') || hash.includes('code=') || hash.includes('session_state='))) {
        // Keycloak이 인증 코드를 처리할 시간을 주기 위해 약간의 지연
        setTimeout(() => {
          cleanAuthCodeFromUrl()
        }, 2000) // 더 긴 지연으로 Keycloak이 인증 코드를 완전히 처리할 시간 확보
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    
    // 초기 로드 시에도 해시 확인
    if (window.location.hash && (window.location.hash.includes('state=') || window.location.hash.includes('code='))) {
      // Keycloak이 인증 코드를 처리할 시간을 주기 위해 지연
      setTimeout(() => {
        cleanAuthCodeFromUrl()
      }, 2000)
    }

    // 중복 초기화 방지 플래그 (모듈 레벨로 이동하여 영구 보존)
    const initKey = 'keycloak_initialized'
    if (keycloak && sessionStorage.getItem(initKey) === 'true' && keycloak.authenticated !== undefined) {
      setAuthenticated(keycloak.authenticated)
      setLoading(false)
      cleanAuthCodeFromUrl()
      return () => {
        window.removeEventListener('hashchange', handleHashChange)
      }
    }

    // keycloak 인스턴스가 없으면 에러
    if (!keycloak) {
      console.error('Keycloak 인스턴스를 찾을 수 없습니다.')
      setAuthenticated(false)
      setLoading(false)
      return () => {
        window.removeEventListener('hashchange', handleHashChange)
      }
    }

    // Keycloak이 이미 초기화되었는지 확인
    if (keycloak.authenticated !== undefined) {
      // 이미 초기화된 경우 상태 동기화만 수행
      setAuthenticated(keycloak.authenticated)
      setLoading(false)
      sessionStorage.setItem(initKey, 'true')
      // URL 정리는 Keycloak이 인증 코드를 처리한 후에 수행
      setTimeout(() => {
        cleanAuthCodeFromUrl()
      }, 1000)
      return () => {
        window.removeEventListener('hashchange', handleHashChange)
      }
    }

    // 초기화 함수
    const initializeKeycloak = () => {
      console.log('initializeKeycloak() 함수 진입')
      
      if (!keycloak) {
        console.error('Keycloak 인스턴스를 찾을 수 없습니다.')
        return
      }
      
      // 오래된 processing 상태 확인 및 정리
      const processingState = sessionStorage.getItem(initKey)
      if (processingState === 'processing') {
        console.log('이미 초기화 중입니다. Keycloak 상태 확인 중...')
        
        // Keycloak이 실제로 초기화되었는지 확인
        if (keycloak.authenticated !== undefined) {
          // 이미 초기화 완료됨
          console.log('Keycloak이 이미 초기화되었습니다. 상태 동기화:', keycloak.authenticated)
          setAuthenticated(keycloak.authenticated)
          setLoading(false)
          sessionStorage.setItem(initKey, 'true')
          return
        }
        
        // 초기화가 진행 중이지만 완료되지 않음 - 오래된 상태로 간주하고 재시도
        console.warn('오래된 processing 상태 감지. 초기화를 재시도합니다.')
        sessionStorage.removeItem(initKey)
        // 계속 진행하여 초기화 재시도
      }
      
      console.log('초기화 시작 - sessionStorage 설정')
      sessionStorage.setItem(initKey, 'processing')

      // 초기화 옵션 - checkLoginIframe을 true로 변경하여 더 빠른 응답 받기
      const initOptions = {
        onLoad: 'check-sso' as const,
        checkLoginIframe: true, // iframe 체크 활성화하여 더 빠른 응답
        pkceMethod: 'S256' as const,
        enableLogging: true, // 디버깅을 위해 로깅 활성화
        messageReceiveTimeout: 5000, // 메시지 수신 타임아웃 5초
      }
      
      console.log('Keycloak 초기화 시작...', initOptions)
      console.log('Keycloak Config:', {
        url: keycloakConfig.url,
        realm: keycloakConfig.realm,
        clientId: keycloakConfig.clientId,
        redirectUri: keycloakConfig.redirectUri
      })

      // 초기화 타임아웃 설정 (5초로 단축)
      let timeoutFired = false
      const initTimeout = setTimeout(() => {
        if (!timeoutFired) {
          timeoutFired = true
          console.error('Keycloak 초기화 타임아웃 (5초) - Keycloak 서버가 응답하지 않습니다.')
          console.error('Keycloak 서버 상태 확인: http://localhost:8090')
          console.error('Keycloak Realm 확인: http://localhost:8090/realms/sosadworld')
          setAuthenticated(false)
          setLoading(false)
          sessionStorage.removeItem(initKey)
          
          // 타임아웃 시 사용자에게 알림
          alert('Keycloak 서버에 연결할 수 없습니다. Keycloak이 실행 중이고 realm이 설정되어 있는지 확인해주세요. (http://localhost:8090/realms/sosadworld)')
        }
      }, 5000)

      console.log('keycloak.init() 호출 전...', new Date().toISOString())
      const initStartTime = Date.now()
      
      keycloak.init(initOptions)
        .then((isAuthenticated) => {
          if (timeoutFired) {
            console.log('타임아웃이 이미 발생했으므로 결과 무시')
            return
          }
          clearTimeout(initTimeout) // 타임아웃 취소
          
          const initEndTime = Date.now()
          const initDuration = initEndTime - initStartTime
          console.log(`Keycloak 초기화 완료 (${initDuration}ms), 인증 상태:`, isAuthenticated)
          
          // 상태 업데이트 (함수형으로 최소화)
          setAuthenticated(isAuthenticated)
          setLoading(false)
          sessionStorage.setItem(initKey, 'true')
          
          // 인증 코드 처리 후 URL 정리 (Keycloak이 인증 코드를 처리할 시간을 주기 위해 지연)
          setTimeout(() => {
            cleanAuthCodeFromUrl()
          }, 1000)
          
          // 인증되지 않았으면 자동으로 로그인 페이지로 리다이렉트
          if (!isAuthenticated && typeof keycloak.login === 'function') {
            console.log('인증되지 않았습니다. 로그인 페이지로 리다이렉트합니다.')
            keycloak.login()
          }
        })
        .catch((error) => {
          if (timeoutFired) {
            console.log('타임아웃이 이미 발생했으므로 에러 무시')
            return
          }
          clearTimeout(initTimeout) // 타임아웃 취소
          
          console.error('Keycloak 초기화 실패:', error)
          console.error('에러 상세:', error.message, error.stack)
          setAuthenticated(false)
          setLoading(false)
          sessionStorage.removeItem(initKey)
          
          // 에러 시에도 URL 정리
          setTimeout(() => {
            cleanAuthCodeFromUrl()
          }, 500)
          
          // 에러 시 사용자에게 알림
          alert(`Keycloak 초기화 실패: ${error.message || '알 수 없는 오류'}. Keycloak 서버가 실행 중인지 확인해주세요.`)
        })
    }

    // 항상 초기화 실행
    console.log('Keycloak 초기화 함수 호출, hasInitialToken:', hasInitialToken)
    if (hasInitialToken) {
      // 토큰이 있으면 바로 초기화 시작
      console.log('토큰이 있음, 초기화 시작')
      initializeKeycloak()
    } else {
      // 토큰이 없으면 로딩 표시 후 초기화
      console.log('토큰이 없음, 로딩 상태로 초기화 시작')
      setLoading(true)
      initializeKeycloak()
    }

    // 토큰 만료 시 자동 갱신
    if (keycloak) {
      keycloak.onTokenExpired = () => {
        if (keycloak) {
          keycloak.updateToken(30).catch(() => {
            if (keycloak) {
              keycloak.logout()
            }
          })
        }
      }

      // 인증 상태 변경 감지
      keycloak.onAuthSuccess = () => {
        setAuthenticated(true)
        setLoading(false)
        sessionStorage.setItem(initKey, 'true')
        
        // 인증 성공 후 즉시 URL 정리
        cleanAuthCodeFromUrl()
      }

      keycloak.onAuthError = () => {
        setAuthenticated(false)
        setLoading(false)
        sessionStorage.removeItem(initKey)
        
        // 에러 시 즉시 URL 정리
        cleanAuthCodeFromUrl()
      }

      keycloak.onAuthLogout = () => {
        setAuthenticated(false)
        sessionStorage.removeItem(initKey)
        cleanAuthCodeFromUrl()
      }
    }

    // cleanup: 이벤트 리스너 제거
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, []) // 의존성 배열 비워서 한 번만 실행

  const login = () => {
    try {
      // Keycloak이 존재하고, 초기화되었는지 확인 (authenticated가 undefined가 아님)
      if (keycloak && keycloak.authenticated !== undefined && typeof keycloak.login === 'function') {
        keycloak.login()
      } else if (keycloak && keycloak.authenticated === undefined) {
        // Keycloak이 아직 초기화되지 않았으면 초기화 대기
        console.warn('Keycloak이 아직 초기화되지 않았습니다. 초기화를 기다립니다.')
        // 초기화가 완료될 때까지 대기 후 재시도
        const checkInitialized = setInterval(() => {
          if (keycloak && keycloak.authenticated !== undefined) {
            clearInterval(checkInitialized)
            if (keycloak && typeof keycloak.login === 'function') {
              keycloak.login()
            }
          }
        }, 100)
        
        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkInitialized)
          console.error('Keycloak 초기화 타임아웃')
        }, 10000)
      } else {
        console.error('Keycloak 인스턴스가 초기화되지 않았거나 login 메서드가 없습니다.', keycloak)
      }
    } catch (error) {
      console.error('Keycloak login 실패:', error)
    }
  }

  const logout = () => {
    try {
      if (!keycloak) {
        console.error('Keycloak 인스턴스가 없습니다.')
        return
      }
      
      // Keycloak이 초기화되었는지 확인
      if (keycloak.authenticated === undefined) {
        console.warn('Keycloak이 아직 초기화되지 않았습니다.')
        return
      }
      
      if (typeof keycloak.logout === 'function') {
        keycloak.logout({ redirectUri: window.location.origin })
      } else {
        console.error('Keycloak logout 메서드가 없습니다.')
      }
    } catch (error) {
      console.error('Keycloak logout 실패:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        keycloak,
        authenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
