/**
 * 권한 관리(관리자) 도메인 — 그룹 관리 · 담당자(오너) 변경 — [담당: 공통 개발자]
 * -----------------------------------------------------------------------------
 * · 지식 그룹(폴더) 생성/이동 (에이전트 폴더는 agent 모듈 addFolder/moveAgentToFolder 재사용)
 * · 에이전트/지식 담당자(오너) 변경 — 담당자 퇴사·부서 이동 시 신규 담당자 배정
 */
import { store } from '../state'
import { toast } from './ui'

/** 담당자 배정 후보 (신규 담당자 선택용) */
export const MANAGER_CANDIDATES = [
  { name: '김지훈', dept: 'AX추진팀' }, { name: '이서연', dept: '디지털전략팀' }, { name: '박민수', dept: '심사부' }, { name: '최유진', dept: '마케팅부' },
  { name: '정우성', dept: '상품개발부' }, { name: '한소희', dept: '경영기획부' }, { name: '오지원', dept: '재무기획팀' }, { name: '강태석', dept: '고객서비스부' },
  { name: '윤도현', dept: '준법감시부' }, { name: '서지민', dept: 'CS팀' },
]

/* ── 지식 그룹 ── */
/** 전사 지식 그룹 생성 (중복 무시). 생성된 그룹명 반환 */
export function addKnGroup(name) {
  const clean = (name || '').trim()
  if (!clean) return null
  if (!store.knGroups.includes(clean)) store.knGroups.push(clean)
  return clean
}
export { addKnGroup as addKnFolder } // 하위호환 별칭
/** 지식 컬렉션을 그룹으로 이동 */
export function moveKnowledgeToFolder(k, group) {
  k.group = group
  toast(`‘${k.name}’을(를) ‘${group}’ 그룹으로 이동했습니다.`, 'ok')
}
/** 지식 컬렉션을 그룹에서 제외 */
export function removeKnowledgeFromGroup(k) {
  k.group = '미분류'
  toast(`‘${k.name}’을(를) 그룹에서 제외했습니다.`, 'info')
}

/* ── 담당자(오너) 변경 ── */
/** 에이전트 담당자 변경 */
export function changeAgentOwner(agent, name, dept) {
  const prev = agent.manager
  agent.manager = name
  if (dept !== undefined) agent.managerDept = dept
  toast(`‘${agent.name}’ 담당자를 ${prev} → ${name}(으)로 변경했습니다.`, 'ok')
}
/** 지식 담당자 변경 */
export function changeKnowledgeOwner(k, name, dept) {
  const prev = k.manager
  k.manager = name
  if (dept !== undefined) k.managerDept = dept
  toast(`‘${k.name}’ 담당자를 ${prev} → ${name}(으)로 변경했습니다.`, 'ok')
}
