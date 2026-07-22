<script setup>
/**
 * 간단 Q&A 챗봇 팝업 — 우하단 플로팅 패널
 * -----------------------------------------------------------------------------
 * 이 컴포넌트는 "화면(메시지 목록 + 입력)"만 담당한다.
 * "무엇을 답할지"는 chatbotService.getReply() 가 결정한다. (역할 분리)
 */
import { ref, nextTick, watch } from 'vue'
import Icon from './Icon.vue'
import { getReply } from '../features/chatbot/services/chatbotService'

const emit = defineEmits(['close'])

const input = ref('')
const scrollEl = ref(null)

// 대화 메시지 목록. role: 'user'(내 말) | 'agent'(챗봇 말)
const messages = ref([
  { role: 'agent', text: '안녕하세요! AX-HUB 챗봇입니다. 궁금한 점을 물어보세요.\n(예: 권한 요청 방법, Agent 실행, 지식 탐색)' },
])

/** 메시지 전송 → 챗봇 답변 표시 */
async function send() {
  const question = input.value.trim()
  if (!question) return

  // 1) 내가 보낸 질문 추가
  messages.value.push({ role: 'user', text: question })
  input.value = ''

  // 2) 답변 자리(타이핑 표시) 먼저 추가
  const reply = { role: 'agent', text: '', typing: true }
  messages.value.push(reply)

  // 3) 서비스에서 답변을 받아, 잠깐의 타이핑 연출 후 표시
  const answer = await getReply(question)
  setTimeout(() => {
    reply.typing = false
    reply.text = answer
  }, 400)
}

// 새 메시지가 생기면 항상 맨 아래로 스크롤
watch(
  () => messages.value.map(m => m.text + m.typing).join('|'),
  async () => {
    await nextTick()
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  },
)
</script>

<template>
  <div class="cb-panel" role="dialog" aria-label="AX 챗봇">
    <div class="cb-head">
      <span class="cb-title"><span class="cb-ic"><Icon name="chat" :size="15" /></span> AX 챗봇</span>
      <button class="cb-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="17" /></button>
    </div>

    <div class="cb-body" ref="scrollEl">
      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role === 'user' ? 'user' : 'agent'">
        <div class="bubble">
          <span v-if="m.typing" class="typing" aria-label="응답 생성 중"><i></i><i></i><i></i></span>
          <template v-else>{{ m.text }}</template>
        </div>
      </div>
    </div>

    <div class="cb-input">
      <input v-model="input" placeholder="메시지를 입력하세요" aria-label="메시지 입력" @keydown.enter="send" />
      <button class="send-btn" :disabled="!input.trim()" @click="send" aria-label="전송"><Icon name="send" :size="16" /></button>
    </div>
  </div>
</template>
