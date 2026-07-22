<script setup>
/**
 * 카드 레일 래퍼 — 다이나믹(넷플릭스) 테마의 가로 스크롤 캐러셀
 * -----------------------------------------------------------------------------
 * 기본/베토/미니멀/다크 테마에서는 그냥 그리드 컨테이너로 동작하고,
 * dynamic 테마에서만 좌우 화살표 + 드래그 스크롤을 활성화한다.
 * 카드 마크업은 slot 으로 그대로 받는다. (grid 클래스는 prop 으로 지정)
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { store } from '../store.js'
import Icon from './Icon.vue'

const props = defineProps({ grid: { type: String, default: 'ax-grid' } })

const track = ref(null)
const canPrev = ref(false)
const canNext = ref(true)
const isRail = () => store.theme === 'dynamic'   // 레일 모드 = 다이나믹 테마

function update() {
  const el = track.value
  if (!el) return
  canPrev.value = el.scrollLeft > 4
  canNext.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}
function page(dir) {
  const el = track.value
  if (!el) return
  el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.85, 300), behavior: 'smooth' })
}

/* ── 드래그(포인터) 스크롤 ── */
let down = false, startX = 0, startL = 0, moved = false
function onDown(e) {
  if (!isRail()) return
  down = true; moved = false; startX = e.clientX; startL = track.value.scrollLeft
  track.value.setPointerCapture?.(e.pointerId)
}
function onMove(e) {
  if (!down) return
  const dx = e.clientX - startX
  if (Math.abs(dx) > 4) moved = true
  track.value.scrollLeft = startL - dx
}
function onUp(e) { down = false; try { track.value?.releasePointerCapture?.(e.pointerId) } catch {} }
// 드래그 직후 카드 클릭(상세 팝업) 방지
function onClickCapture(e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false } }

onMounted(() => {
  update()
  track.value?.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
})
onBeforeUnmount(() => {
  track.value?.removeEventListener('scroll', update)
  window.removeEventListener('resize', update)
})
</script>

<template>
  <div class="rail" :class="{ 'rail-on': isRail() }">
    <button v-if="isRail()" class="rail-nav prev" :disabled="!canPrev" @click="page(-1)" aria-label="이전 카드"><Icon name="chevron" :size="18" /></button>
    <div :class="[grid, 'rail-track']" ref="track"
      @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp" @click.capture="onClickCapture">
      <slot />
    </div>
    <button v-if="isRail()" class="rail-nav next" :disabled="!canNext" @click="page(1)" aria-label="다음 카드"><Icon name="chevron" :size="18" /></button>
  </div>
</template>
