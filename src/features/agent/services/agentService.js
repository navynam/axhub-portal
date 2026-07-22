/**
 * Agent 서비스 (백엔드 연동 seam) — [담당: 개발자 A]
 * -----------------------------------------------------------------------------
 * 화면(store)과 백엔드 사이의 경계. 지금은 USE_API=false 라 목데이터(store)를 반환하고,
 * 백엔드 준비가 끝나면 USE_API=true 로 바꿔 http 호출로 전환한다.
 * ▶ 매핑 백엔드 엔드포인트: AgentController (/api/v1/agents)
 *
 * 화면 → store(액션) → (이 service) → http → 백엔드
 * 표준화를 위해 목록/상세 조회는 이 service 를 통하도록 점진 전환하는 것을 권장한다.
 */
import { http } from '../../../shared/api/http'
import { USE_API } from '../../../shared/api/config'
import { store } from '../../../store'

/** GET /agents — Agent 목록 */
export async function fetchAgents() {
  if (USE_API) return http.get('/agents')
  return store.agents // mock
}

/** GET /agents/{id} — Agent 상세 */
export async function fetchAgent(id) {
  if (USE_API) return http.get(`/agents/${id}`)
  return store.agents.find(a => a.id === id) || null
}

/** PATCH /agents/{id}/active — 내 소유 Agent 활성/비활성 */
export async function updateActive(id, active) {
  if (USE_API) return http.patch(`/agents/${id}/active`, { active })
  const a = store.agents.find(x => x.id === id)
  if (a) a.active = active
  return a
}

/** PATCH /agents/{id}/favorite — 즐겨찾기 토글 */
export async function updateFavorite(id, fav) {
  if (USE_API) return http.patch(`/agents/${id}/favorite`, { fav })
  const a = store.agents.find(x => x.id === id)
  if (a) a.fav = fav
  return a
}
