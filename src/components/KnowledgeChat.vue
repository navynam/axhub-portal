<script setup>
/**
 * 지식 채팅 — 내가 보유한 지식(선택)을 근거로 대화하는 RAG 챗
 * -----------------------------------------------------------------------------
 * 왼쪽 컬렉션에서 범위를 고르면 부모가 그 컬렉션의 '내 지식'을 items 로 넘긴다.
 * 여기서 지식을 선택(또는 전체)하고 질문하면 선택 지식을 근거로 목(mock) 답변을 준다.
 */
import { ref, computed, nextTick, watch } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },     // 이 컬렉션의 내 지식(보유/소유)
  collection: { type: String, default: '전체 지식' },
  preselect: { type: Array, default: () => [] }, // 카드에서 '지식 채팅'으로 들어올 때 미리 선택할 지식 id
})

const sel = ref([])       // 선택된 지식 id
const input = ref('')
const msgs = ref([])
const scrollEl = ref(null)
const busy = computed(() => msgs.value.some(m => m.typing))

const allOn = computed(() => props.items.length > 0 && sel.value.length === props.items.length)
function toggleAll() { sel.value = allOn.value ? [] : props.items.map(k => k.id) }
function toggleItem(id) { const i = sel.value.indexOf(id); if (i >= 0) sel.value.splice(i, 1); else sel.value.push(id) }
const selectedNames = computed(() => props.items.filter(k => sel.value.includes(k.id)).map(k => k.name))

// 컬렉션이 바뀌면 선택/대화 초기화
watch(() => props.collection, () => { sel.value = []; msgs.value = [] })

// 카드에서 '지식 채팅'으로 진입 시 해당 지식만 미리 선택 (컬렉션 초기화 뒤에 적용되도록 이후 등록)
watch(() => props.preselect, (ids) => {
  const valid = (ids || []).filter(id => props.items.some(k => k.id === id))
  if (valid.length) { sel.value = valid; msgs.value = [] }
}, { immediate: true })

const suggestions = ['핵심 내용 3가지로 요약해줘', '근거 문서와 함께 알려줘', '관련 규정·조항을 찾아줘']

function ragReply(q) {
  const names = selectedNames.value
  const head = `선택하신 지식 ${names.length}건(${names.slice(0, 3).join(', ')}${names.length > 3 ? ' 외' : ''})을 근거로 답변드립니다.`
  return [
    head, ``,
    `· 질문: ${q}`,
    `· 선택 지식의 관련 문서에서 근거 문장을 추출해 교차 검증했습니다.`,
    `· 상세 근거·출처는 각 지식 상세에서 확인할 수 있습니다.`,
    ``,
    `조건을 더 좁히거나, 결과를 보고서 초안으로 정리해 드릴까요?`,
  ].join('\n')
}
function send(text) {
  const t = (text ?? input.value).trim()
  if (!t || busy.value || !sel.value.length) return
  msgs.value.push({ role: 'user', text: t })
  input.value = ''
  const r = { role: 'agent', text: '', typing: true }
  msgs.value.push(r)
  const full = ragReply(t)
  setTimeout(() => {
    r.typing = false
    let i = 0
    const tm = setInterval(() => { i = Math.min(i + 3, full.length); r.text = full.slice(0, i); if (i >= full.length) clearInterval(tm) }, 26)
  }, 500)
}
watch(() => msgs.value.map(m => m.text).join('|'), async () => {
  await nextTick(); if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
})
</script>

<template>
  <div class="kn-chat">
    <!-- 지식 선택 -->
    <div class="kc-picker">
      <div class="kc-picker-head">
        <span class="kc-picker-title"><Icon name="book" :size="14" /> {{ collection }} · 내 지식 <b>{{ items.length }}</b></span>
        <button v-if="items.length" class="kc-all" @click="toggleAll">{{ allOn ? '전체 해제' : '전체 선택' }}</button>
      </div>
      <div class="kc-chips" v-if="items.length">
        <button v-for="k in items" :key="k.id" class="kc-chip" :class="{ on: sel.includes(k.id) }" @click="toggleItem(k.id)">
          <span class="kc-check">{{ sel.includes(k.id) ? '✓' : '' }}</span>{{ k.name }}
          <span class="kc-docs">{{ k.docs.toLocaleString() }}</span>
        </button>
      </div>
      <p v-else class="kc-empty">이 컬렉션에 사용할 수 있는(보유한) 지식이 없습니다. ‘지식 신청’으로 권한을 받아보세요.</p>
      <div class="kc-selbar" v-if="sel.length"><Icon name="check" :size="12" /> 선택 {{ sel.length }}건을 근거로 대화합니다.</div>
    </div>

    <!-- 채팅 -->
    <div class="card kc-card">
      <div class="chat-scroll kc-scroll" ref="scrollEl" v-if="msgs.length">
        <div v-for="(m, i) in msgs" :key="i" class="msg" :class="m.role">
          <div v-if="m.role === 'agent'" class="sq sq-green sq-sm">K</div>
          <div class="msg-col">
            <div class="bubble">
              <span v-if="m.typing" class="typing"><i></i><i></i><i></i></span>
              <template v-else>{{ m.text }}</template>
            </div>
          </div>
        </div>
      </div>
      <div class="chat-scroll kc-scroll kc-welcome" v-else>
        <div class="sq sq-green sq-lg">K</div>
        <div class="cw-title">내 지식으로 대화</div>
        <div class="cw-desc">왼쪽 <b>컬렉션</b>에서 범위를 고르고, 위에서 <b>지식</b>을 선택한 뒤 질문하세요.</div>
        <div class="cw-chips"><button v-for="s in suggestions" :key="s" class="chip" :disabled="!sel.length" @click="send(s)">{{ s }}</button></div>
      </div>

      <div class="chat-input">
        <input v-model="input" :placeholder="sel.length ? '선택한 지식에게 질문하세요' : '먼저 위에서 지식을 선택하세요'"
          @keydown.enter="send()" :disabled="!sel.length || busy" />
        <button class="send-btn" :disabled="!sel.length || busy || !input.trim()" @click="send()" aria-label="전송"><Icon name="send" :size="17" /></button>
      </div>
    </div>
  </div>
</template>
