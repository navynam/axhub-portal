/**
 * 권한 요청/승인 도메인 — [담당: 개발자 C]
 * -----------------------------------------------------------------------------
 * 사용자: 권한 요청 생성/취소 (내 요청함)
 * 관리자: 승인/반려 (승인함)
 * 대상은 agent | knowledge | resource(도구) 세 종류.
 */
import { store, nextId } from '../state'
import { toast } from './ui'
import { requestResource, resourcePerm } from './resource'
import { today } from '../../shared/utils/format'

/** agent/knowledge 대상 객체 찾기 (resource 는 store.resources 에서 별도 처리) */
function findTarget(type, id) {
  const list = type === 'agent' ? store.agents : store.knowledge
  return list.find(x => x.id === id)
}

/** 권한요청 모달 열기 (RequestModal 이 store.modal 을 보고 렌더) */
export function openRequest(targetType, item) {
  store.modal = { targetType, item }
}

/** 권한요청 제출 (모달 폼에서 호출) */
export function submitRequest({ permType, period, reason }) {
  const { targetType, item } = store.modal
  if (!reason || !reason.trim()) { toast('요청 사유는 필수 입력입니다.', 'warn'); return }

  // 에이전트: 실행에 필요한(미보유) 도구들에 대해 사용자가 작성한 사유로 일괄 권한 요청
  if (targetType === 'agent') {
    const missing = (item.tools || []).filter(t => ['none', 'denied'].includes(resourcePerm(t)))
    if (!missing.length) { toast('요청할 도구가 없습니다.', 'warn'); return }
    missing.forEach(t => requestResource(t, reason.trim(), { permType, period, silent: true }))
    store.modal = null
    toast(`'${item.name}' 실행에 필요한 도구 ${missing.length}건의 권한을 요청했습니다. 승인자에게 전달됩니다.`, 'ok')
    return
  }

  item.perm = 'pending'
  store.requests.unshift({
    id: 'rq-' + nextId(),
    targetType, targetId: item.id, targetName: item.name,
    requester: store.user.name, dept: store.user.dept,
    permType, period, reason: reason.trim(),
    status: 'pending', sla: 'D-3', mine: true,
    createdAt: today(),
  })
  store.modal = null
  toast('권한 요청이 제출되었습니다. 승인자에게 알림이 발송됩니다.', 'ok')
}

/** 내가 낸 요청 취소 (대상 권한을 다시 none 으로 되돌리고 목록에서 제거) */
export function cancelRequest(req) {
  if (req.targetType === 'resource') {
    const res = store.resources[req.targetName]
    if (res && res.perm === 'pending') res.perm = 'none'
  } else {
    const t = findTarget(req.targetType, req.targetId)
    if (t && t.perm === 'pending') t.perm = 'none'
  }
  const i = store.requests.findIndex(r => r.id === req.id)
  if (i >= 0) store.requests.splice(i, 1)
  toast('요청을 취소했습니다.')
}

/** 승인 (관리자). resource 는 도구 권한을 granted 로, 그 외는 대상 perm 을 granted 로 */
export function approve(req) {
  req.status = 'approved'
  if (req.targetType === 'resource') {
    const res = store.resources[req.targetName]
    if (res) res.perm = 'granted'
    toast(`'${req.targetName}' 도구 권한을 승인했습니다. 관련 Agent가 실행 가능해집니다.`, 'ok')
    return
  }
  if (req.mine) {
    const t = findTarget(req.targetType, req.targetId)
    if (t) t.perm = 'granted'
  }
  toast(`'${req.targetName}' 요청을 승인했습니다. ABAC 정책에 반영됩니다.`, 'ok')
}

/** 반려 사유 입력 모달 열기 */
export function openDeny(req) { store.denyModal = req }

/** 반려 확정 (사유 필수) */
export function confirmDeny(reason) {
  const req = store.denyModal
  if (!reason || !reason.trim()) { toast('반려 사유는 필수 입력입니다.', 'warn'); return }
  req.status = 'denied'
  req.denyReason = reason.trim()
  if (req.targetType === 'resource') {
    const res = store.resources[req.targetName]
    if (res) res.perm = 'denied'
  } else if (req.mine) {
    const t = findTarget(req.targetType, req.targetId)
    if (t) t.perm = 'denied'
  }
  store.denyModal = null
  toast(`'${req.targetName}' 요청을 반려했습니다. 요청자에게 사유가 전달됩니다.`)
}

/** 대기 중 요청 일괄 승인 */
export function approveAll() {
  const pend = store.requests.filter(r => r.status === 'pending')
  pend.forEach(r => approve(r))
  if (!pend.length) toast('대기 중인 요청이 없습니다.')
}
