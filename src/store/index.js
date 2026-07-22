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
export * from './modules/meta'         // permMeta, scopeTabs
