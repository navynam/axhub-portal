/**
 * 커뮤니티 서비스 (백엔드 연동 seam) — [담당: 개발자 B]
 * ▶ 매핑 백엔드 엔드포인트: CommunityController (/api/v1/community)
 */
import { http } from '../../../shared/api/http'
import { USE_API } from '../../../shared/api/config'
import { store } from '../../../store'

/** GET /community/boards — 게시판 목록(+요약) */
export async function fetchBoards() {
  if (USE_API) return http.get('/community/boards')
  return store.boards
}

/** GET /community/boards/{id}/posts — 게시판 글 목록 */
export async function fetchPosts(boardId) {
  if (USE_API) return http.get(`/community/boards/${boardId}/posts`)
  return store.boards.find(b => b.id === boardId)?.posts || []
}
