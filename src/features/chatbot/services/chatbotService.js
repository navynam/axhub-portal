/**
 * 챗봇 서비스 — [담당: 공통]
 * -----------------------------------------------------------------------------
 * 질문(question)을 받아 답변(문자열)을 돌려준다.
 * 챗봇 화면(ChatbotModal.vue)에는 UI 만 남기고, "무엇을 답할지"는 이 서비스가 정한다.
 *
 * 지금은 키워드 규칙 기반 목(mock) 응답이다.
 * 백엔드 챗봇 API 가 준비되면 getReply 내부의 mock 부분만 http 호출로 바꾸면 된다.
 */
import { USE_API } from '../../../shared/api/config'
import { http } from '../../../shared/api/http'

/**
 * 키워드 → 답변 규칙. 위에서부터 먼저 일치(test)하는 규칙의 answer 를 쓴다.
 * 규칙을 추가/수정하려면 이 배열만 손대면 된다.
 */
const RULES = [
  { match: /권한|요청|승인/,       answer: '권한이 필요한 항목은 카탈로그에서 [권한 요청]을 누르면 승인함으로 전달됩니다. 승인되면 바로 사용할 수 있어요.' },
  { match: /실행|사용|run/i,        answer: 'Agent는 사용 도구를 모두 보유하면 [실행] 버튼으로 대화를 시작할 수 있어요. 부족한 도구는 상세(≡) 팝업에서 요청하세요.' },
  { match: /지식|rag|문서/i,        answer: '지식(RAG) 메뉴에서 카테고리 트리로 지식을 탐색하고, 카드/리스트 보기로 확인할 수 있어요.' },
  { match: /즐겨|favorite|별/i,     answer: 'Agent 카드의 별(★)을 누르면 즐겨찾기에 추가되고, 대시보드와 즐겨찾기 탭에서 모아볼 수 있어요.' },
  { match: /안녕|하이|hello|hi/i,   answer: '안녕하세요! 무엇을 도와드릴까요?' },
]

/**
 * 질문에 대한 답변을 반환한다. (항상 Promise → 실제 API 연동 시 그대로 await 사용)
 * @param {string} question 사용자가 입력한 질문
 * @returns {Promise<string>} 답변 문구
 */
export async function getReply(question) {
  if (USE_API) {
    const result = await http.post('/chatbot/ask', { question })
    return result.answer
  }

  // mock: 규칙에 맞으면 그 답변을, 아니면 기본 안내를 돌려준다.
  const matched = RULES.find(rule => rule.match.test(question))
  if (matched) return matched.answer
  return `"${question}" 에 대해 도와드릴게요. Agent 실행 · 권한 요청 · 지식 탐색 등 무엇이든 물어보세요.`
}
