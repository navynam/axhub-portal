<script setup>
import { computed } from 'vue'
const props = defineProps({ status: String }) // pending | approved | denied

// 요청 제출 → 승인자 검토 → 완료(승인/반려)
const steps = computed(() => {
  if (props.status === 'approved') return [
    { t: '요청 제출', cls: 'done', mark: '✓' },
    { t: '승인자 검토', cls: 'done', mark: '✓' },
    { t: '승인 완료', cls: 'done', mark: '✓' },
  ]
  if (props.status === 'denied') return [
    { t: '요청 제출', cls: 'done', mark: '✓' },
    { t: '승인자 검토', cls: 'done', mark: '✓' },
    { t: '반려', cls: 'fail', mark: '✕' },
  ]
  return [
    { t: '요청 제출', cls: 'done', mark: '✓' },
    { t: '승인자 검토', cls: 'now', mark: '2' },
    { t: '완료', cls: '', mark: '3' },
  ]
})
</script>

<template>
  <div class="steps" aria-label="처리 진행 단계">
    <template v-for="(s, i) in steps" :key="i">
      <span class="step" :class="s.cls"><span class="dot">{{ s.mark }}</span>{{ s.t }}</span>
      <span v-if="i < steps.length - 1" class="step-line" :class="{ done: s.cls === 'done' }"></span>
    </template>
  </div>
</template>
