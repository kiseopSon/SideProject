import Keycloak from 'keycloak-js'

export const keycloakConfig: any = {
  url: 'http://localhost:8090',
  realm: 'sosadworld',
  clientId: 'sosadworld-client'
}

// 리다이렉트 URI 명시적으로 설정 (브라우저 환경에서만)
if (typeof window !== 'undefined') {
  keycloakConfig.redirectUri = window.location.origin
}

let keycloak: Keycloak | null = null

try {
  keycloak = new Keycloak(keycloakConfig)
  console.log('Keycloak 인스턴스 생성 성공')
  console.log('Keycloak Config:', keycloakConfig)
} catch (error) {
  console.error('Keycloak 인스턴스 생성 실패:', error)
}

// keycloak이 null이 아닌지 확인하고 export
// null인 경우에도 타입 에러를 방지하기 위해 타입 단언 사용
export default keycloak as Keycloak
