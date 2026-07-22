/**
 * 인증 서비스 (백엔드 연동 seam) — [담당: 공통 개발자]
 * ▶ 매핑 백엔드 엔드포인트: AuthController (/api/v1/auth)
 * 로그인 → JWT 발급 → localStorage 저장 → 이후 http 가 Authorization 헤더 자동 첨부.
 */
import { http } from '../../../shared/api/http'
import { USE_API, TOKEN_KEY } from '../../../shared/api/config'
import { store } from '../../../store'

/** POST /auth/login — 로그인. 성공 시 토큰 저장 후 사용자 정보 반환 */
export async function login(username, password) {
  if (USE_API) {
    const { accessToken, user } = await http.post('/auth/login', { username, password })
    localStorage.setItem(TOKEN_KEY, accessToken)
    return user
  }
  return store.user // mock: 데모 사용자
}

/** GET /auth/me — 현재 로그인 사용자 */
export async function me() {
  if (USE_API) return http.get('/auth/me')
  return store.user
}

/** 로그아웃 — 토큰 제거 */
export function logout() {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* noop */ }
}
