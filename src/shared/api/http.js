/**
 * HTTP 클라이언트 (공통 개발자 담당)
 * -----------------------------------------------------------------------------
 * 실제 백엔드(REST) 호출을 담당하는 얇은 래퍼다. 브라우저 내장 fetch 를 사용하므로
 * 별도 의존성이 없다. (팀 표준으로 axios 를 쓰고 싶다면 이 파일만 axios 로 교체하면 된다.)
 *
 * 제공 기능
 *  - 공통 baseURL(API_BASE) 접두어 자동 부착
 *  - 로그인 토큰(JWT) 을 Authorization 헤더에 자동 첨부
 *  - JSON 직렬화/역직렬화
 *  - 백엔드 표준 응답 { success, data, message } 언랩(unwrap)
 *  - 에러를 HttpError 로 정규화 (화면단에서 일관되게 처리)
 *
 * 사용 예)
 *   import { http } from '@/shared/api/http'
 *   const agents = await http.get('/agents')
 *   const created = await http.post('/agents', { name: '...' })
 */
import { API_BASE, TOKEN_KEY } from './config'

/** 정규화된 HTTP 에러 (화면단 catch 에서 err.status / err.message 로 활용) */
export class HttpError extends Error {
  constructor(status, message, data) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.data = data
  }
}

/** 저장된 JWT 조회 (없으면 null) */
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

/**
 * 공통 요청 함수. 각 메서드(get/post/...)가 이 함수를 호출한다.
 * @param {string} method  HTTP 메서드
 * @param {string} path    API_BASE 이후 경로 (예: '/agents/ag-01')
 * @param {object} [body]  요청 바디 (JSON)
 */
async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    })
  } catch (networkErr) {
    // 네트워크 자체 실패(서버 다운, CORS 등)
    throw new HttpError(0, '서버에 연결할 수 없습니다.', networkErr)
  }

  // 204 No Content 등 바디가 없는 응답 처리
  const text = await res.text()
  const payload = text ? safeJson(text) : null

  if (!res.ok) {
    const message = payload?.message || `요청이 실패했습니다. (HTTP ${res.status})`
    throw new HttpError(res.status, message, payload)
  }

  // 백엔드 표준 응답 { success, data, message } 이면 data 만 반환, 아니면 원문 반환
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data
  return payload
}

function safeJson(text) {
  try { return JSON.parse(text) } catch { return text }
}

export const http = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
}
