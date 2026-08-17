<script setup>
/**
 * 지식 요청 팝업 — 지식관리 상단 '지식 요청' 버튼에서 호출 · [담당: 개발자 B]
 * -----------------------------------------------------------------------------
 * 요청 사유(제목)·요청 내용·첨부 파일·대상 컬렉션(선택)을 입력해 지식 요청을 등록한다.
 */
import { ref } from 'vue'
import { store, submitKnowledgeRequest } from '../store.js'
import Icon from './Icon.vue'

const props = defineProps({ targetId: { type: String, default: '' } })
const emit = defineEmits(['close'])

const title = ref('')
const content = ref('')
const targetId = ref(props.targetId || '')
const files = ref([])   // [{ name, size }]

function onFiles(e) {
  files.value = Array.from(e.target.files || []).map(f => ({ name: f.name, size: f.size }))
}
function removeFile(i) { files.value.splice(i, 1) }
function fmtSize(b) { return b >= 1e6 ? (b / 1e6).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB' }

function submit() {
  if (submitKnowledgeRequest({ title: title.value, content: content.value, files: files.value, targetId: targetId.value })) {
    emit('close')
  }
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal krm" role="dialog" aria-modal="true" aria-label="지식 요청">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>

      <div class="krm-head">
        <div class="krm-title"><Icon name="book" :size="18" /> 지식 요청</div>
        <div class="krm-sub">필요한 지식의 등록·보완을 요청하면 관리자가 검토 후 처리합니다.</div>
      </div>

      <label class="krm-field">
        <span class="krm-label">요청 사유 (제목) <em>*</em></span>
        <input v-model="title" class="krm-input" placeholder="예: 2026년 개정 표준약관 등록 요청" />
      </label>

      <label class="krm-field">
        <span class="krm-label">대상 컬렉션</span>
        <select v-model="targetId" class="select krm-select">
          <option value="">선택 안 함 (신규/미지정)</option>
          <option v-for="k in store.knowledge" :key="k.id" :value="k.id">{{ k.name }}</option>
        </select>
      </label>

      <label class="krm-field">
        <span class="krm-label">요청 내용 <em>*</em></span>
        <textarea v-model="content" class="krm-textarea" placeholder="어떤 지식이 왜 필요한지, 어떤 문서를 등록/보완해야 하는지 구체적으로 작성해 주세요."></textarea>
      </label>

      <div class="krm-field">
        <span class="krm-label">첨부 파일</span>
        <label class="krm-file">
          <Icon name="attach" :size="14" /> 파일 선택
          <input type="file" multiple @change="onFiles" hidden />
        </label>
        <div class="krm-files" v-if="files.length">
          <div v-for="(f, i) in files" :key="i" class="krm-file-item">
            <Icon name="doc" :size="12" /><span class="kfi-name">{{ f.name }}</span>
            <span class="kfi-size">{{ fmtSize(f.size) }}</span>
            <button class="kfi-x" @click="removeFile(i)" aria-label="제거"><Icon name="x" :size="11" /></button>
          </div>
        </div>
      </div>

      <div class="krm-actions">
        <button class="btn btn-ghost" @click="emit('close')">취소</button>
        <button class="btn btn-primary" @click="submit"><Icon name="send" :size="14" /> 요청 등록</button>
      </div>
    </div>
  </div>
</template>
