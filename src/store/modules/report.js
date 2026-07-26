/**
 * 에이전트 신고/개선요청 도메인 — [담당: 개발자 C]
 * -----------------------------------------------------------------------------
 * 대화 중 사용자가 에이전트의 도구·스킬·지식 또는 전반에 대해 개선을 요청(신고)한다.
 * 접수 시 그 시점의 대화 스크립트가 함께 저장되고, 담당 관리자가 처리(진행/답변/완료)한다.
 *   상태: received(접수) → in_progress(개선 진행중) → answered(답변 완료) → resolved(개선 완료)
 */
import { store, nextId } from '../state'
import { toast } from './ui'
import { today, nowHHMM } from '../../shared/utils/format'

export const reportCatLabel = { tool: '도구', skill: '스킬', knowledge: '지식', general: '전반' }
export const reportStatusLabel = { received: '접수', in_progress: '개선 진행중', answered: '답변 완료', resolved: '개선 완료' }
export const reportStatusCls = { received: 'pill-pending', in_progress: 'pill-owner', answered: 'pill-active', resolved: 'pill-active' }

/**
 * 신고 접수. 대화 스크립트를 타임스탬프와 함께 스냅샷으로 저장한다.
 * @param {{agent:object, category:string, items:string[], reason:string, script:object[]}} p
 */
export function submitReport({ agent, category, items, reason, script }) {
  if (!agent) return false
  if (!reason || !reason.trim()) { toast('요청 사항을 입력하세요.', 'warn'); return false }
  if (category !== 'general' && (!items || !items.length)) { toast('문제가 있는 항목을 1개 이상 선택하세요.', 'warn'); return false }
  store.reports.unshift({
    id: 'rp-' + nextId(),
    agentId: agent.id, agentName: agent.name,
    category, items: category === 'general' ? [] : [...items],
    reason: reason.trim(),
    // 접수 시점의 대화 스크립트 스냅샷 (타임스탬프 기준 보관)
    script: (script || []).filter(m => !m.typing).map(m => ({ role: m.role, text: m.text, time: m.time })),
    scriptAt: `${today()} ${nowHHMM()}`,
    requester: store.user.name, dept: store.user.dept, owner: agent.owner,
    status: 'received', adminReply: '',
    createdAt: today(),
  })
  toast('개선 요청(신고)이 접수되었습니다. 담당 관리자가 검토합니다.', 'ok')
  return true
}

/** (관리자) 개선 프로세스 시작 */
export function startReportProgress(r) { r.status = 'in_progress'; toast(`'${r.agentName}' 개선 프로세스를 시작했습니다.`, 'ok') }

/** (관리자) 답변 등록 */
export function replyReport(r, reply) {
  if (!reply || !reply.trim()) { toast('답변 내용을 입력하세요.', 'warn'); return false }
  r.adminReply = reply.trim()
  if (r.status === 'received') r.status = 'answered'
  else if (r.status === 'in_progress') r.status = 'answered'
  else r.status = 'answered'
  toast('답변을 등록했습니다. 요청자에게 전달됩니다.', 'ok')
  return true
}

/** (관리자) 개선 완료 처리 후 공유 */
export function resolveReport(r) { r.status = 'resolved'; toast(`'${r.agentName}' 개선 완료로 처리하고 공유했습니다.`, 'ok') }

/** (사용자) 신고 취소 */
export function cancelReport(r) {
  const i = store.reports.findIndex(x => x.id === r.id)
  if (i >= 0) store.reports.splice(i, 1)
  toast('신고를 취소했습니다.')
}
