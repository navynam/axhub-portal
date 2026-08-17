<script setup>
/**
 * 용어 등록/신청 팝업 — 용어사전 '용어 등록' 버튼에서 호출 · [담당: 개발자 B]
 * -----------------------------------------------------------------------------
 * 용어·약어·분류·유의어·정의를 입력해 등록을 신청한다. 유의어는 쉼표로 구분하면
 * 자동으로 함께 등록되어 검색·표시에 활용된다. 관리자 승인 시 사전에 반영.
 */
import { ref, computed } from 'vue'
import { store, submitGlossaryTerm } from '../store.js'
import Icon from './Icon.vue'

const emit = defineEmits(['close'])

const term = ref('')
const abbr = ref('')
const cat = ref('')
const synText = ref('')
const def = ref('')

// 기존 분류 목록 + 기타
const cats = computed(() => {
  const set = new Set(store.glossary.map(t => t.cat))
  return [...set]
})

function submit() {
  if (submitGlossaryTerm({ term: term.value, abbr: abbr.value, cat: cat.value || '기타', syn: synText.value, def: def.value })) {
    emit('close')
  }
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal krm" role="dialog" aria-modal="true" aria-label="용어 등록">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>

      <div class="krm-head">
        <div class="krm-title"><Icon name="book" :size="18" /> 용어 등록 신청</div>
        <div class="krm-sub">용어·유의어·정의를 입력해 등록을 신청하면 관리자 승인 후 사전에 반영됩니다.</div>
      </div>

      <div class="gl-form-grid">
        <label class="krm-field">
          <span class="krm-label">용어 <em>*</em></span>
          <input v-model="term" class="krm-input" placeholder="예: 옴니채널(Omnichannel)" />
        </label>
        <label class="krm-field">
          <span class="krm-label">약어</span>
          <input v-model="abbr" class="krm-input" placeholder="예: OC" />
        </label>
      </div>

      <label class="krm-field">
        <span class="krm-label">분류</span>
        <select v-model="cat" class="select krm-select">
          <option value="">분류 선택 (미지정 시 기타)</option>
          <option v-for="c in cats" :key="c" :value="c">{{ c }}</option>
          <option value="기타">기타</option>
        </select>
      </label>

      <label class="krm-field">
        <span class="krm-label">유의어 · 동의어 <small style="font-weight:600;color:var(--gray-lt)">(쉼표로 구분 → 자동 등록)</small></span>
        <input v-model="synText" class="krm-input" placeholder="예: 옴니채널, omnichannel, 통합채널" />
      </label>

      <label class="krm-field">
        <span class="krm-label">정의 <em>*</em></span>
        <textarea v-model="def" class="krm-textarea" placeholder="용어의 뜻을 설명해 주세요."></textarea>
      </label>

      <div class="krm-actions">
        <button class="btn btn-ghost" @click="emit('close')">취소</button>
        <button class="btn btn-primary" @click="submit"><Icon name="send" :size="14" /> 등록 신청</button>
      </div>
    </div>
  </div>
</template>
