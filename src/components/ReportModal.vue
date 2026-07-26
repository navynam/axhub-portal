<script setup>
/**
 * 신고/개선요청 팝업 — 대화창에서 호출 · [담당: 개발자 C]
 * -----------------------------------------------------------------------------
 * 1) 문제 유형(도구/스킬/지식/전반) 선택 → 2) 해당 항목 선택(또는 전체) →
 * 3) 요청 사항 작성. 접수 시 현재 대화 스크립트가 타임스탬프와 함께 첨부된다.
 */
import { ref, computed, watch } from 'vue'
import { store, submitReport } from '../store.js'
import Icon from './Icon.vue'

const props = defineProps({ agent: Object, messages: { type: Array, default: () => [] } })
const emit = defineEmits(['close'])

const cats = [
  { key: 'tool', label: '도구', ico: 'tool', desc: '연동 도구·API 오류/부정확' },
  { key: 'skill', label: '스킬', ico: 'zap', desc: '처리 방식·기능 문제' },
  { key: 'knowledge', label: '지식', ico: 'book', desc: '근거 지식·정확도 문제' },
  { key: 'general', label: '전반적 문제', ico: 'flag', desc: '위에 해당 없음/복합' },
]
const category = ref('tool')
const selected = ref([])
const reason = ref('')

// 연결 지식(대화창과 동일 로직): 소유 부서 우선
const knowledgeNames = computed(() => {
  const a = props.agent
  const own = store.knowledge.filter(k => k.owner === a.owner)
  const rest = store.knowledge.filter(k => k.owner !== a.owner)
  return [...own, ...rest].slice(0, Math.max(a.knowledge, 1)).map(k => k.name)
})

// 선택된 유형에 해당하는 항목 목록
const itemsFor = computed(() => {
  if (category.value === 'tool') return props.agent.tools || []
  if (category.value === 'skill') return props.agent.skills || []
  if (category.value === 'knowledge') return knowledgeNames.value
  return [] // general
})
watch(category, () => { selected.value = [] })

const allOn = computed(() => itemsFor.value.length > 0 && selected.value.length === itemsFor.value.length)
function toggleAll() { selected.value = allOn.value ? [] : [...itemsFor.value] }
function toggleItem(it) {
  const i = selected.value.indexOf(it)
  if (i >= 0) selected.value.splice(i, 1); else selected.value.push(it)
}

// 첨부되는 대화(타이핑 중 제외)
const attachMsgs = computed(() => props.messages.filter(m => !m.typing))
const canSubmit = computed(() => reason.value.trim() && (category.value === 'general' || selected.value.length))

function submit() {
  const ok = submitReport({
    agent: props.agent,
    category: category.value,
    items: selected.value,
    reason: reason.value,
    script: props.messages,
  })
  if (ok) emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-report" role="dialog" aria-modal="true" aria-label="신고 · 개선 요청">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>
      <div class="rep-modal-head">
        <div class="rep-modal-ic"><Icon name="flag" :size="18" /></div>
        <div>
          <div class="prompt-title" style="margin:0">신고 · 개선 요청</div>
          <div class="rep-modal-sub">{{ agent.name }} 사용 중 불편한 점이나 수정 요청을 남겨주세요.</div>
        </div>
      </div>

      <!-- 1) 문제 유형 -->
      <div class="field">
        <label>어떤 문제인가요? <span class="req">*</span></label>
        <div class="rep-cats">
          <button v-for="c in cats" :key="c.key" class="rep-cat" :class="{ on: category === c.key }" @click="category = c.key">
            <span class="rep-cat-ic"><Icon :name="c.ico" :size="15" /></span>
            <span class="rep-cat-body"><b>{{ c.label }}</b><small>{{ c.desc }}</small></span>
          </button>
        </div>
      </div>

      <!-- 2) 항목 선택 (전반이면 생략) -->
      <div class="field" v-if="category !== 'general'">
        <label>문제 항목 선택 <span class="req">*</span>
          <button v-if="itemsFor.length" class="rep-all" @click="toggleAll">{{ allOn ? '전체 해제' : '전체 선택' }}</button>
        </label>
        <div class="rep-items" v-if="itemsFor.length">
          <button v-for="it in itemsFor" :key="it" class="rep-item-chip" :class="{ on: selected.includes(it) }" @click="toggleItem(it)">
            <span class="rep-check">{{ selected.includes(it) ? '✓' : '' }}</span>{{ it }}
          </button>
        </div>
        <p class="rep-empty" v-else>이 유형에 등록된 항목이 없습니다. ‘전반적 문제’로 남겨주세요.</p>
      </div>

      <!-- 3) 요청 사항 -->
      <div class="field">
        <label>요청 사항 <span class="req">*</span></label>
        <textarea v-model="reason" placeholder="어떤 상황에서 무엇이 불편했는지, 어떻게 개선되면 좋을지 구체적으로 작성해주세요."></textarea>
      </div>

      <!-- 첨부 대화 -->
      <div class="rep-attach-note">
        <Icon name="doc" :size="13" /> 현재 대화 <b>{{ attachMsgs.length }}건</b>이 이 시점 기준으로 함께 첨부됩니다.
      </div>

      <div class="modal-actions">
        <button class="btn btn-ghost" @click="emit('close')">취소</button>
        <button class="btn btn-primary" :disabled="!canSubmit" @click="submit"><Icon name="flag" :size="13" /> 신고 접수</button>
      </div>
    </div>
  </div>
</template>
