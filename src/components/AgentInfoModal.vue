<script setup>
import { computed, ref } from 'vue'
import { store, openRun, requestResource, cancelRequest, resourcePerm, resourceOwner, agentReady, openRequest } from '../store.js'
import Icon from './Icon.vue'

const props = defineProps({ agent: Object })
const emit = defineEmits(['close'])

const a = computed(() => props.agent)
const scopeLabelMap = { personal: '개인', team: '팀', dept: '부서', company: '전사' }

const ready = computed(() => agentReady(a.value))
const canRun = computed(() => ready.value && (a.value.perm !== 'owner' || a.value.active))
const missingCount = computed(() => (a.value.tools || []).filter(t => resourcePerm(t) !== 'granted').length)

const toolTag = { granted: '보유', pending: '요청중', none: '권한 필요', denied: '반려' }
const toolIco = { granted: 'check', pending: 'clock', none: 'shield', denied: 'shield' }

// 도구 클릭 → 확인 알럿(요청/취소). pending 은 요청 취소 확인
const confirm = ref(null)   // { tool, mode: 'request' | 'cancel' }
function onToolClick(t) {
  const p = resourcePerm(t)
  if (p === 'granted') return
  confirm.value = { tool: t, mode: p === 'pending' ? 'cancel' : 'request' }
}
function confirmYes() {
  const { tool, mode } = confirm.value
  if (mode === 'request') {
    requestResource(tool)
  } else {
    const req = store.requests.find(r => r.targetType === 'resource' && r.targetName === tool && r.status === 'pending' && r.mine)
    if (req) cancelRequest(req)
  }
  confirm.value = null
}

function run() { if (canRun.value) { emit('close'); openRun(a.value) } }

// '권한 요청' 버튼: 요청 사항을 작성하는 폼(RequestModal)을 연다.
function requestAll() {
  emit('close')
  openRequest('agent', a.value)
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-info" role="dialog" aria-modal="true" :aria-label="`${a.name} 정보`">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>

      <div class="info-head">
        <div class="sq sq-navy sq-lg">{{ a.name.slice(0, 1) }}</div>
        <div class="info-head-body">
          <div class="info-name">{{ a.name }}</div>
          <div class="info-owner">{{ a.owner }} · {{ scopeLabelMap[a.scope] }} 공개</div>
        </div>
        <span class="ready-pill" :class="ready ? 'ok' : 'no'">
          <Icon :name="ready ? 'check' : 'shield'" :size="12" /> {{ ready ? '실행 가능' : '도구 권한 필요' }}
        </span>
      </div>

      <p class="info-desc">{{ a.desc }}</p>

      <div class="info-grid">
        <div class="info-cell"><span class="k">사용 모델</span><span class="v"><Icon name="cpu" :size="13" /> {{ a.model }}</span></div>
        <div class="info-cell"><span class="k">카테고리</span><span class="v">{{ a.category }}</span></div>
        <div class="info-cell"><span class="k">연결 지식</span><span class="v">{{ a.knowledge }}개 지식베이스</span></div>
        <div class="info-cell"><span class="k">버전</span><span class="v">{{ a.version }}</span></div>
        <div class="info-cell"><span class="k">누적 실행</span><span class="v">{{ a.runs.toLocaleString() }}회</span></div>
        <div class="info-cell"><span class="k">최종 업데이트</span><span class="v">{{ a.updated }}</span></div>
      </div>

      <div class="info-sec" v-if="a.tools?.length">
        <div class="info-sec-title">활용 도구 <span class="sec-hint">권한 없는 도구를 눌러 요청하세요</span></div>
        <div class="info-chip-row">
          <button v-for="t in a.tools" :key="t" class="res-chip" :class="`res-${resourcePerm(t)}`"
            :disabled="resourcePerm(t) === 'granted'"
            @click="onToolClick(t)"
            :title="resourcePerm(t) === 'granted' ? '보유한 도구입니다' : resourcePerm(t) === 'pending' ? '클릭하여 요청 취소' : '클릭하여 권한 요청'">
            <Icon :name="toolIco[resourcePerm(t)]" :size="12" /> {{ t }}
            <span class="res-tag">{{ toolTag[resourcePerm(t)] }}</span>
          </button>
        </div>
      </div>

      <div class="info-sec" v-if="a.examples?.length">
        <div class="info-sec-title">추천 질문</div>
        <ul class="ex-list">
          <li v-for="(q, i) in a.examples" :key="i">{{ q }}</li>
        </ul>
      </div>

      <div class="info-note warn" v-if="!ready">
        권한이 없는 도구 {{ missingCount }}개가 있어 이 Agent를 실행할 수 없습니다. 위 도구를 눌러 권한을 요청하면,
        해당 도구 운영 관리자의 승인 후 실행이 가능해집니다.
      </div>

      <!-- 설계서 12p: 권한 충족 시 '이 에이전트 사용', 부족 시 '권한 요청' -->
      <div class="modal-actions">
        <template v-if="canRun">
          <button class="btn btn-ghost" @click="emit('close')">취소</button>
          <button class="btn btn-primary" @click="run"><Icon name="play" :size="13" /> 이 에이전트 사용</button>
        </template>
        <template v-else>
          <button class="btn btn-ghost" @click="emit('close')">닫기</button>
          <button class="btn btn-gray" @click="requestAll"><Icon name="shield" :size="13" /> 권한 요청</button>
        </template>
      </div>
    </div>
  </div>

  <!-- 권한 요청/취소 확인 알럿 -->
  <div v-if="confirm" class="overlay confirm-scrim" @click.self="confirm = null">
    <div class="confirm-modal" role="alertdialog" aria-modal="true">
      <div class="confirm-ic" :class="{ warn: confirm.mode === 'cancel' }"><Icon name="shield" :size="22" /></div>
      <div class="confirm-title">{{ confirm.mode === 'cancel' ? '권한 요청 취소' : '도구 권한 요청' }}</div>
      <p class="confirm-desc" v-if="confirm.mode === 'request'">
        <b>{{ confirm.tool }}</b> 도구의 사용 권한을 요청합니다.<br>
        운영 관리자(<b>{{ resourceOwner(confirm.tool) }}</b>)의 승인 후 이 Agent를 실행할 수 있습니다.
      </p>
      <p class="confirm-desc" v-else>
        <b>{{ confirm.tool }}</b> 도구의 권한 요청을 취소합니다.
      </p>
      <div class="confirm-actions">
        <button class="btn btn-ghost" @click="confirm = null">{{ confirm.mode === 'cancel' ? '닫기' : '취소' }}</button>
        <button class="btn" :class="confirm.mode === 'cancel' ? 'btn-danger' : 'btn-accent'" @click="confirmYes">
          {{ confirm.mode === 'cancel' ? '요청 취소' : '요청' }}
        </button>
      </div>
    </div>
  </div>
</template>
