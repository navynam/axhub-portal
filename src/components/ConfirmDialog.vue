<script setup>
/**
 * 공통 확인 팝업 (ConfirmDialog) — BaseModal 기반 · [담당: 공통 개발자]
 * 브라우저 confirm() 대체. 삭제/사용중지 요청 등 확인이 필요한 액션에 공통 사용.
 *   <ConfirmDialog title="삭제 요청" message="..." tone="danger" @confirm="..." @close="..." />
 */
import BaseModal from './BaseModal.vue'

defineProps({
  title: { type: String, default: '확인' },
  message: { type: String, default: '' },
  icon: { type: String, default: '' },
  confirmText: { type: String, default: '확인' },
  cancelText: { type: String, default: '취소' },
  tone: { type: String, default: 'primary' }, // primary | danger
})
const emit = defineEmits(['confirm', 'close'])
</script>

<template>
  <BaseModal :title="title" :icon="icon" @close="emit('close')">
    <p class="confirm-msg">{{ message }}</p>
    <template #actions>
      <button class="btn btn-ghost" @click="emit('close')">{{ cancelText }}</button>
      <button class="btn" :class="tone === 'danger' ? 'btn-danger' : 'btn-primary'" @click="emit('confirm')">{{ confirmText }}</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-msg { font-size: 13.5px; color: var(--ink); line-height: 1.65; white-space: pre-line; margin: 2px 0 4px; }
</style>
