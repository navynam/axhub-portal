/**
 * 용어사전 도메인 — [담당: 개발자 B · 지식]
 * -----------------------------------------------------------------------------
 * 용어 등록 신청(사용자) → 관리자 승인 시 사전(glossary)에 등록.
 * 유의어(syn)는 쉼표로 구분해 입력하면 함께 등록되어 검색·표시에 활용된다.
 */
import { store, nextId } from '../state'
import { toast } from './ui'
import { today } from '../../shared/utils/format'

/** 유의어 문자열("a, b, c") → 배열 */
export function parseSyn(text) {
  return (text || '').split(/[,·\n]/).map(s => s.trim()).filter(Boolean)
}

/** 용어 등록 신청 (관리자 승인 대기) */
export function submitGlossaryTerm({ term, abbr, cat, syn, def }) {
  if (!term || !term.trim()) { toast('용어명을 입력하세요.', 'warn'); return false }
  if (!def || !def.trim()) { toast('용어 정의를 입력하세요.', 'warn'); return false }
  const synArr = Array.isArray(syn) ? syn : parseSyn(syn)
  store.glossaryRequests.unshift({
    id: 'gr-' + nextId(),
    term: term.trim(), abbr: (abbr || '').trim(), cat: (cat || '기타').trim(),
    syn: synArr, def: def.trim(), related: [],
    requester: store.user.name, dept: store.user.dept,
    status: 'pending', createdAt: today(),
  })
  toast('용어 등록을 신청했습니다. 관리자 승인 후 사전에 등록됩니다.', 'ok')
  return true
}

/** (관리자) 용어 등록 승인 → 사전에 반영 */
export function approveGlossaryTerm(req) {
  store.glossary.unshift({
    term: req.term, abbr: req.abbr, cat: req.cat,
    syn: req.syn, keys: req.syn, related: req.related || [], def: req.def,
    isNew: true,
  })
  const i = store.glossaryRequests.findIndex(x => x.id === req.id)
  if (i >= 0) store.glossaryRequests.splice(i, 1)
  toast(`'${req.term}' 용어를 사전에 등록했습니다.`, 'ok')
}

/** (관리자) 용어 등록 반려 */
export function rejectGlossaryTerm(req) {
  const i = store.glossaryRequests.findIndex(x => x.id === req.id)
  if (i >= 0) store.glossaryRequests.splice(i, 1)
  toast(`'${req.term}' 용어 등록 신청을 반려했습니다.`)
}

/** (신청자) 신청 취소 */
export function cancelGlossaryTerm(req) {
  const i = store.glossaryRequests.findIndex(x => x.id === req.id)
  if (i >= 0) store.glossaryRequests.splice(i, 1)
  toast('용어 등록 신청을 취소했습니다.')
}
