/**
 * 권한 요청/승인 서비스 (백엔드 연동 seam) — [담당: 개발자 C]
 * ▶ 매핑 백엔드 엔드포인트: PermissionController (/api/v1/requests)
 */
import { http } from '../../../shared/api/http'
import { USE_API } from '../../../shared/api/config'
import { store } from '../../../store'

/** GET /requests?scope=mine|approve — 요청 목록 (내 요청함/승인함) */
export async function fetchRequests(scope = 'mine') {
  if (USE_API) return http.get(`/requests?scope=${scope}`)
  // mock: 화면(Permissions.vue)에서 store.requests 를 직접 필터링 중
  return store.requests
}

/** POST /requests — 권한 요청 생성 */
export async function createRequest(payload) {
  if (USE_API) return http.post('/requests', payload)
  return payload // mock: 실제 생성은 store.submitRequest / requestResource 에서 수행
}

/** POST /requests/{id}/approve — 승인 */
export async function approveRequest(id) {
  if (USE_API) return http.post(`/requests/${id}/approve`)
  return { id, status: 'approved' }
}

/** POST /requests/{id}/deny — 반려 (사유 필수) */
export async function denyRequest(id, reason) {
  if (USE_API) return http.post(`/requests/${id}/deny`, { reason })
  return { id, status: 'denied', reason }
}

/** DELETE /requests/{id} — 요청 취소 */
export async function cancelRequestApi(id) {
  if (USE_API) return http.del(`/requests/${id}`)
  return { id }
}
