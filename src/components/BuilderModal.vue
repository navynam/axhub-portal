<script setup>
import { toast } from '../store.js'
import Icon from './Icon.vue'

const props = defineProps({ title: String, url: String, ico: { type: String, default: 'book' }, tone: { type: String, default: 'green' } })
const emit = defineEmits(['close'])

let host = props.url
try { host = new URL(props.url).host } catch { /* keep raw */ }

// 별도 창(팝업 윈도우)으로 빌더 실행 — iframe 삽입 차단 우회
function launch() {
  const w = 1240, h = 880
  const left = Math.max(0, Math.round((screen.width - w) / 2))
  const top = Math.max(0, Math.round((screen.height - h) / 2))
  const win = window.open(props.url, 'deepagentBuilder', `popup=yes,width=${w},height=${h},left=${left},top=${top}`)
  if (win) { try { win.focus() } catch { /* noop */ } ; emit('close') }
  else { toast('브라우저가 팝업을 차단했습니다. 아래 “새 탭에서 열기”를 이용하세요.', 'warn') }
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="launch-modal" role="dialog" aria-modal="true" :aria-label="title">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>

      <div class="launch-ic" :class="`tone-${tone}`"><Icon :name="ico" :size="26" /></div>
      <div class="launch-title">{{ title }}</div>
      <p class="launch-desc">
        보안 정책상 화면 안에 삽입할 수 없어 <b>별도 창</b>으로 실행됩니다.
      </p>
      <div class="launch-url"><Icon name="arrow" :size="13" /> {{ host }}</div>

      <div class="launch-actions">
        <button class="btn btn-ghost" @click="emit('close')">취소</button>
        <button class="btn btn-primary" @click="launch">새 창에서 열기</button>
      </div>
      <a class="launch-alt" :href="url" target="_blank" rel="noopener" @click="emit('close')">또는 새 탭에서 열기</a>
    </div>
  </div>
</template>
