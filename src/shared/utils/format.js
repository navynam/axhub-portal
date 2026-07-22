/**
 * 공통 포맷 유틸 (공통 개발자 담당)
 * -----------------------------------------------------------------------------
 * 날짜/숫자/시간 표시를 한 곳에서 관리한다. 화면마다 제각각 포맷하지 않도록 공통화.
 */

/** 오늘 날짜를 'YYYY-MM-DD' 문자열로 반환 (요청 생성 시 createdAt 등에 사용) */
export function today() {
  return new Date().toISOString().slice(0, 10)
}

/** 현재 시각을 'HH:MM' 으로 반환 (채팅 메시지 시간 표시) */
export function nowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * 숫자를 천단위 콤마 문자열로. (예: 1234 -> '1,234')
 * @param {number} n
 */
export function comma(n) {
  return Number(n ?? 0).toLocaleString()
}

/**
 * 긴 문자열을 max 길이로 자르고 말줄임(…) 부착.
 * @param {string} s
 * @param {number} max
 */
export function ellipsis(s, max = 26) {
  if (!s) return ''
  return s.length > max ? s.slice(0, max) + '…' : s
}
