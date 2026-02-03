import axios from 'axios'
import keycloak from '../config/keycloak'

const apiClient = axios.create({
  baseURL: '/api',
})

// 무한 리다이렉트 방지를 위한 플래그
let isRedirectingToLogin = false

// Request interceptor: 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    try {
      if (keycloak && keycloak.token) {
        config.headers.Authorization = `Bearer ${keycloak.token}`
      }
    } catch (error) {
      console.error('Keycloak 토큰 추가 실패:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: 401 에러 시 로그인 페이지로
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 무한 리다이렉트 방지
      try {
        // Keycloak이 존재하고, 초기화되었는지 확인 (authenticated가 undefined가 아님)
        // 그리고 login 메서드가 있고, 이미 인증되지 않았으며, 리다이렉트 중이 아닐 때
        if (
          keycloak && 
          keycloak.authenticated !== undefined && // 초기화되었는지 확인
          typeof keycloak.login === 'function' && 
          !isRedirectingToLogin && 
          !keycloak.authenticated
        ) {
          isRedirectingToLogin = true
          keycloak.login()
          // 5초 후 플래그 리셋 (타임아웃)
          setTimeout(() => {
            isRedirectingToLogin = false
          }, 5000)
        } else if (keycloak && keycloak.authenticated === undefined) {
          // Keycloak이 아직 초기화되지 않았으면 초기화 완료를 기다린 후 로그인 시도
          console.warn('Keycloak이 아직 초기화되지 않았습니다. 초기화 완료를 기다립니다.')
          
          // 초기화 완료를 확인하는 함수
          const waitForInitAndLogin = () => {
            if (!keycloak) return
            
            if (keycloak.authenticated !== undefined) {
              // 초기화 완료됨
              if (typeof keycloak.login === 'function' && !isRedirectingToLogin && !keycloak.authenticated) {
                isRedirectingToLogin = true
                keycloak.login()
                setTimeout(() => {
                  isRedirectingToLogin = false
                }, 5000)
              }
            } else {
              // 아직 초기화되지 않음, 100ms 후 다시 확인
              setTimeout(waitForInitAndLogin, 100)
            }
          }
          
          // 최대 10초 동안 대기
          waitForInitAndLogin()
          setTimeout(() => {
            console.warn('Keycloak 초기화 대기 타임아웃')
          }, 10000)
        }
      } catch (error) {
        console.error('Keycloak 로그인 리다이렉트 실패:', error)
        isRedirectingToLogin = false
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
