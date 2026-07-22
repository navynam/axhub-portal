/**
 * UI 공통 상태 액션 — 공통 개발자 담당
 * -----------------------------------------------------------------------------
 * 토스트 알림 등 화면 전반에서 쓰는 UI 동작.
 */
import { store, nextId } from '../state'

/**
 * 우하단 토스트 알림 표시 (3.2초 후 자동 제거)
 * @param {string} msg  표시 문구
 * @param {'info'|'ok'|'warn'} [kind]  색상 종류
 */
export function toast(msg, kind = 'info') {
  const id = nextId()
  store.toasts.push({ id, msg, kind })
  setTimeout(() => {
    const i = store.toasts.findIndex(t => t.id === id)
    if (i >= 0) store.toasts.splice(i, 1)
  }, 3200)
}

/** 디자인 테마(시안) 전환 + localStorage 유지 */
export function setTheme(theme) {
  store.theme = theme
  if (typeof localStorage !== 'undefined') localStorage.setItem('ax-theme', theme)
}
