<script setup>
/**
 * 공통 입력 팝업 (프롬프트 대체) — [담당: 공통 개발자]
 * -----------------------------------------------------------------------------
 * 한 줄 텍스트 입력을 받는 재사용 모달. 폴더 생성/이름 변경 등 여러 곳에서 사용한다.
 *   <PromptDialog title="새 폴더" label="폴더 이름" @confirm="onOk" @close="show=false" />
 */
import { ref, onMounted } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  title: { type: String, default: '입력' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  value: { type: String, default: '' },       // 초기값 (이름 변경 등)
  confirmText: { type: String, default: '확인' },
})
const emit = defineEmits(['confirm', 'close'])

const text = ref(props.value)
const inputEl = ref(null)
onMounted(() => inputEl.value?.focus())

function ok() {
  const v = text.value.trim()
  if (!v) return
  emit('confirm', v)
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-prompt" role="dialog" aria-modal="true" :aria-label="title">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>
      <div class="prompt-title">{{ title }}</div>
      <div class="prompt-field">
        <label v-if="label" class="prompt-label">{{ label }}</label>
        <input ref="inputEl" v-model="text" :placeholder="placeholder" @keydown.enter="ok" aria-label="입력" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" @click="emit('close')">취소</button>
        <button class="btn btn-primary" :disabled="!text.trim()" @click="ok">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>
