/**
 * 도메인 타입 정의 (JSDoc typedef) — 공통 개발자 담당
 * -----------------------------------------------------------------------------
 * JS 프로젝트라 런타임 타입은 없지만, JSDoc 으로 데이터 구조를 명시해
 * 에디터 자동완성/문서화 효과를 얻는다. 백엔드 DTO 와 필드명을 일치시킨다.
 * (TypeScript 전환 시 이 파일을 그대로 interface 로 옮기면 된다.)
 */

/**
 * @typedef {Object} Agent
 * @property {string}   id          예: 'ag-03'
 * @property {string}   name        Agent 이름
 * @property {string}   desc        한 줄 설명
 * @property {string}   owner       소유(제공) 부서
 * @property {('personal'|'team'|'dept'|'company')} scope 공개 범위
 * @property {string}   perm        권한 상태(enums.Perm)
 * @property {boolean}  active      내 소유 Agent 활성/비활성
 * @property {number}   knowledge   연결 지식베이스 수
 * @property {number}   runs        누적 실행 횟수
 * @property {boolean}  fav         즐겨찾기 여부
 * @property {string}   category    카테고리
 * @property {string}   model       사용 LLM 모델
 * @property {string}   version     버전
 * @property {string}   updated     최종 업데이트일(YYYY-MM-DD)
 * @property {string[]} tools       활용 도구(리소스) 이름 목록
 * @property {string[]} examples    추천 질문
 */

/**
 * @typedef {Object} Knowledge
 * @property {string} id
 * @property {string} name
 * @property {string} desc
 * @property {string} owner
 * @property {string} scope
 * @property {string} perm
 * @property {number} docs      문서 수
 * @property {number} linked    연결 Agent 수
 * @property {string} updated   최신화일
 * @property {string} category  카테고리 트리 leaf id
 */

/**
 * @typedef {Object} PermRequest  권한/도구 요청 1건
 * @property {string}  id
 * @property {('agent'|'knowledge'|'resource')} targetType
 * @property {string}  targetId
 * @property {string}  targetName
 * @property {string}  requester   요청자
 * @property {string}  dept        요청자 부서
 * @property {string}  permType    요청 권한 종류(사용/열람/도구 사용 등)
 * @property {string}  period      사용 기간
 * @property {string}  reason      요청 사유
 * @property {('pending'|'approved'|'denied')} status
 * @property {string}  sla
 * @property {boolean} mine        내가 낸 요청 여부
 * @property {string}  [owner]     리소스 요청 시 승인 관리자 부서
 * @property {string}  createdAt
 * @property {string}  [denyReason]
 */

/**
 * @typedef {Object} Resource  도구/스킬 리소스의 현재 사용자 권한
 * @property {string} owner  운영(승인) 부서
 * @property {string} perm   권한 상태(enums.Perm)
 */

/**
 * @typedef {Object} Conversation  Agent 대화 세션
 * @property {string} id
 * @property {string} agentId
 * @property {string} title
 * @property {string} when   표시용 시점('오늘'/'어제'/...)
 * @property {Array<{role:'user'|'agent', text:string, time:string, typing?:boolean}>} msgs
 */

export {} // 타입 전용 파일 (런타임 export 없음)
