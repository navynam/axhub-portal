/**
 * KEY 관리 도메인 — [담당: 개발자 E · 플랫폼/공통]
 * -----------------------------------------------------------------------------
 * 설정 팝업의 "KEY 관리" 탭에서 MCP·Agent 등록에 쓰는 API 키를 추가/삭제한다.
 * 실서비스에서는 이 키를 안전한 시크릿 저장소(Vault 등)에 보관하고,
 * 여기서는 목데이터로 마스킹 표시만 시연한다.
 */
import { store, nextId } from '../state'
import { toast } from './ui'
import { today } from '../../shared/utils/format'

/** 키 유형 정의 (드롭다운·필터·배지 공용) */
export const KEY_TYPES = [
  { key: 'llm', label: 'LLM 모델', ico: 'bot', hint: '에이전트가 사용하는 LLM 제공자 API 키' },
  { key: 'mcp', label: 'MCP 서버', ico: 'grid', hint: 'MCP 도구 연결용 토큰·시크릿' },
  { key: 'agent', label: 'Agent 등록', ico: 'shield', hint: '에이전트 등록·호출용 서비스 키' },
]
export function keyTypeMeta(type) { return KEY_TYPES.find(t => t.key === type) || KEY_TYPES[0] }

/** 키 값 마스킹: 앞 6자 + 점 + 뒤 4자 (짧으면 전체 마스킹) */
export function maskKey(value) {
  if (!value) return ''
  if (value.length <= 12) return '•'.repeat(Math.max(4, value.length))
  return `${value.slice(0, 6)}${'•'.repeat(8)}${value.slice(-4)}`
}

/**
 * 새 키 등록. 이름·값 필수. 성공 시 목록 맨 앞에 추가하고 등록한 키를 반환.
 * @param {{name:string, type?:string, provider?:string, value:string}} k
 */
export function addKey({ name, type, provider, value } = {}) {
  if (!name?.trim() || !value?.trim()) { toast('키 이름과 값을 모두 입력하세요.', 'warn'); return null }
  const item = {
    id: 'key-' + nextId(),
    name: name.trim(),
    type: type || 'llm',
    provider: (provider || '').trim() || keyTypeMeta(type).label,
    value: value.trim(),
    created: today(),
    status: 'active',
  }
  store.keys.unshift(item)
  toast(`'${item.name}' 키를 등록했습니다.`, 'ok')
  return item
}

/** 키 삭제 */
export function removeKey(id) {
  const i = store.keys.findIndex(k => k.id === id)
  if (i < 0) return
  const name = store.keys[i].name
  store.keys.splice(i, 1)
  toast(`'${name}' 키를 삭제했습니다.`)
}
