<script setup>
import { ref, computed } from 'vue'
import { toast } from '../store.js'
import Icon from './Icon.vue'
import BuilderModal from './BuilderModal.vue'
import ChatbotModal from './ChatbotModal.vue'

const open = ref(false)
const builder = ref(null)   // { title, url, ico, tone } | null
const chatbot = ref(false)  // 챗봇 팝업 표시 여부

// 생성/도구 액션.
//  - chat:  간단 Q&A 챗봇 팝업 열기
//  - embed: 레이어드 팝업(런처) → 별도 창으로 해당 사이트 실행
//  - url:   새 탭으로 이동 / 비어 있으면 데모 토스트
const actions = [
  { key: 'agent', label: 'Agent 빌더', ico: 'bot', tone: 'blue', embed: 'https://deepagent-builder.ai/app' },
  { key: 'knowledge', label: '지식 생성', ico: 'book', tone: 'green', embed: 'https://dev-langconnect.braincrew.io/collections' },
  { key: 'chatbot', label: '챗봇', ico: 'chat', tone: 'gold', chat: true },
]

function run(action) {
  open.value = false
  if (action.chat) { chatbot.value = true; return }
  if (action.embed) { builder.value = { title: action.label, url: action.embed, ico: action.ico, tone: action.tone }; return }
  if (action.url) window.open(action.url, '_blank', 'noopener')
  else toast(`'${action.label}' 페이지로 이동합니다. (데모)`, 'info')
}

/* ---------- 드래그로 위치 이동 ---------- */
const pos = ref(null)       // { right, top } — 이동 후 위치. null 이면 기본(우측 중앙)
const dragging = ref(false)
const dockStyle = computed(() => pos.value
  ? { top: pos.value.top + 'px', right: pos.value.right + 'px', bottom: 'auto', transform: 'none' }
  : {})

let drag = null
let suppressClick = false
const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

function onPointerDown(e) {
  if (e.button != null && e.button !== 0) return
  suppressClick = false
  const rect = e.currentTarget.closest('.fab-dock').getBoundingClientRect()
  drag = {
    startX: e.clientX, startY: e.clientY,
    baseRight: window.innerWidth - rect.right, baseTop: rect.top,
    w: rect.width, h: rect.height, moved: false,
  }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e) {
  if (!drag) return
  const dx = e.clientX - drag.startX
  const dy = e.clientY - drag.startY
  if (!drag.moved && Math.hypot(dx, dy) < 4) return
  drag.moved = true
  dragging.value = true
  pos.value = {
    right: clamp(drag.baseRight - dx, 8, window.innerWidth - drag.w - 8),
    top: clamp(drag.baseTop + dy, 8, window.innerHeight - drag.h - 8),
  }
}

function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  if (drag && drag.moved) { suppressClick = true; dragging.value = false }
  drag = null
}

function onMainClick() {
  if (suppressClick) { suppressClick = false; return }
  open.value = !open.value
}
</script>

<template>
  <div class="fab-dock" :class="{ open, dragging }" :style="dockStyle">
    <transition name="fab-pop">
      <div v-if="open" class="fab-actions">
        <button v-for="a in actions" :key="a.key" class="fab-action" @click="run(a)">
          <span class="fab-avatar" :class="`tone-${a.tone}`"><Icon :name="a.ico" :size="15" /></span>
          {{ a.label }}
        </button>
      </div>
    </transition>

    <button class="fab-main" :class="{ on: open, dragging }" @pointerdown="onPointerDown" @click="onMainClick"
      :aria-expanded="open" :aria-label="open ? '닫기' : '만들기'">
      <Icon :name="open ? 'x' : 'plus'" :size="23" />
      <span v-if="!open && !dragging" class="fab-tip">Agent · 지식 생성</span>
    </button>
  </div>

  <BuilderModal v-if="builder" :title="builder.title" :url="builder.url" :ico="builder.ico" :tone="builder.tone" @close="builder = null" />
  <ChatbotModal v-if="chatbot" @close="chatbot = false" />
</template>
