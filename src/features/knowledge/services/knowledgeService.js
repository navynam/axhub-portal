/**
 * 지식(RAG) 서비스 (백엔드 연동 seam) — [담당: 개발자 B]
 * ▶ 매핑 백엔드 엔드포인트: KnowledgeController (/api/v1/knowledge)
 */
import { http } from '../../../shared/api/http'
import { USE_API } from '../../../shared/api/config'
import { store } from '../../../store'

/** GET /knowledge — 지식 목록 (category, scope, q 로 필터 가능) */
export async function fetchKnowledge(params = {}) {
  if (USE_API) {
    const qs = new URLSearchParams(params).toString()
    return http.get(`/knowledge${qs ? '?' + qs : ''}`)
  }
  return store.knowledge // mock (필터는 화면 computed 에서 처리 중)
}

/** GET /knowledge/categories — 카테고리 트리 */
export async function fetchCategoryTree() {
  if (USE_API) return http.get('/knowledge/categories')
  const { knowledgeTree } = await import('../../../data.js')
  return knowledgeTree
}

/** GET /knowledge/{id} — 지식 상세 */
export async function fetchKnowledgeDetail(id) {
  if (USE_API) return http.get(`/knowledge/${id}`)
  return store.knowledge.find(k => k.id === id) || null
}
