/**
 * 문서 → 지식 (2단계, 담당자·스텝 분리) — [담당: 개발자 B · 지식]
 * -----------------------------------------------------------------------------
 * [문서 관리]  ① 문서 담당자 등록 요청 → ② 상위 승인자 승인 (승인 완료 = 지식화 대기)
 * [지식 등록]  ③ 지식 담당자가 승인 문서(복수)를 컬렉션(단일/복수) 선택해 등록 요청
 *             ④ 지식 최종 승인자 승인 → 선택 문서가 각 컬렉션의 지식으로 등록
 */
import { store, nextId } from '../state'
import { toast } from './ui'
import { today } from '../../shared/utils/format'

// ── 문서 상태 ──
export const docStatusLabel = { 'doc-review': '문서 승인 대기', approved: '지식화 대기', 'in-reg': '지식 등록 진행중', registered: '지식 등록 완료', 'del-req': '삭제 진행중', suspended: '사용중지', rejected: '반려' }
export const docStatusCls = { 'doc-review': 'pill-pending', approved: 'pill-active', 'in-reg': 'pill-pending', registered: 'pill-active', 'del-req': 'pill-pending', suspended: 'pill-denied', rejected: 'pill-denied' }

export const collectionName = id => (store.knowledge.find(k => k.id === id) || {}).name || '미지정'
export const docName = id => (store.documents.find(d => d.id === id) || {}).name || '문서'

/** ① 문서 등록 요청 (문서 담당자) */
export function submitDocument({ name, desc, docApprover, files }) {
  if (!name || !name.trim()) { toast('문서명을 입력하세요.', 'warn'); return false }
  store.documents.unshift({ id: 'doc-' + nextId(), name: name.trim(), desc: (desc || '').trim(), docOwner: store.user.name, docApprover: docApprover || '상위 승인자', status: 'doc-review', files: [...(files || [])], createdAt: today() })
  toast('문서 등록을 요청했습니다. 상위 승인자 승인 대기.', 'ok')
  return true
}
/** ② 문서 승인/반려 (상위 승인자) */
export function approveDocument(d) { d.status = 'approved'; toast(`문서 ‘${d.name}’ 승인 — 지식화 대기 목록에 추가되었습니다.`, 'ok') }
export function rejectDocument(d) { d.status = 'rejected'; toast(`문서 ‘${d.name}’을 반려했습니다.`) }

/** ③ 지식 등록 요청 — 승인 문서(복수) × 컬렉션(단일/복수) (지식 담당자) */
export function submitKnowledgeReg({ docIds, collectionIds, version, scope, tags, summary, knApprover }) {
  if (!docIds || !docIds.length) { toast('등록할 문서를 선택하세요.', 'warn'); return false }
  if (!collectionIds || !collectionIds.length) { toast('등록할 지식 컬렉션을 1개 이상 선택하세요.', 'warn'); return false }
  if (!version || !version.trim()) { toast('지식 버전을 입력하세요.', 'warn'); return false }
  store.knowledgeRegs.unshift({
    id: 'kr-' + nextId(), docIds: [...docIds], collectionIds: [...collectionIds],
    knOwner: store.user.name, knApprover: knApprover || '지식 최종 승인자',
    version: version.trim(), scope: scope || 'team', tags: (tags || []), summary: (summary || '').trim(),
    status: 'kn-review', createdAt: today(),
  })
  // 선택 문서를 '진행중'으로
  docIds.forEach(id => { const d = store.documents.find(x => x.id === id); if (d) d.status = 'in-reg' })
  toast(`문서 ${docIds.length}건을 컬렉션 ${collectionIds.length}곳에 지식 등록 요청했습니다.`, 'ok')
  return true
}
/** ④ 지식 최종 승인 → 각 컬렉션에 지식 등록 (지식 최종 승인자) */
export function approveKnowledgeReg(r) {
  r.collectionIds.forEach(cid => {
    const k = store.knowledge.find(x => x.id === cid)
    if (!k) return
    if (!k.addedDocs) k.addedDocs = []
    r.docIds.forEach(did => {
      const d = store.documents.find(x => x.id === did)
      k.addedDocs.unshift({ docName: `${d ? d.name : docName(did)} ${r.version}`, registeredAt: today(), version: r.version, registrant: r.knOwner, dept: store.user.dept })
      k.docs = (k.docs || 0) + 1
    })
  })
  r.docIds.forEach(id => { const d = store.documents.find(x => x.id === id); if (d) d.status = 'registered' })
  r.status = 'registered'
  toast(`지식 등록 승인 — 문서 ${r.docIds.length}건이 컬렉션 ${r.collectionIds.length}곳에 지식으로 등록되었습니다.`, 'ok')
}
export function rejectKnowledgeReg(r) {
  r.docIds.forEach(id => { const d = store.documents.find(x => x.id === id); if (d && d.status === 'in-reg') d.status = 'approved' })
  r.status = 'rejected'
  toast('지식 등록 요청을 반려했습니다. 문서는 지식화 대기로 복귀했습니다.')
}

/* ═══════════ 문서 삭제 → 지식 사용중지 파이프라인 ═══════════
   ① 문서 담당자 삭제 요청 → ② 문서 승인 담당자 승인(지식 담당자 배정)
   ③ 지식 담당자 사용중지 요청 → ④ 컬렉션 승인자 승인 → 지식 사용중지 */
export const delStatusLabel = { 'del-review': '문서 삭제 승인 대기', 'del-approved': '사용중지 요청 대기', 'suspend-review': '사용중지 승인 대기', suspended: '사용중지 완료', rejected: '반려' }
export const delStatusCls = { 'del-review': 'pill-pending', 'del-approved': 'pill-pending', 'suspend-review': 'pill-pending', suspended: 'pill-denied', rejected: 'pill-denied' }
export const delStage = d => (d.status === 'del-review' ? 1 : d.status === 'del-approved' ? 2 : d.status === 'suspend-review' ? 3 : d.status === 'suspended' ? 4 : 1)

/** 문서가 지식으로 등록된 컬렉션들 (승인된 지식 등록 요청 기준) */
export function docCollections(docId) {
  const set = new Set()
  store.knowledgeRegs.forEach(r => { if (r.status === 'registered' && r.docIds.includes(docId)) r.collectionIds.forEach(c => set.add(c)) })
  return [...set]
}

/** ① 문서 삭제 요청 (문서 담당자) — 검색한 문서가 속한 컬렉션(선택)에서 삭제 */
export function requestDocDeletion(doc, collectionIds) {
  const all = docCollections(doc.id)
  if (!all.length) { toast('이 문서가 등록된 지식 컬렉션이 없습니다.', 'warn'); return false }
  const cols = (collectionIds && collectionIds.length) ? collectionIds.filter(c => all.includes(c)) : all
  if (!cols.length) { toast('삭제할 지식 컬렉션을 1개 이상 선택하세요.', 'warn'); return false }
  store.docDeletions.unshift({ id: 'dd-' + nextId(), docId: doc.id, docName: doc.name, collectionIds: [...cols], docOwner: store.user.name, docApprover: doc.docApprover || '문서 승인 담당자', knOwner: '지식 담당자', status: 'del-review', createdAt: today() })
  doc.status = 'del-req'
  toast(`문서 ‘${doc.name}’ 삭제를 요청했습니다. (컬렉션 ${cols.length}곳) 문서 승인 담당자 승인 대기.`, 'ok')
  return true
}
/** ② 문서 삭제 승인/반려 (문서 승인 담당자) → 지식 담당자에게 사용중지 요청 배정 */
export function approveDocDeletion(del) { del.status = 'del-approved'; toast('문서 삭제 승인 — 지식 담당자에게 사용중지 요청이 배정되었습니다.', 'ok') }
export function rejectDocDeletion(del) { del.status = 'rejected'; const d = store.documents.find(x => x.id === del.docId); if (d) d.status = 'registered'; toast('문서 삭제 요청을 반려했습니다.') }

/** ③ 지식 사용중지 요청 (지식 담당자) — 컬렉션들의 지식화 문서 사용중지 요청 */
export function requestKnowledgeSuspend(del) { del.knOwner = store.user.name; del.status = 'suspend-review'; toast(`컬렉션 ${del.collectionIds.length}곳에 지식 사용중지를 요청했습니다. 컬렉션 승인자 승인 대기.`, 'ok') }

/** ③' 지식 직접 선택 사용중지 요청 (지식 담당자) — 컬렉션별로 지식을 골라 사용중지 요청
 *   items: [{ cid, name }] (name = 컬렉션 내 지식명 / addedDocs.docName) */
export function requestKnowledgeSuspendDirect(items) {
  if (!items || !items.length) { toast('사용중지할 지식을 선택하세요.', 'warn'); return false }
  const groups = {}
  items.forEach(it => { (groups[it.name] = groups[it.name] || []).push(it.cid) })
  Object.entries(groups).forEach(([name, cids]) => {
    store.docDeletions.unshift({ id: 'dd-' + nextId(), docId: null, docName: name, collectionIds: [...new Set(cids)], docOwner: '—', docApprover: '—', knOwner: store.user.name, origin: 'direct', status: 'suspend-review', createdAt: today() })
  })
  const nCol = new Set(items.map(i => i.cid)).size
  toast(`지식 ${Object.keys(groups).length}건 · 컬렉션 ${nCol}곳 사용중지를 요청했습니다. 컬렉션 승인자 승인 대기.`, 'ok')
  return true
}
/** ④ 사용중지 승인 (컬렉션 승인자) → 해당 지식 사용중지 */
export function approveKnowledgeSuspend(del) {
  del.collectionIds.forEach(cid => {
    const k = store.knowledge.find(x => x.id === cid)
    if (k && k.addedDocs) k.addedDocs.forEach(ad => { if (ad.docName && ad.docName.startsWith(del.docName)) ad.suspended = true })
  })
  const d = store.documents.find(x => x.id === del.docId); if (d) d.status = 'suspended'
  del.status = 'suspended'
  toast(`지식 ‘${del.docName}’이(가) 컬렉션 ${del.collectionIds.length}곳에서 사용중지되었습니다.`, 'ok')
}
export function rejectKnowledgeSuspend(del) { del.status = 'del-approved'; toast('사용중지 요청을 반려했습니다.') }
