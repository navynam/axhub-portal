/**
 * 세션/네비게이션 액션 — 공통 개발자 담당
 * -----------------------------------------------------------------------------
 * 화면 전환(간이 라우팅). page 키는 App.vue 의 pages 매핑과 일치해야 한다.
 * ※ 라우팅을 표준화하려면 vue-router 도입을 권장 (그때 go() 대신 router.push 사용).
 */
import { store } from '../state'

/** 화면 이동 */
export function go(page) { store.page = page }
