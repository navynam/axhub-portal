<script setup>
/**
 * 설정 팝업 — 디자인 테마(시안) 전환 + KEY 관리 · [담당: 개발자 E]
 * -----------------------------------------------------------------------------
 * 탭 구성: [테마] 5가지 시안 미리보기 선택 / [KEY 관리] MCP·Agent 등록용 API 키 관리.
 * 테마는 선택 즉시 전역 적용(localStorage 유지). 키는 store.keys 에 추가/삭제.
 */
import { ref, computed } from 'vue'
import { store, setTheme, KEY_TYPES, keyTypeMeta, maskKey, addKey, removeKey, toast } from '../store.js'
import Icon from './Icon.vue'

const emit = defineEmits(['close'])
const tab = ref('theme')   // theme | keys

// ── 테마 시안 ──────────────────────────────────────
const themes = [
  { key: 'default', name: '기본 (신한 CI)', desc: '표준 반응형 그리드 · 신한 블루',
    c: { primary: '#0046FF', canvas: '#F6F7F9', card: '#FFFFFF', accent: '#C6982E', side: '#17284C' } },
  { key: 'bento', name: '베토 그리드', desc: '크기 다른 타일 매트릭스 · 파스텔 모자이크',
    c: { primary: '#4F46E5', canvas: '#F0F1F8', card: '#FFFFFF', accent: '#F59E0B', side: '#312E81' } },
  { key: 'dynamic', name: '다이나믹 카드', desc: '넷플릭스식 가로 스크롤 레일 · 그라데이션',
    c: { primary: '#7C3AED', canvas: '#F7F5FC', card: '#FFFFFF', accent: '#EC4899', side: '#3B1D6E' } },
  { key: 'minimal', name: '미니멀', desc: '플랫 리스트 행(한 줄 카드) · 모노톤',
    c: { primary: '#111827', canvas: '#FFFFFF', card: '#FFFFFF', accent: '#6B7280', side: '#14171F' } },
  { key: 'dark', name: '다크', desc: '다크 대시보드 · 네온 글로우',
    c: { primary: '#3B82F6', canvas: '#0E1116', card: '#171B22', accent: '#F5B301', side: '#0B0D12' } },
]

// ── KEY 관리 ───────────────────────────────────────
const kf = ref('all')                                   // 유형 필터
const showAdd = ref(false)
const revealed = ref([])                                // 값 표시중인 키 id
const form = ref({ name: '', type: 'llm', provider: '', value: '' })

const keyCount = t => store.keys.filter(k => k.type === t).length
const filteredKeys = computed(() => kf.value === 'all' ? store.keys : store.keys.filter(k => k.type === kf.value))

function toggleReveal(id) {
  const i = revealed.value.indexOf(id)
  if (i >= 0) revealed.value.splice(i, 1); else revealed.value.push(id)
}
async function copyKey(k) {
  try { await navigator.clipboard.writeText(k.value); toast('키 값을 복사했습니다.', 'ok') }
  catch { toast('복사에 실패했습니다. 값을 표시해 직접 복사하세요.', 'warn') }
}
function submitAdd() {
  const created = addKey(form.value)
  if (created) { form.value = { name: '', type: 'llm', provider: '', value: '' }; showAdd.value = false; kf.value = 'all' }
}
function del(k) {
  if (window.confirm(`'${k.name}' 키를 삭제할까요?`)) removeKey(k.id)
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-settings" role="dialog" aria-modal="true" aria-label="설정">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>

      <div class="set-head">
        <div class="set-title"><Icon name="gear" :size="17" /> 설정</div>
        <div class="set-tabs" role="tablist">
          <button role="tab" :class="{ on: tab === 'theme' }" @click="tab = 'theme'"><Icon name="grid" :size="14" /> 테마</button>
          <button role="tab" :class="{ on: tab === 'keys' }" @click="tab = 'keys'"><Icon name="shield" :size="14" /> KEY 관리<span class="st-n">{{ store.keys.length }}</span></button>
        </div>
      </div>

      <!-- 테마 탭 -->
      <template v-if="tab === 'theme'">
        <div class="theme-grid">
          <button v-for="t in themes" :key="t.key" class="theme-card" :class="{ on: store.theme === t.key }"
            @click="setTheme(t.key)" :aria-pressed="store.theme === t.key">
            <div class="tp" :style="{ background: t.c.canvas }">
              <div class="tp-side" :style="{ background: t.c.side }"></div>
              <div class="tp-body">
                <div class="tp-bar" :style="{ background: t.c.card }">
                  <span class="tp-dot" :style="{ background: t.c.primary }"></span>
                  <span class="tp-dot" :style="{ background: t.c.accent }"></span>
                </div>
                <div class="tp-cards">
                  <div class="tp-mini" :style="{ background: t.c.card }"><span :style="{ background: t.c.primary }"></span></div>
                  <div class="tp-mini" :style="{ background: t.c.card }"><span :style="{ background: t.c.accent }"></span></div>
                </div>
              </div>
            </div>
            <div class="theme-meta">
              <div class="theme-name">{{ t.name }}<Icon v-if="store.theme === t.key" name="check" :size="15" class="theme-check" /></div>
              <div class="theme-desc">{{ t.desc }}</div>
            </div>
          </button>
        </div>
        <p class="set-note">선택하면 전체 화면에 즉시 적용되며, 다음 접속에도 유지됩니다.</p>
      </template>

      <!-- KEY 관리 탭 -->
      <template v-else>
        <p class="keys-intro">MCP·Agent 등록에 사용하는 API 키를 관리합니다. 목록에는 보안을 위해 일부만 표시됩니다.</p>

        <div class="keys-bar">
          <button class="filter-chip" :class="{ on: kf === 'all' }" @click="kf = 'all'">전체<span class="fc-n">{{ store.keys.length }}</span></button>
          <button v-for="t in KEY_TYPES" :key="t.key" class="filter-chip" :class="{ on: kf === t.key }" @click="kf = t.key">
            <Icon :name="t.ico" :size="13" />{{ t.label }}<span class="fc-n">{{ keyCount(t.key) }}</span>
          </button>
          <span style="flex:1"></span>
          <button class="btn btn-primary btn-sm" @click="showAdd = !showAdd"><Icon name="plus" :size="14" /> 키 추가</button>
        </div>

        <!-- 키 추가 폼 -->
        <div class="key-form" v-if="showAdd">
          <div class="kf-row">
            <input v-model="form.name" placeholder="키 이름 (예: Anthropic Claude)" aria-label="키 이름" />
            <select v-model="form.type" aria-label="키 유형">
              <option v-for="t in KEY_TYPES" :key="t.key" :value="t.key">{{ t.label }}</option>
            </select>
          </div>
          <div class="kf-row">
            <input v-model="form.provider" placeholder="제공자 (예: Anthropic, GitHub)" aria-label="제공자" />
            <input v-model="form.value" type="password" placeholder="키 값 붙여넣기" aria-label="키 값" @keydown.enter="submitAdd" />
          </div>
          <div class="kf-foot">
            <span class="kf-hint"><Icon name="shield" :size="12" /> {{ keyTypeMeta(form.type).hint }}</span>
            <span style="flex:1"></span>
            <button class="btn btn-ghost btn-sm" @click="showAdd = false">취소</button>
            <button class="btn btn-primary btn-sm" @click="submitAdd">등록</button>
          </div>
        </div>

        <!-- 키 목록 -->
        <div class="key-list" v-if="filteredKeys.length">
          <div v-for="k in filteredKeys" :key="k.id" class="key-row">
            <span class="key-ic" :class="'kt-' + k.type"><Icon :name="keyTypeMeta(k.type).ico" :size="16" /></span>
            <div class="key-body">
              <div class="key-name">{{ k.name }} <span class="key-badge" :class="'kt-' + k.type">{{ keyTypeMeta(k.type).label }}</span></div>
              <div class="key-val">
                <code>{{ revealed.includes(k.id) ? k.value : maskKey(k.value) }}</code>
                <button class="key-mini" @click="toggleReveal(k.id)" :title="revealed.includes(k.id) ? '숨기기' : '표시'">{{ revealed.includes(k.id) ? '숨김' : '표시' }}</button>
                <button class="key-mini" @click="copyKey(k)" title="복사"><Icon name="doc" :size="12" /> 복사</button>
              </div>
              <div class="key-meta">{{ k.provider }} · 등록 {{ k.created }}</div>
            </div>
            <div class="key-right">
              <span class="pill pill-sm" :class="k.status === 'active' ? 'pill-active' : 'pill-denied'">{{ k.status === 'active' ? '활성' : '만료' }}</span>
              <button class="key-del" @click="del(k)" aria-label="키 삭제" title="삭제"><Icon name="trash" :size="15" /></button>
            </div>
          </div>
        </div>
        <div class="keys-empty" v-else>
          <b>등록된 키가 없습니다</b>
          <span>‘키 추가’로 LLM·MCP·Agent 등록 키를 등록하세요.</span>
        </div>
      </template>
    </div>
  </div>
</template>
