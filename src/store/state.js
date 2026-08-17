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
import { seedAgents, seedKnowledge, seedRequests, seedBoards, seedResources, seedKeys, seedKnowledgeRequests, seedDocuments, seedKnowledgeRegs, seedDocDeletions, glossaryTerms } from '../data.js'

// 에이전트가 활용하는 스킬 풀 (신고/개선요청 시 대상 선택용 데모 데이터)
const SKILL_POOL = ['자연어 요약', '표·차트 변환', '근거 문장 인용', '멀티턴 문맥 유지', '문서 파싱', '정형 출력(JSON)', '오탈자 교정', '핵심 추출']

// 담당자(오너) 시드 후보 — 에이전트/지식에 기본 담당자를 순번으로 배정
const MGR = [
  { name: '김지훈', dept: 'AX추진팀' }, { name: '이서연', dept: '디지털전략팀' }, { name: '박민수', dept: '심사부' }, { name: '최유진', dept: '마케팅부' },
  { name: '정우성', dept: '상품개발부' }, { name: '한소희', dept: '경영기획부' }, { name: '오지원', dept: '재무기획팀' }, { name: '강태석', dept: '고객서비스부' },
]

// 전사 그룹(관리자 관리) — 에이전트/지식 그룹 목록 + 시드 소속(id→그룹)
const AGENT_GROUPS = ['재무·심사 봇', '마케팅·영업 봇', '전사 공통 봇']
const AGENT_GROUP_OF = { 'ag-03': '재무·심사 봇', 'ag-06': '재무·심사 봇', 'ag-04': '마케팅·영업 봇', 'ag-08': '전사 공통 봇', 'ag-09': '전사 공통 봇', 'ag-10': '전사 공통 봇' }
const KN_GROUPS = ['규정·컴플라이언스', '재무·회계', '상품·심사']
const KN_GROUP_OF = { 'kn-06': '규정·컴플라이언스', 'kn-03': '재무·회계', 'kn-04': '상품·심사', 'kn-05': '상품·심사' }

// 전사 도구 그룹 — 기본은 유형(tool/skill/middleware/mcp)별로 배정
const TOOL_GROUPS = ['검색·조회 도구', '생성·처리 스킬', '연동 미들웨어', 'MCP 서버']
const TOOL_GROUP_BY_TYPE = { tool: '검색·조회 도구', skill: '생성·처리 스킬', middleware: '연동 미들웨어', mcp: 'MCP 서버' }

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
  // folder: 폴더 그룹화용 / shares: 공유 횟수(인기 지표) / skills: 에이전트가 쓰는 스킬(신고 대상 선택용)
  agents: seedAgents.map((a, i) => ({
    ...a,
    folder: AGENT_GROUP_OF[a.id] || '미분류',              // folder = 소속 전사 그룹(관리자 관리)
    shares: Math.max(1, Math.round(a.runs / 8)),
    skills: [SKILL_POOL[i % SKILL_POOL.length], SKILL_POOL[(i + 3) % SKILL_POOL.length]],
    manager: a.manager || MGR[i % MGR.length].name,        // 담당자(오너) 이름
    managerDept: a.managerDept || MGR[i % MGR.length].dept, // 담당자 소속
  })),
  agentGroups: [...AGENT_GROUPS], // 전사 에이전트 그룹(관리자가 그룹 관리에서 생성)
  knGroups: [...KN_GROUPS],       // 전사 지식 그룹
  // group: 소속 전사 지식 그룹 / manager: 담당자(오너)
  knowledge: seedKnowledge.map((k, i) => ({
    ...k, addedDocs: [...(k.addedDocs || [])],
    group: KN_GROUP_OF[k.id] || '미분류',
    manager: k.manager || MGR[i % MGR.length].name,
    managerDept: k.managerDept || MGR[i % MGR.length].dept,
  })),
  requests: seedRequests.map(r => ({ ...r })),
  reports: [],       // 에이전트 신고/개선요청 (마이페이지 신고함 · 관리자 처리)
  // 지식 요청(커뮤니티형): 사용자가 지식 생성을 요청 → 관리자 진행/승인/반려 + 코멘트
  knowledgeRequests: seedKnowledgeRequests.map(r => ({ ...r, files: [...r.files], comments: [...r.comments] })),
  // 문서 등록 요청: 관리자가 컬렉션에 파일 업로드 → 컬렉션 관리자 승인 시 문서 등록
  docRequests: [],
  // 문서(문서 관리): 요청·승인
  documents: seedDocuments.map(d => ({ ...d })),
  // 지식 등록 요청(지식 등록): 문서×컬렉션 → 최종 승인 시 컬렉션 등록
  knowledgeRegs: seedKnowledgeRegs.map(r => ({ ...r, docIds: [...r.docIds], collectionIds: [...r.collectionIds], tags: [...(r.tags || [])] })),
  // 문서 삭제 → 지식 사용중지 요청: 문서 삭제 승인 후 지식 담당자가 컬렉션에서 사용중지
  docDeletions: seedDocDeletions.map(d => ({ ...d, collectionIds: [...d.collectionIds] })),
  // 용어사전: 등록된 용어(syn=유의어, abbr=약어). keys 는 유의어로 재사용.
  glossary: glossaryTerms.map(t => ({ ...t, syn: t.syn || t.keys || [], abbr: t.abbr || '' })),
  // 용어 등록 신청(관리자 승인 시 glossary 에 등록)
  glossaryRequests: [
    { id: 'gr-001', term: '옴니채널(Omnichannel)', abbr: 'OC', cat: '보험/업무', syn: ['옴니채널', 'omnichannel', '통합채널'],
      def: '온·오프라인 등 모든 고객 접점을 통합해 일관된 경험을 제공하는 판매·응대 전략.', related: ['고객채널'],
      requester: '박서준', dept: '마케팅부', status: 'pending', createdAt: '2026-08-06' },
  ],
  boards: seedBoards,
  // 리소스(도구·미들웨어·스킬·MCP) 권한 맵: { [이름]: { owner, perm, type, proto, desc, tags, group } }
  resources: Object.fromEntries(seedResources.map(r => [r.name, { ...r, group: r.group || TOOL_GROUP_BY_TYPE[r.type] || '미분류' }])),
  toolGroups: [...TOOL_GROUPS], // 전사 도구 그룹(관리자가 그룹 관리에서 생성)
  // 설정 > KEY 관리: MCP·Agent 등록용 API 키 목록 (설정 팝업에서 추가/삭제)
  keys: seedKeys.map(k => ({ ...k })),

  // ── UI 상태 ──────────────────────────────────────
  modal: null,     // 권한요청 모달 { targetType, item }
  denyModal: null, // 반려 사유 입력 모달 (요청 객체)
  toasts: [],      // 우하단 알림 목록
  knChatOpen: false, // 지식 채팅 모드(바깥 스크롤 없이 채우기)
  // 디자인 테마 시안: default | bento | dynamic | minimal | dark (설정에서 전환, localStorage 유지)
  theme: (typeof localStorage !== 'undefined' && localStorage.getItem('ax-theme')) || 'default',

  // ── Agent 실행(대화) ─────────────────────────────
  currentAgent: null,
  conversations: [], // [{ id, agentId, title, when, msgs:[...] }]
  currentConvId: null,
})
