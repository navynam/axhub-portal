<script setup>
/**
 * 상세 정보 팝업 — 차트/패널 타이틀 클릭 시 상세 리스트 표시 (공용) · [담당: 개발자 E]
 * -----------------------------------------------------------------------------
 * detail = { title, sub, events:[{time,sev,text}] }  // 시그널형 리스트
 *        또는 { title, sub, cols:[...], rows:[[...],...] }  // 표형 리스트
 */
import Icon from './Icon.vue'
defineProps({ detail: Object })
const emit = defineEmits(['close'])
const lvLabel = { critical: 'CRITICAL', warning: 'WARNING', info: 'INFO' }
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-detail" role="dialog" aria-modal="true" :aria-label="detail.title">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>
      <div class="io-detail-title">{{ detail.title }}</div>
      <div class="io-detail-sub" v-if="detail.sub">{{ detail.sub }}</div>

      <!-- 시그널형 -->
      <div v-if="detail.events" class="io-detail-list">
        <div v-for="(r, i) in detail.events" :key="i" class="io-detail-row">
          <span class="io-detail-time">{{ r.time }}</span>
          <span v-if="r.sev" class="io-sig-lv" :class="r.sev">{{ lvLabel[r.sev] }}</span>
          <span class="io-detail-text">{{ r.text }}</span>
        </div>
      </div>

      <!-- 표형 -->
      <div v-else class="io-detail-tblwrap">
        <table class="io-detail-tbl">
          <thead><tr><th v-for="c in detail.cols" :key="c">{{ c }}</th></tr></thead>
          <tbody><tr v-for="(row, i) in detail.rows" :key="i"><td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>
</template>
