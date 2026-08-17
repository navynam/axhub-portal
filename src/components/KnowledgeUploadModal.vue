<script setup>
/**
 * 지식 등록 팝업 — 지식 컬렉션 카드의 '지식 등록' 버튼에서 호출 · [담당: 개발자 B]
 * -----------------------------------------------------------------------------
 * 컬렉션에 문서(파일)를 업로드해 '문서 등록 요청'을 생성한다.
 * 컬렉션 관리자가 최종 승인하면 문서가 등록되어 상세보기에 노출된다.
 * fromReq: 지식 요청을 근거로 등록하는 경우 해당 요청과 연계.
 */
import { ref, computed } from 'vue'
import { submitDocRegistration, nextDocVersion } from '../store.js'
import Icon from './Icon.vue'

const props = defineProps({
  knowledge: { type: Object, required: true },
  fromReq: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const docName = ref(props.fromReq ? props.fromReq.title : '')
const reason = ref(props.fromReq ? `지식 요청 '${props.fromReq.title}'에 따른 문서 등록` : '')
const files = ref([])
const autoVersion = computed(() => nextDocVersion(props.knowledge.id))   // 자동 채번 버전(미리보기)

function onFiles(e) { files.value = Array.from(e.target.files || []).map(f => ({ name: f.name, size: f.size })) }
function removeFile(i) { files.value.splice(i, 1) }
function fmtSize(b) { return b >= 1e6 ? (b / 1e6).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB' }

function submit() {
  if (submitDocRegistration({
    knowledgeId: props.knowledge.id, docName: docName.value, reason: reason.value,
    files: files.value, fromReqId: props.fromReq ? props.fromReq.id : '',
  })) emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal krm" role="dialog" aria-modal="true" aria-label="지식 등록">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>

      <div class="krm-head">
        <div class="krm-title"><Icon name="doc" :size="18" /> 지식 등록</div>
        <div class="krm-sub"><b>{{ knowledge.name }}</b> 컬렉션에 문서를 등록합니다. 컬렉션 관리자 승인 후 반영됩니다.</div>
      </div>

      <div v-if="fromReq" class="krm-fromreq">
        <Icon name="book" :size="13" /> 지식 요청 근거: <b>{{ fromReq.title }}</b> · {{ fromReq.requester }}
      </div>

      <label class="krm-field">
        <span class="krm-label">문서명 <em>*</em></span>
        <input v-model="docName" class="krm-input" placeholder="예: 실손보험 표준약관(2026 개정)" />
      </label>

      <div class="krm-field">
        <span class="krm-label">버전 <small style="font-weight:600;color:var(--gray-lt)">(자동 채번)</small></span>
        <div class="krm-autover"><Icon name="check" :size="13" /> {{ autoVersion }} 로 자동 부여됩니다</div>
      </div>

      <label class="krm-field">
        <span class="krm-label">등록 사유 <em>*</em></span>
        <textarea v-model="reason" class="krm-textarea" style="min-height:80px" placeholder="이 문서를 왜 등록하는지 사유를 작성해 주세요."></textarea>
      </label>

      <div class="krm-field">
        <span class="krm-label">파일 업로드 <em>*</em></span>
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
        <button class="btn btn-primary" @click="submit"><Icon name="check" :size="14" /> 등록 요청</button>
      </div>
    </div>
  </div>
</template>
