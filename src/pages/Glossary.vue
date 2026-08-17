<script setup>
/**
 * 용어사전 — 사전형 화면 · [담당: 개발자 B]
 * -----------------------------------------------------------------------------
 * 용어 검색 + 초성(가나다)·알파벳(ABC) 인덱스 → 목록(용어·약어·유의어·정의·관련용어).
 * 용어 등록/신청 기능(관리자 승인 시 사전에 등록).
 */
import { ref, computed, onMounted, nextTick } from 'vue'
import { store } from '../store.js'
import Icon from '../components/Icon.vue'
import GlossaryTermModal from '../components/GlossaryTermModal.vue'

const q = ref('')
const idx = ref('all')       // 'all' | 초성(가~하) | 알파벳(A~Z) | '#'
const regModal = ref(false)
const searchInput = ref(null)

const isAdmin = computed(() => store.role === 'admin')
const pending = computed(() => store.glossaryRequests)
const synOf = t => (t.syn && t.syn.length ? t.syn : (t.keys || []))

// 용어 승인은 마이페이지 승인함에서 처리 → 이동
function goApprove() { store.page = 'perms'; store.permsView = 'approve' }

// ── 초성/알파벳 인덱스 ─────────────────────────────
const CHO = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하']
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
// 19 초성(ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ) → 대표 음절(가나다…)
const CHO_MAP = ['가', '가', '나', '다', '다', '라', '마', '바', '바', '사', '사', '아', '자', '자', '차', '카', '타', '파', '하']
function initialOf(name) {
  const c = (name || '').trim().charCodeAt(0)
  if (c >= 0xAC00 && c <= 0xD7A3) return CHO_MAP[Math.floor((c - 0xAC00) / 588)]
  if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) return name[0].toUpperCase()
  return '#'
}
const counts = computed(() => {
  const m = {}
  store.glossary.forEach(t => { const g = initialOf(t.term); m[g] = (m[g] || 0) + 1 })
  return m
})
const alphaPresent = computed(() => ALPHA.filter(g => counts.value[g]))
const hasHash = computed(() => counts.value['#'] > 0)

// ── 검색 + 인덱스 필터 ─────────────────────────────
const list = computed(() => {
  const s = q.value.trim().toLowerCase().replace(/\s/g, '')
  let base = store.glossary
  if (s) {
    base = base.filter(t => (t.term + synOf(t).join('') + (t.abbr || '') + (t.def || '')).toLowerCase().replace(/\s/g, '').includes(s))
  } else if (idx.value !== 'all') {
    base = base.filter(t => initialOf(t.term) === idx.value)
  }
  return base.slice().sort((a, b) => a.term.localeCompare(b.term, 'ko'))
})
// 검색어·색인을 넣으면 검색창으로 스크롤해 다음 검색을 바로 이어갈 수 있게 한다.
function scrollTop() { nextTick(() => document.querySelector('.gl')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }
function focusSearch() { nextTick(() => searchInput.value?.focus({ preventScroll: true })) }

const filtered = computed(() => !!q.value || idx.value !== 'all') // 필터 활성 여부

/** 전체 보기로 초기화 + 검색창 포커스 → 곧바로 새 용어를 검색 */
function reset() { q.value = ''; idx.value = 'all'; scrollTop(); focusSearch() }
function pickIndex(g) { idx.value = idx.value === g ? 'all' : g; q.value = '' }
function searchTerm(t) { q.value = t; idx.value = 'all'; scrollTop() }

onMounted(() => focusSearch()) // 진입 시 바로 검색 가능
</script>

<template>
  <div class="gl">
    <!-- 검색 + 등록 -->
    <div class="gl-top">
      <div class="gl-search">
        <Icon name="search" :size="18" />
        <input ref="searchInput" v-model="q" placeholder="용어를 입력해 검색 (용어·유의어·약어)" aria-label="용어 검색"
               @keydown.esc="reset()" />
        <button v-if="q" class="gl-search-x" @click="q = ''; focusSearch()" aria-label="검색어 지우기"><Icon name="x" :size="14" /></button>
      </div>
      <button v-if="filtered" class="btn btn-ghost gl-reset" @click="reset()"><Icon name="back" :size="14" /> 전체 보기</button>
      <span v-else class="gl-count">{{ store.glossary.length }}개 용어</span>
      <button class="btn btn-primary" @click="regModal = true"><Icon name="plus" :size="14" /> 용어 등록</button>
    </div>

    <!-- 등록 신청 안내 (승인은 마이페이지 승인함에서 처리) -->
    <div v-if="pending.length" class="gl-pending-hint">
      <Icon name="book" :size="13" />
      용어 등록 신청 {{ pending.length }}건이 승인 대기 중입니다.
      <button v-if="isAdmin" class="gl-hint-link" @click="goApprove">승인함에서 처리 <Icon name="arrow" :size="12" /></button>
    </div>

    <!-- 초성 · 알파벳 인덱스 -->
    <div class="gl-index" role="group" aria-label="색인">
      <button class="gl-idx" :class="{ on: idx === 'all' }" @click="idx = 'all'; q = ''">전체</button>
      <button v-for="g in CHO" :key="g" class="gl-idx ko" :class="{ on: idx === g, dim: !counts[g] }" :disabled="!counts[g]" @click="pickIndex(g)">{{ g }}</button>
      <span class="gl-idx-sep"></span>
      <button v-for="g in alphaPresent" :key="g" class="gl-idx" :class="{ on: idx === g }" @click="pickIndex(g)">{{ g }}</button>
      <button v-if="hasHash" class="gl-idx" :class="{ on: idx === '#' }" @click="pickIndex('#')">#</button>
    </div>

    <!-- 결과 헤더 -->
    <div class="gl-result-head">
      <span>{{ q ? `‘${q}’ 검색 결과` : (idx === 'all' ? '전체 용어' : `‘${idx}’ 색인`) }}</span>
      <span class="gl-result-n">{{ list.length }}건</span>
      <button v-if="filtered" class="gl-reset-link" @click="reset()"><Icon name="x" :size="12" /> 초기화</button>
    </div>

    <!-- 용어 목록 (사전 엔트리) -->
    <div class="gl-list" v-if="list.length">
      <div v-for="t in list" :key="t.term" class="gl-entry">
        <span class="gl-entry-initial">{{ initialOf(t.term) }}</span>
        <div class="gl-entry-body">
          <div class="gl-entry-head">
            <span class="gl-term">{{ t.term }}</span>
            <span v-if="t.isNew" class="gl-new">NEW</span>
            <span v-if="t.abbr" class="gl-abbr">약어 {{ t.abbr }}</span>
            <span class="gl-cat">{{ t.cat }}</span>
          </div>
          <div class="gl-syn" v-if="synOf(t).length">
            <span class="gl-syn-label">유의어·동의어</span>
            <button v-for="s in synOf(t)" :key="s" class="gl-syn-chip" @click="searchTerm(s)">{{ s }}</button>
          </div>
          <div class="gl-def">{{ t.def }}</div>
          <div class="gl-related" v-if="t.related && t.related.length">
            <span class="gl-rel-label">관련 용어</span>
            <button v-for="r in t.related" :key="r" class="gl-rel" @click="searchTerm(r)">{{ r }}</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="card empty gl-empty">
      <b>‘{{ q || idx }}’에 해당하는 용어가 없습니다</b>
      <span>다른 검색어·색인을 선택하거나, 새 용어를 등록해 보세요.</span>
      <div class="gl-empty-act">
        <button class="btn btn-ghost btn-sm" @click="reset()"><Icon name="back" :size="13" /> 전체 보기</button>
        <button class="btn btn-primary btn-sm" @click="regModal = true"><Icon name="plus" :size="13" /> 용어 등록</button>
      </div>
    </div>

    <!-- 용어 등록/신청 -->
    <GlossaryTermModal v-if="regModal" @close="regModal = false" />
  </div>
</template>

<style scoped>
.gl { width: 100%; }
.gl-top { display: flex; align-items: center; gap: 12px; margin: 4px 0 16px; }
.gl-search { flex: 1; display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 16px;
  border: 1px solid var(--line-strong); border-radius: 13px; background: var(--card); box-shadow: var(--shadow); }
.gl-search:focus-within { border-color: var(--navy); box-shadow: var(--ring); }
.gl-search svg { color: var(--gray-lt); flex-shrink: 0; }
.gl-search input { flex: 1; border: 0; outline: 0; background: transparent; color: var(--ink); font-size: 15px; }
.gl-search-x { border: 0; background: transparent; color: var(--gray-lt); cursor: pointer; display: grid; place-items: center; }
.gl-search-x:hover { color: var(--ink); }
.gl-count { font-size: 12.5px; font-weight: 700; color: var(--gray-lt); white-space: nowrap; }

/* 등록 신청 안내 (승인은 마이페이지 승인함) */
.gl-pending-hint { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gray); background: var(--canvas);
  border: 1px solid var(--line); border-radius: 9px; padding: 8px 12px; margin-bottom: 16px; }
.gl-pending-hint svg { color: var(--navy-lt); }
.gl-hint-link { display: inline-flex; align-items: center; gap: 3px; margin-left: auto; font-size: 12px; font-weight: 750;
  color: var(--navy); background: transparent; border: 0; cursor: pointer; }
.gl-hint-link:hover { text-decoration: underline; }
.gl-hint-link svg { color: var(--navy); }

/* 인덱스 */
.gl-index { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 12px; border: 1px solid var(--line);
  border-radius: var(--r-md); background: var(--card); margin-bottom: 16px; }
.gl-idx { min-width: 30px; height: 30px; padding: 0 8px; border: 1px solid transparent; border-radius: 8px; background: transparent;
  color: var(--gray); font-size: 13px; font-weight: 750; cursor: pointer; transition: .12s; }
.gl-idx.ko { font-weight: 800; }
.gl-idx:hover:not(:disabled) { background: var(--canvas); color: var(--ink); }
.gl-idx.on { background: var(--navy); border-color: var(--navy); color: #fff; }
.gl-idx.dim { color: var(--line-strong); cursor: default; }
.gl-idx-sep { width: 1px; height: 20px; background: var(--line-strong); margin: 0 6px; }

/* 상단 전체보기(초기화) 버튼 */
.gl-reset { flex-shrink: 0; white-space: nowrap; }

/* 결과 헤더 */
.gl-result-head { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 800; color: var(--ink); margin-bottom: 10px; }
.gl-result-n { font-size: 12px; font-weight: 700; color: var(--gray-lt); }
.gl-reset-link { display: inline-flex; align-items: center; gap: 3px; margin-left: auto; font-size: 12px; font-weight: 750;
  color: var(--navy); background: var(--navy-soft); border: 1px solid rgba(0,70,255,.14); border-radius: 999px;
  padding: 3px 11px; cursor: pointer; transition: .12s; }
.gl-reset-link:hover { background: var(--navy); color: #fff; }

/* 결과 없음 */
.gl-empty { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.gl-empty span { color: var(--gray); font-size: 12.5px; }
.gl-empty-act { display: flex; gap: 8px; margin-top: 12px; }

/* 사전 엔트리 — 넓은 화면에서는 여러 열로 채운다 */
.gl-list { display: grid; grid-template-columns: 1fr; gap: 10px; align-items: start; }
@media (min-width: 1180px) { .gl-list { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1720px) { .gl-list { grid-template-columns: repeat(3, 1fr); } }
.gl-entry { display: flex; gap: 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--card);
  box-shadow: var(--shadow); padding: 16px 18px; }
.gl-entry-initial { flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; background: var(--navy-soft);
  color: var(--navy); font-size: 16px; font-weight: 850; display: grid; place-items: center; }
.gl-entry-body { flex: 1; min-width: 0; }
.gl-entry-head { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.gl-term { font-size: 16px; font-weight: 850; color: var(--ink); letter-spacing: -.3px; }
.gl-new { font-size: 9.5px; font-weight: 800; color: #fff; background: var(--green); border-radius: 5px; padding: 1px 6px; }
.gl-abbr { font-size: 11px; font-weight: 750; color: var(--accent-ink); background: var(--accent-bg); border-radius: 6px; padding: 2px 8px; }
.gl-cat { font-size: 11px; font-weight: 700; color: var(--gray); background: var(--canvas); border: 1px solid var(--line); border-radius: 6px; padding: 2px 8px; }
.gl-syn { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.gl-syn-label { font-size: 11px; font-weight: 800; color: var(--navy); margin-right: 2px; }
.gl-syn-chip { font-size: 11.5px; font-weight: 650; color: var(--navy); background: var(--navy-soft); border: 1px solid rgba(0,70,255,.14);
  border-radius: 999px; padding: 3px 10px; cursor: pointer; transition: .12s; }
.gl-syn-chip:hover { background: var(--navy); color: #fff; }
.gl-syn-chip.static { cursor: default; }
.gl-def { font-size: 13.5px; color: var(--ink); line-height: 1.65; margin-top: 10px; }
.gl-related { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 11px; padding-top: 11px; border-top: 1px dashed var(--line); }
.gl-rel-label { font-size: 11px; font-weight: 800; color: var(--gray-lt); margin-right: 2px; }
.gl-rel { font-size: 11.5px; font-weight: 650; color: var(--gray); background: var(--card); border: 1px solid var(--line-strong);
  border-radius: 7px; padding: 3px 9px; cursor: pointer; transition: .12s; }
.gl-rel:hover { border-color: var(--navy); color: var(--navy); }

@media (max-width: 720px) { .gl-top { flex-wrap: wrap; } .gl-search { order: 3; flex-basis: 100%; } }
</style>
