/**
 * 권한 신청(결재선) 서비스 — [담당: 개발자 C]
 * -----------------------------------------------------------------------------
 * "화면(AccessRequest.vue)"이 쓰는 데이터와 제출 로직을 한곳에 모았다.
 * 화면에는 UI 만 남기고, 데이터/통신은 이 서비스가 담당한다. (역할 분리 = 읽기 쉬움)
 *
 * 지금은 목(mock) 데이터/데모 제출이며, 프로세스 확정 후 백엔드 API 와 연동한다.
 */
import { USE_API } from '../../../shared/api/config'
import { http } from '../../../shared/api/http'

/**
 * 결재자 후보 목록 (샘플).
 * 실제로는 조직도/사용자 검색 API 로 조회한다.
 * @type {Array<{ id:string, name:string, dept:string, title:string }>}
 */
export const APPROVER_CANDIDATES = [
  { id: 'p1', name: '김부장', dept: '마케팅팀', title: '팀장' },
  { id: 'p2', name: '이상무', dept: '마케팅본부', title: '본부장' },
  { id: 'p3', name: '박차장', dept: '정보시스템부', title: '운영관리자' },
  { id: 'p4', name: '최과장', dept: '준법감시부', title: '준법담당' },
  { id: 'p5', name: '정팀장', dept: '데이터플랫폼팀', title: '팀장' },
]

/** 사용 기간 선택지 */
export const PERIOD_OPTIONS = ['~2026-09-30', '~2026-12-31', '~2027-06-30', '상시']

/**
 * 기본 결재선: 팀장 → 본부장 → 운영관리자 (후보 앞 3명).
 * 매번 새 배열/객체를 만들어 화면 상태와 원본이 섞이지 않게 한다.
 */
export function defaultApprovalLine() {
  return APPROVER_CANDIDATES.slice(0, 3).map(person => ({ ...person }))
}

/**
 * 권한 신청 제출.
 * @param {{ agentIds:string[], reason:string, period:string, line:object[] }} payload
 * @returns {Promise<object>}
 */
export async function submitAccessRequest(payload) {
  if (USE_API) {
    // 프로세스 확정 후: 백엔드에 신청 생성 (결재선 포함)
    return http.post('/access-requests', payload)
  }
  // 데모: 실제 저장 없이 payload 를 그대로 돌려준다.
  return { ok: true, ...payload }
}
