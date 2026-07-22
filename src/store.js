/**
 * (하위호환 shim) — 기존 화면들이 '../store.js' 로 import 하고 있어 유지한다.
 * -----------------------------------------------------------------------------
 * 실제 구현은 도메인별 모듈로 분리되었다. 구조 파악은 아래 경로 참고:
 *   src/store/index.js      ← 배럴(모든 액션 재노출)
 *   src/store/state.js      ← 전역 reactive 상태
 *   src/store/modules/*.js  ← 도메인별 액션 (agent/resource/request/conversation/...)
 *
 * 신규 코드는 가급적 'src/store'(배럴) 에서 import 하는 것을 권장.
 */
export * from './store/index.js'
