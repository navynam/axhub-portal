/**
 * store 배럴(barrel) — 도메인 store 모듈을 한 곳에서 재노출
 * -----------------------------------------------------------------------------
 * 화면 컴포넌트는 여기(또는 하위호환 shim 인 src/store.js)에서 필요한 것을 import 한다.
 *   import { store, openRun, agentReady } from '@/store'
 */
export { store } from './state'

export * from './modules/session'      // go
export * from './modules/ui'           // toast, setTheme
export * from './modules/agent'        // toggleActive, toggleFavorite, addFolder, moveAgentToFolder
export * from './modules/resource'     // resourcePerm, resourceOwner, agentReady, requestResource
export * from './modules/request'      // openRequest, submitRequest, cancelRequest, approve, openDeny, confirmDeny, approveAll
export * from './modules/conversation' // openRun, newConversation, selectConversation, deleteConversation, renameConversation, resumeConversation, currentConv, sendMessage
export * from './modules/report'       // submitReport, startReportProgress, replyReport, resolveReport, cancelReport, reportCatLabel/StatusLabel/StatusCls
export * from './modules/meta'         // permMeta, scopeTabs
export * from './modules/keys'         // KEY_TYPES, keyTypeMeta, maskKey, addKey, removeKey
export * from './modules/knowledgeReq' // 지식요청·문서등록: submit/comment/status/cancel/register/approve + 라벨
export * from './modules/glossary'     // 용어사전: submit/approve/reject/cancel/parseSyn
export * from './modules/docs'         // 문서→지식 파이프라인: submit/approve/reject (문서·지식) + 라벨/스테이지
export * from './modules/admin'        // 권한 관리: 지식 그룹 생성/이동, 에이전트/지식 담당자 변경, MANAGER_CANDIDATES
