/**
 * 지식 요청 / 문서 등록 도메인 — [담당: 개발자 B · 지식]
 * -----------------------------------------------------------------------------
 * ① 지식 요청(커뮤니티형): 사용자가 지식 생성/보완을 요청(사유·내용·첨부).
 *    관리자가 진행/승인/반려하고 코멘트로 소통한다.
 *      상태: pending(접수) → progress(진행중) → approved(승인) / rejected(반려)
 * ② 문서 등록: 관리자가 컬렉션에 파일을 업로드하면 '문서 등록 요청'이 생성되고,
 *    컬렉션 관리자가 최종 승인하면 문서가 등록되어 상세보기에 노출된다.
 *      상태: pending(승인 대기) → registered(등록 완료) / rejected(반려)
 */
import { store, nextId } from '../state'
import { toast } from './ui'
import { today, nowHHMM } from '../../shared/utils/format'

// ── 지식 요청 상태 라벨 ──
export const knReqStatusLabel = { pending: '접수', progress: '진행중', approved: '승인', rejected: '반려' }
export const knReqStatusCls = { pending: 'pill-pending', progress: 'pill-owner', approved: 'pill-active', rejected: 'pill-denied' }

/** 지식 요청 제출 (사유·내용·첨부파일·대상 컬렉션) */
export function submitKnowledgeRequest({ title, content, files, targetId }) {
  if (!title || !title.trim()) { toast('요청 제목(사유)을 입력하세요.', 'warn'); return false }
  if (!content || !content.trim()) { toast('요청 내용을 입력하세요.', 'warn'); return false }
  const target = targetId ? store.knowledge.find(k => k.id === targetId) : null
  store.knowledgeRequests.unshift({
    id: 'kr-' + nextId(),
    title: title.trim(), content: content.trim(),
    files: (files || []).map(f => ({ name: f.name, size: f.size })),
    targetId: targetId || '', targetName: target ? target.name : '',
    requester: store.user.name, dept: store.user.dept,
    status: 'pending', createdAt: today(), comments: [],
  })
  toast('지식 요청을 등록했습니다. 관리자가 검토합니다.', 'ok')
  return true
}

/** 코멘트 추가 (요청자·관리자 공용, 커뮤니티형 소통) */
export function commentKnowledgeRequest(req, text) {
  if (!text || !text.trim()) { toast('내용을 입력하세요.', 'warn'); return false }
  req.comments.push({ author: store.user.name, role: store.role, text: text.trim(), at: `${today()} ${nowHHMM()}` })
  return true
}

/** (관리자) 상태 변경 — 진행/승인/반려. 코멘트가 있으면 함께 기록 */
export function setKnowledgeRequestStatus(req, status, comment) {
  req.status = status
  if (comment && comment.trim()) {
    req.comments.push({ author: store.user.name, role: 'admin', text: comment.trim(), at: `${today()} ${nowHHMM()}`, system: true })
  }
  toast(`요청을 '${knReqStatusLabel[status]}' 처리했습니다.`, 'ok')
}

/** (요청자) 지식 요청 취소 */
export function cancelKnowledgeRequest(req) {
  const i = store.knowledgeRequests.findIndex(x => x.id === req.id)
  if (i >= 0) store.knowledgeRequests.splice(i, 1)
  toast('지식 요청을 취소했습니다.')
}

// ── 문서 등록 요청 상태 라벨 ──
export const docReqStatusLabel = { pending: '승인 대기', registered: '등록 완료', rejected: '반려' }
export const docReqStatusCls = { pending: 'pill-pending', registered: 'pill-active', rejected: 'pill-denied' }

/** 다음 자동 버전 채번: 등록 완료 수 + 대기중 수 기준 v1.N */
export function nextDocVersion(knowledgeId) {
  const k = store.knowledge.find(x => x.id === knowledgeId)
  const done = k && k.addedDocs ? k.addedDocs.length : 0
  const pending = store.docRequests.filter(d => d.knowledgeId === knowledgeId && d.status === 'pending').length
  return `v1.${done + pending}`
}

/** 지식 등록: 컬렉션에 파일 업로드 → 문서 등록 요청 생성. 버전은 자동 채번, 사유 필수. */
export function submitDocRegistration({ knowledgeId, docName, reason, files, fromReqId }) {
  const k = store.knowledge.find(x => x.id === knowledgeId)
  if (!k) { toast('대상 컬렉션을 찾을 수 없습니다.', 'warn'); return false }
  if (!docName || !docName.trim()) { toast('문서명을 입력하세요.', 'warn'); return false }
  if (!reason || !reason.trim()) { toast('등록 사유를 입력하세요.', 'warn'); return false }
  if (!files || !files.length) { toast('등록할 파일을 첨부하세요.', 'warn'); return false }
  const version = nextDocVersion(knowledgeId)   // 자동 채번
  store.docRequests.unshift({
    id: 'dr-' + nextId(), knowledgeId, knowledgeName: k.name,
    docName: docName.trim(), version, reason: reason.trim(),
    files: files.map(f => ({ name: f.name })),
    requester: store.user.name, dept: store.user.dept,
    fromReqId: fromReqId || '', status: 'pending', createdAt: today(),
  })
  toast(`'${k.name}'에 문서 등록을 요청했습니다(${version}). 내 요청함에서 확인되며 승인 후 등록됩니다.`, 'ok')
  return true
}

/** (컬렉션 관리자) 문서 등록 승인 → 실제 등록(상세보기 상단에 노출) */
export function approveDocRegistration(dr) {
  const k = store.knowledge.find(x => x.id === dr.knowledgeId)
  if (k) {
    if (!k.addedDocs) k.addedDocs = []
    k.addedDocs.unshift({ docName: dr.docName, version: dr.version, registrant: dr.requester, dept: dr.dept, registeredAt: today() })
    k.docs = (k.docs || 0) + 1
    k.updated = today()
  }
  dr.status = 'registered'
  // 연계된 지식 요청이 있으면 승인 처리 + 알림 코멘트
  if (dr.fromReqId) {
    const r = store.knowledgeRequests.find(x => x.id === dr.fromReqId)
    if (r && r.status !== 'approved') {
      r.status = 'approved'
      r.comments.push({ author: store.user.name, role: 'admin', system: true, at: `${today()} ${nowHHMM()}`,
        text: `요청하신 지식 '${dr.docName}'을(를) 컬렉션 '${dr.knowledgeName}'에 등록 완료했습니다.` })
    }
  }
  toast(`'${dr.docName}' 문서를 등록했습니다.`, 'ok')
}

/** (컬렉션 관리자) 문서 등록 반려 */
export function rejectDocRegistration(dr) { dr.status = 'rejected'; toast('문서 등록 요청을 반려했습니다.') }
