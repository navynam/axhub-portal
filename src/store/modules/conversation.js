/**
 * Agent 실행/대화 도메인 — [담당: 개발자 A]
 * -----------------------------------------------------------------------------
 * Agent 실행(openRun) → 대화 세션 생성/이어가기 → 메시지 송수신(sendMessage).
 * 현재는 목(mock) 응답을 스트리밍처럼 흉내낸다. 실제 연동 시 sendMessage 내부를
 * 백엔드 스트리밍 API(SSE/WebSocket) 호출로 교체하면 된다.
 */
import { store, nextId } from '../state'
import { toast } from './ui'
import { agentReady } from './resource'
import { nowHHMM, ellipsis } from '../../shared/utils/format'

/** 대화 첫 인사 메시지 */
function greeting(agent) {
  return {
    role: 'agent',
    text: `안녕하세요, ${agent.name}입니다.\n${agent.desc}\n무엇을 도와드릴까요? 아래 추천 질문으로 바로 시작할 수도 있어요.`,
    time: nowHHMM(),
  }
}

/** 목 응답 생성 (실제 연동 시 백엔드 응답으로 대체) */
function mockReply(agent, q) {
  return [
    `'${q}' 요청을 처리했습니다.`,
    ``,
    `핵심 요약`,
    `· ${agent.owner} 지식베이스 ${agent.knowledge}건을 근거로 분석했습니다.`,
    `· 관련 문서 3건에서 근거 문장을 추출해 교차 검증했습니다.`,
    `· 세부 수치·근거 링크는 상세 보고서에서 확인할 수 있습니다.`,
    ``,
    `이어서 조건을 좁히거나, 결과를 보고서 초안으로 정리해 드릴까요?`,
  ].join('\n')
}

/** 대화 세션 1건 생성. question 이 있으면 지난 대화(질문+응답)로 채운다. */
function makeConv(agent, question, when) {
  const msgs = [greeting(agent)]
  let title = '새 대화'
  if (question) {
    msgs.push({ role: 'user', text: question, time: nowHHMM() })
    msgs.push({ role: 'agent', text: mockReply(agent, question), time: nowHHMM() })
    title = question
  }
  return { id: 'cv-' + nextId(), agentId: agent.id, title, when, msgs }
}

/** 현재 활성 대화 세션 */
export function currentConv() {
  return store.conversations.find(c => c.id === store.currentConvId) || null
}

/** Agent 실행 (도구 권한 미보유 시 차단) → 대화 화면으로 이동 */
export function openRun(agent) {
  if (!agentReady(agent)) {
    toast('권한이 없는 도구가 있어 실행할 수 없습니다. 도구 권한을 먼저 요청·승인 받으세요.', 'warn')
    return
  }
  store.currentAgent = agent
  const mine = store.conversations.filter(c => c.agentId === agent.id)
  if (mine.length) {
    store.currentConvId = mine[0].id // 최근 대화 이어가기
  } else {
    // 첫 진입: 추천 질문 기반 지난 대화 시드 + 새 대화
    const past = (agent.examples || []).slice(0, 2)
      .map((q, i) => makeConv(agent, q, i === 0 ? '어제' : '지난주'))
    const fresh = makeConv(agent, null, '오늘')
    store.conversations = [fresh, ...past, ...store.conversations]
    store.currentConvId = fresh.id
  }
  store.page = 'run'
}

/** 새 대화 시작 */
export function newConversation() {
  const agent = store.currentAgent
  if (!agent) return
  const conv = makeConv(agent, null, '오늘')
  store.conversations = [conv, ...store.conversations]
  store.currentConvId = conv.id
}

/** 히스토리에서 특정 대화 선택 */
export function selectConversation(id) { store.currentConvId = id }

/** 대화 삭제 (현재 대화가 지워지면 같은 Agent의 다음 대화로 이동, 없으면 선택 해제) */
export function deleteConversation(id) {
  const target = store.conversations.find(c => c.id === id)
  if (!target) return
  store.conversations = store.conversations.filter(c => c.id !== id)
  if (store.currentConvId === id) {
    const next = store.conversations.find(c => c.agentId === target.agentId)
    store.currentConvId = next ? next.id : null
  }
  toast('대화를 삭제했습니다.', 'info')
}

/** 대화 제목 변경 */
export function renameConversation(id, title) {
  const conv = store.conversations.find(c => c.id === id)
  const clean = (title || '').trim()
  if (conv && clean) conv.title = clean
}

/** 대시보드 등에서 특정 대화를 바로 이어서 열기 */
export function resumeConversation(conv) {
  const agent = store.agents.find(a => a.id === conv.agentId)
  if (!agent) return
  store.currentAgent = agent
  store.currentConvId = conv.id
  store.page = 'run'
}

/** 메시지 전송 (타이핑 인디케이터 → 스트리밍 응답 시뮬레이션) */
export function sendMessage(text) {
  const agent = store.currentAgent
  const conv = currentConv()
  if (!agent || !conv || !text.trim()) return
  const clean = text.trim()
  const msgs = conv.msgs
  msgs.push({ role: 'user', text: clean, time: nowHHMM() })
  if (conv.title === '새 대화') conv.title = ellipsis(clean, 26) // 첫 질문을 대화 제목으로
  conv.when = '오늘'

  const reply = { role: 'agent', text: '', time: nowHHMM(), typing: true }
  msgs.push(reply)
  const full = mockReply(agent, clean)
  setTimeout(() => {
    reply.typing = false
    let i = 0
    const timer = setInterval(() => {
      i = Math.min(i + 3, full.length)
      reply.text = full.slice(0, i)
      if (i >= full.length) clearInterval(timer)
    }, 30)
  }, 750)

  agent.runs++
}

/* ── 데모용 최근 대화 시드 (대시보드 '이어서 대화하기'가 비어보이지 않도록) ── */
;[
  { id: 'ag-04', q: '지난달 캠페인 ROI 요약해줘', when: '오늘' },
  { id: 'ag-01', q: '오늘 일정 브리핑 만들어줘', when: '어제' },
  { id: 'ag-10', q: 'VPN 접속이 안 될 때 해결법', when: '2일 전' },
].forEach(s => {
  const agent = store.agents.find(a => a.id === s.id)
  if (agent) store.conversations.push(makeConv(agent, s.q, s.when))
})
