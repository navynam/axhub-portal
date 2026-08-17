<script setup>
/**
 * 홈 에이전트 캐러셀 — 기획 프로토타입(카드 208×88 + 좌우 이동 + 엣지 페이드) 반영.
 * items: [{ name, locked, agent }]  ·  select 이벤트로 카드 클릭 전달.
 */
import { ref } from 'vue'
import Icon from './Icon.vue'

defineProps({ items: { type: Array, default: () => [] }, plain: { type: Boolean, default: false } })
const emit = defineEmits(['select'])

const clip = ref(null)
const STEP = (208 + 12) * 2
function scroll(dir) { clip.value?.scrollBy({ left: dir * STEP, behavior: 'smooth' }) }
</script>

<template>
  <div class="acar">
    <div class="acar-clip" ref="clip">
      <button v-for="(it, i) in items" :key="i" class="acard" :class="{ plain, locked: it.locked }" @click="emit('select', it)" :title="it.name">
        <span class="acard-t">{{ it.name }}</span>
        <Icon v-if="it.locked" name="lock" :size="18" class="acard-lock" />
      </button>
      <span v-if="!items.length" class="acar-empty">표시할 에이전트가 없습니다</span>
    </div>
    <button class="acar-btn prev" @click="scroll(-1)" aria-label="이전"><Icon name="chevleft" :size="22" /></button>
    <button class="acar-btn next" @click="scroll(1)" aria-label="다음"><Icon name="chevron" :size="22" /></button>
  </div>
</template>

<style scoped>
.acar {
  --p3:#9db8f0; --n5:#c9ccd0; --n4:#dedfe2; --white:#fff; --cardbg:#f8fafc; --ink:#22252b; --sub:#889099;
  position: relative; height: 100px; display: flex; align-items: center;
}
:root[data-theme="dark"] .acar {
  --p3:#3a4a73; --n5:#3a4353; --n4:#2a313c; --white:#171c24; --cardbg:#1b222c; --ink:#eaedf2; --sub:#7f8a99;
}
.acar-clip { display: flex; align-items: center; gap: 12px; width: 100%; height: 100px; padding: 10px; margin: -10px;
  overflow-x: auto; scroll-behavior: smooth; scrollbar-width: none;
  /* 잘리는 끝단을 배경과 어우러지게 부드럽게 페이드(색 무관 마스크) */
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 36px, #000 calc(100% - 66px), transparent 100%);
  mask-image: linear-gradient(to right, transparent 0, #000 36px, #000 calc(100% - 66px), transparent 100%); }
.acar-clip::-webkit-scrollbar { display: none; }
.acard {
  width: 208px; height: 88px; flex-shrink: 0; position: relative;
  padding: 20px 20px 30px; border-radius: 16px;
  background: var(--cardbg); border: 1px solid var(--p3);
  box-shadow: 0 4px 5px rgba(96,102,114,.10);
  display: flex; align-items: flex-start; gap: 12px;
  font-size: 14px; font-weight: 500; line-height: 1.4; color: var(--ink);
  text-align: left; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease;
}
.acard:hover { transform: scale(1.06); box-shadow: 0 8px 12px rgba(96,102,114,.18); z-index: 2; }
.acard.plain { background: var(--white); border-color: var(--n5); }
.acard-t { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.acard-lock { position: absolute; right: 16px; bottom: 12px; color: var(--sub); }
.acar-empty { font-size: 13px; color: var(--sub); padding: 0 8px; }

.acar-btn { position: absolute; top: 50%; transform: translateY(-50%);
  width: 40px; height: 40px; border-radius: 100px;
  background: var(--white); border: 1px solid var(--n4); box-shadow: 0 4px 10px rgba(0,0,0,.12);
  display: grid; place-items: center; color: var(--sub);
  opacity: 0; pointer-events: none; transition: opacity .2s; z-index: 3; cursor: pointer; }
.acar-btn.prev { left: 4px; } .acar-btn.next { right: 4px; }
.acar:hover .acar-btn { opacity: 1; pointer-events: auto; }
.acar-btn:hover { color: var(--ink); }
@media (prefers-reduced-motion: reduce) { .acard, .acar-clip { transition: none; scroll-behavior: auto; } }
</style>
