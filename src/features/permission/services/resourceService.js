/**
 * 리소스(도구) 권한 서비스 (백엔드 연동 seam) — [담당: 개발자 C]
 * ▶ 매핑 백엔드 엔드포인트: ResourceController (/api/v1/resources)
 */
import { http } from '../../../shared/api/http'
import { USE_API } from '../../../shared/api/config'
import { store } from '../../../store'

/** GET /resources/me — 내 도구 권한 맵 { name: { owner, perm } } */
export async function fetchMyResources() {
  if (USE_API) return http.get('/resources/me')
  return store.resources
}

/** POST /resources/{name}/request — 도구 권한 요청 */
export async function requestResourceApi(name) {
  if (USE_API) return http.post(`/resources/${encodeURIComponent(name)}/request`)
  return { name, perm: 'pending' }
}
