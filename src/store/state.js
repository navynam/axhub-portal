/**
 * 전역 상태 (Single Source of Truth) — 공통 개발자 담당
 * -----------------------------------------------------------------------------
 * 앱 전체가 공유하는 하나의 reactive 상태 객체를 정의한다.
 * 각 도메인 store 모듈(agent/knowledge/request/...)의 액션은 이 store 를 직접 변경한다.
 * Vue reactive 이므로 store 값이 바뀌면 이를 참조하는 화면이 자동으로 다시 그려진다.
 *
 * ※ 규모가 커지면 Pinia(공식 상태관리) 로 이관하는 것을 권장한다.
 *   그때는 이 파일의 각 필드가 Pinia store 의 state 로, 모듈 액션이 actions 로 매핑된다.
 */
import { reactive } from 'vue'
import { seedAgents, seedKnowledge, seedRequests, seedBoards, seedResources } from '../data.js'

// 요청/대화/토스트 등 임시 id 를 만들기 위한 전역 순번 발급기
let seq = 100
/** 다음 순번을 발급 (예: 'rq-' + nextId()) */
export function nextId() { return ++seq }

export const store = reactive({
  // ── 세션 / 네비게이션 ─────────────────────────────
  user: { name: '김신한', dept: '영업추진팀' }, // 로그인 사용자 (백엔드 /auth/me 로 대체 예정)
  role: 'user',      // 'user' | 'admin' (데모용 역할 토글)
  page: 'home',      // 현재 화면 키 (App.vue 의 pages 매핑과 일치하는 간이 라우팅)
  permsView: 'mine', // 요청함 화면 뷰: 'mine'(내 요청함) | 'approve'(승인함)

  // ── 도메인 데이터 (백엔드 연동 전에는 seed 목데이터로 채움) ──
  // folder: 폴더별 그룹화용 (내 소유는 '나의 업무', 그 외 '미분류' 기본)
  // folder: 폴더 그룹화용 / shares: 공유 횟수(인기 지표, 정렬·베토 대형타일 기준)
  agents: seedAgents.map(a => ({ ...a, folder: a.perm === 'owner' ? '나의 업무' : '미분류', shares: Math.max(1, Math.round(a.runs / 8)) })),
  folders: [],       // 사용자가 만든 폴더(에이전트 grouping). seed 폴더는 agent.folder 에서 파생
  knowledge: seedKnowledge.map(k => ({ ...k })),
  requests: seedRequests.map(r => ({ ...r })),
  boards: seedBoards,
  // 리소스(도구) 권한 맵: { [도구이름]: { owner, perm } }
  resources: Object.fromEntries(seedResources.map(r => [r.name, { owner: r.owner, perm: r.perm }])),

  // ── UI 상태 ──────────────────────────────────────
  modal: null,     // 권한요청 모달 { targetType, item }
  denyModal: null, // 반려 사유 입력 모달 (요청 객체)
  toasts: [],      // 우하단 알림 목록
  // 디자인 테마 시안: default | bento | dynamic | minimal | dark (설정에서 전환, localStorage 유지)
  theme: (typeof localStorage !== 'undefined' && localStorage.getItem('ax-theme')) || 'default',

  // ── Agent 실행(대화) ─────────────────────────────
  currentAgent: null,
  conversations: [], // [{ id, agentId, title, when, msgs:[...] }]
  currentConvId: null,
})
