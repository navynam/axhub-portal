/**
 * Agent 도메인 액션 — [담당: 개발자 A]
 * -----------------------------------------------------------------------------
 * Agent 카탈로그/상세에서 쓰는 상태 변경 동작.
 * (목록/실행가능 여부 계산은 resource 모듈, 실행/대화는 conversation 모듈 참고)
 */
import { store } from '../state'
import { toast } from './ui'

/** 내 소유 Agent 활성/비활성 토글 (활성 상태여야 실행 가능) */
export function toggleActive(agent) {
  agent.active = !agent.active
  toast(`'${agent.name}' ${agent.active ? '활성화' : '비활성화'}되었습니다.`, agent.active ? 'ok' : 'info')
}

/** 전사 에이전트 그룹 생성 (중복 무시). 생성된 그룹명을 반환 */
export function addAgentGroup(name) {
  const clean = (name || '').trim()
  if (!clean) return null
  if (!store.agentGroups.includes(clean)) store.agentGroups.push(clean)
  return clean
}
export { addAgentGroup as addFolder } // 하위호환 별칭

/** 에이전트를 그룹으로 이동(소속 변경) */
export function moveAgentToFolder(agent, folder) {
  agent.folder = folder
  toast(`‘${agent.name}’을(를) ‘${folder}’ 그룹으로 이동했습니다.`, 'ok')
}
/** 에이전트를 그룹에서 제외(미분류로) */
export function removeAgentFromGroup(agent) {
  agent.folder = '미분류'
  toast(`‘${agent.name}’을(를) 그룹에서 제외했습니다.`, 'info')
}

/* ── 내 Agent 개인 폴더 (전사 그룹과 별개) ── */
/** 개인 폴더 생성 (중복 무시). 생성된 폴더명 반환 */
export function addMyFolder(name) {
  const clean = (name || '').trim()
  if (!clean) return null
  if (!store.myFolders.includes(clean)) store.myFolders.push(clean)
  return clean
}
/** 에이전트를 개인 폴더로 이동 */
export function moveAgentToMyFolder(agent, folder) {
  agent.myFolder = folder
  toast(`‘${agent.name}’을(를) ‘${folder}’ 폴더로 옮겼습니다.`, 'ok')
}

/** 즐겨찾기 토글 (대시보드/카탈로그 즐겨찾기 탭에 반영) */
export function toggleFavorite(agent) {
  agent.fav = !agent.fav
  toast(`'${agent.name}'을(를) 즐겨찾기에 ${agent.fav ? '추가했습니다' : '해제했습니다'}.`, agent.fav ? 'ok' : 'info')
}
