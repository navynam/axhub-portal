/**
 * API 공통 설정 (공통 개발자 담당)
 * -----------------------------------------------------------------------------
 * - USE_API   : false 이면 프론트 목(mock) 데이터로 동작, true 이면 실제 백엔드 호출.
 *               백엔드 연동 준비가 끝나면 도메인별 service 에서 이 값을 보고 분기한다.
 * - API_BASE  : 백엔드 REST API 의 기본 경로. (예: https://api.axhub.co.kr/api/v1)
 *               개발 환경에서는 Vite proxy 로 '/api/v1' 를 백엔드로 넘기는 것을 권장.
 * - TOKEN_KEY : 로그인 후 발급받은 JWT 를 localStorage 에 저장할 때 사용하는 키.
 *
 * ⚠ 실제 값은 .env 파일(VITE_USE_API, VITE_API_BASE)로 주입하는 것을 표준으로 한다.
 */
export const USE_API = import.meta.env.VITE_USE_API === 'true' // 기본값 false(mock)

export const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

export const TOKEN_KEY = 'axhub.accessToken'
