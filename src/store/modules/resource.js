/**
 * 리소스(도구) 권한 도메인 — [담당: 개발자 C · 공통 개발자 협업]
 * -----------------------------------------------------------------------------
 * 이 프로젝트의 핵심 규칙:
 *   "Agent 는 누구나 생성/사용 가능하지만, Agent 가 쓰는 도구/스킬/지식 리소스를
 *    하나라도 보유하지 않으면 실행할 수 없다."
 * 따라서 Agent 의 실행 가능 여부(agentReady)는 도구 권한(resourcePerm)으로 결정된다.
 */
import { store, nextId } from '../state'
import { toast } from './ui'
import { today } from '../../shared/utils/format'

/** 도구의 현재 사용자 권한 조회 (미등록 도구는 기본 보유로 간주) */
export function resourcePerm(name) {
  return store.resources[name]?.perm ?? 'granted'
}

/** 도구의 운영(승인) 부서 조회 */
export function resourceOwner(name) {
  return store.resources[name]?.owner ?? '운영 관리자'
}

/** Agent 실행 가능 여부 = 사용 도구를 하나도 빠짐없이 보유했는가 */
export function agentReady(agent) {
  return (agent?.tools || []).every(t => resourcePerm(t) === 'granted')
}

/**
 * 도구(리소스) 사용 권한 요청 생성.
 * 요청은 승인함으로 전달되고, 해당 도구 운영 관리자가 승인하면 granted 로 바뀐다.
 * @param {string} name  도구 이름
 * @param {string} [reason]  사용자가 작성한 요청 사유(없으면 기본 문구)
 * @param {{permType?:string, period?:string, silent?:boolean}} [opts]
 *   silent=true 면 개별 토스트를 띄우지 않는다(에이전트 일괄 요청용).
 */
export function requestResource(name, reason, opts = {}) {
  const res = store.resources[name]
  if (!res || res.perm === 'granted' || res.perm === 'pending') return
  res.perm = 'pending'
  store.requests.unshift({
    id: 'rq-' + nextId(),
    targetType: 'resource', targetId: name, targetName: name,
    requester: store.user.name, dept: store.user.dept,
    permType: opts.permType || '도구 사용', period: opts.period || '상시',
    reason: (reason && reason.trim()) || `Agent 실행에 필요한 '${name}' 도구 사용 권한 요청`,
    status: 'pending', sla: 'D-2', mine: true, owner: res.owner,
    createdAt: today(),
  })
  if (!opts.silent) toast(`'${name}' 도구 권한을 요청했습니다. ${res.owner} 승인자에게 전달됩니다.`, 'ok')
}
