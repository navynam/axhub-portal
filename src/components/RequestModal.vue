<script setup>
import { ref, computed } from 'vue'
import { store, submitRequest, resourcePerm } from '../store.js'
import Icon from './Icon.vue'

const permType = ref('사용')
const period = ref('~2026-12-31')
const reason = ref('')

const target = computed(() => store.modal?.item)
const targetType = computed(() => store.modal?.targetType)
const isAgent = computed(() => targetType.value === 'agent')
const typeLabel = computed(() => (isAgent.value ? 'Agent' : '지식'))

// 에이전트: 요청 가능한(미보유) 도구 / 이미 요청중인 도구
const reqTools = computed(() => (isAgent.value ? (target.value.tools || []).filter(t => ['none', 'denied'].includes(resourcePerm(t))) : []))
const pendingTools = computed(() => (isAgent.value ? (target.value.tools || []).filter(t => resourcePerm(t) === 'pending') : []))

function close() { store.modal = null }
function submit() {
  submitRequest({ permType: isAgent.value ? '도구 사용' : permType.value, period: period.value, reason: reason.value })
}
</script>

<template>
  <div class="overlay" @click.self="close">
    <div class="modal" role="dialog" aria-modal="true" :aria-label="`${typeLabel} 권한 요청`">
      <h3>권한 요청</h3>
      <p class="target">대상: {{ target.name }} <template v-if="target.owner && target.owner !== '개인'">({{ target.owner }})</template></p>

      <!-- 에이전트: 실행에 필요한 도구 목록 -->
      <div class="field" v-if="isAgent">
        <label>요청 도구 <span class="req">*</span> <span class="field-hint">이 에이전트 실행에 필요한 도구입니다</span></label>
        <div class="req-tools" v-if="reqTools.length">
          <span v-for="t in reqTools" :key="t" class="req-tool"><Icon name="shield" :size="12" /> {{ t }}</span>
        </div>
        <p class="req-tools-empty" v-else>요청할 도구가 없습니다. (이미 보유했거나 요청중)</p>
        <p class="req-tools-pending" v-if="pendingTools.length">요청중: {{ pendingTools.join(', ') }}</p>
      </div>

      <!-- 지식 등: 요청 권한 종류 -->
      <div class="field" v-else>
        <label>요청 권한</label>
        <select v-model="permType">
          <option>열람</option>
          <option>사용</option>
          <option>공유</option>
        </select>
      </div>

      <div class="field">
        <label>사용 기간</label>
        <select v-model="period">
          <option>~2026-09-30</option>
          <option>~2026-12-31</option>
          <option>~2027-06-30</option>
          <option>상시</option>
        </select>
      </div>

      <div class="field">
        <label>요청 사항 <span class="req">*</span></label>
        <textarea v-model="reason" placeholder="업무 목적·필요 사유를 구체적으로 입력하세요. 승인자 검토에 사용됩니다."></textarea>
      </div>

      <div class="field">
        <label>승인자</label>
        <input :value="isAgent ? '각 도구 운영 관리자 (자동 지정)' : `${target.owner} 권한자 (자동 지정)`" disabled />
      </div>

      <div class="modal-actions">
        <button class="btn btn-ghost" @click="close">취소</button>
        <button class="btn btn-primary" :disabled="isAgent && !reqTools.length" @click="submit">요청 등록</button>
      </div>
    </div>
  </div>
</template>
