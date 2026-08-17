<script setup>
/**
 * 공통 팝업 셸 (BaseModal) — [담당: 공통 개발자]
 * -----------------------------------------------------------------------------
 * 오버레이 + 모달 박스 + 닫기 버튼 + 헤더(아이콘/제목/부제) + 본문/액션 슬롯을 제공하는
 * 재사용 팝업. 문서·지식 등록/삭제 요청 등 여러 화면에서 동일한 팝업 UX를 공유한다.
 *   <BaseModal title="문서 등록 요청" icon="doc" sub="..." @close="show=false">
 *     ...본문...
 *     <template #actions> ...버튼... </template>
 *   </BaseModal>
 */
import Icon from './Icon.vue'

defineProps({
  title: { type: String, default: '' },
  sub: { type: String, default: '' },
  icon: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
})
const emit = defineEmits(['close'])
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal krm" role="dialog" aria-modal="true" :aria-label="ariaLabel || title">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>
      <div v-if="title" class="krm-head">
        <div class="krm-title"><Icon v-if="icon" :name="icon" :size="18" /> {{ title }}</div>
        <div v-if="sub" class="krm-sub">{{ sub }}</div>
      </div>
      <slot />
      <div class="krm-actions"><slot name="actions" /></div>
    </div>
  </div>
</template>
