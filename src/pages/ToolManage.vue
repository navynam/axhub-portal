<script setup>
/**
 * 툴 관리 — 에이전트 생성에 쓰는 도구·미들웨어·스킬·MCP 카탈로그 · [담당: 개발자 C]
 * -----------------------------------------------------------------------------
 * 원천(툴) 시스템 화면을 본떠 카드 그리드로 구성. 레이아웃은 에이전트 카탈로그와 동일.
 *  · 상단 탭: 내가 사용할 수 있는 목록 / 전체 목록
 *  · 유형 탭: 전체 / 도구 / 미들웨어 / 스킬 / MCP
 *  · 유형(연결 방식)·태그로 추가 필터, 전체 목록은 워크스페이스(부서)별 섹션으로 그룹화
 *  · 각 카드에서 도구/미들웨어/스킬/MCP 권한을 하나씩 신청
 */
import { ref, computed } from 'vue'
import { store, requestResource, cancelRequest } from '../store.js'
import Icon from '../components/Icon.vue'

const tab = ref('mine')            // mine | all
const typeFilter = ref('all')      // all | tool | middleware | skill | mcp
const protoFilter = ref('')        // '' | built-in | custom | http | mcp-http | mcp-stdio
const tagFilter = ref('')
const q = ref('')
const view = ref('grid')           // grid | list

const TYPES = [
  { key: 'all', label: '전체' },
  { key: 'tool', label: '도구', ico: 'tool' },
  { key: 'middleware', label: '미들웨어', ico: 'layers' },
  { key: 'skill', label: '스킬', ico: 'zap' },
  { key: 'mcp', label: 'MCP', ico: 'grid' },
]
const typeLabel = k => (TYPES.find(t => t.key === k) || {}).label || k
const PROTOS = ['built-in', 'custom', 'http', 'mcp-http', 'mcp-stdio']

// 부서·워크스페이스 (전체 목록 섹션 그룹)
const WORKSPACES = [
  { id: 'platform', name: 'AX 플랫폼', depts: ['AI플랫폼팀', '데이터플랫폼팀'] },
  { id: 'biz', name: '업무 부서', depts: ['CS팀', '심사부', '상품개발부', '준법감시부', '경영지원부'] },
  { id: 'infra', name: '인프라·협업', depts: ['IT인프라팀', '정보시스템부', '협업플랫폼팀', 'DevOps팀'] },
]

// store.resources 맵 → 배열
const resources = computed(() => Object.entries(store.resources).map(([name, r]) => ({ name, ...r })))
const orderOf = { tool: 0, middleware: 1, skill: 2, mcp: 3 }
const isMine = r => r.perm === 'granted' || r.perm === 'owner'

// 탭 기준 base (내 목록 = 보유, 전체 = 전부)
const tabBase = computed(() => tab.value === 'mine' ? resources.value.filter(isMine) : resources.value)

// 유형 탭을 제외한 필터 적용(유형 탭 카운트 계산용)
const filteredExceptType = computed(() => {
  const t = q.value.trim()
  return tabBase.value
    .filter(r => !protoFilter.value || r.proto === protoFilter.value)
    .filter(r => !tagFilter.value || (r.tags || []).includes(tagFilter.value))
    .filter(r => !t || (r.name + r.desc + r.owner + (r.tags || []).join()).includes(t))
})

// 최종 목록(유형 탭까지 적용 + 정렬)
const list = computed(() =>
  filteredExceptType.value
    .filter(r => typeFilter.value === 'all' || r.type === typeFilter.value)
    .slice()
    .sort((a, b) => (orderOf[a.type] - orderOf[b.type]) || a.name.localeCompare(b.name))
)

// 전체 목록: 워크스페이스별 섹션 그룹화 / 내 목록: 단일 평면 그룹
const sections = computed(() => {
  if (tab.value === 'mine') return [{ name: '', items: list.value, header: false }]
  return WORKSPACES
    .map(w => ({ name: w.name, items: list.value.filter(r => w.depts.includes(r.owner)), header: true }))
    .filter(g => g.items.length)
})
const totalCount = computed(() => list.value.length)

// 카운트
const mineTotal = computed(() => resources.value.filter(isMine).length)
const typeCount = k => k === 'all' ? filteredExceptType.value.length : filteredExceptType.value.filter(r => r.type === k).length
const protoCount = p => tabBase.value.filter(r => r.proto === p).length

// 태그 풀 (현재 탭 base 기준)
const allTags = computed(() => {
  const set = new Set()
  tabBase.value.forEach(r => (r.tags || []).forEach(t => set.add(t)))
  return [...set].sort()
})
function toggleTag(t) { tagFilter.value = tagFilter.value === t ? '' : t }
function setType(k) { typeFilter.value = k }
function resetFilters() { protoFilter.value = ''; tagFilter.value = ''; q.value = '' }

// 권한 신청 / 취소
function reqTool(r) { requestResource(r.name) }
function cancelTool(r) {
  const req = store.requests.find(x => x.mine && x.status === 'pending' && x.targetType === 'resource' && x.targetName === r.name)
  if (req) cancelRequest(req)
}
</script>

<template>
  <div>
    <div class="catalog-toolbar">
      <!-- 상단 탭 -->
      <div class="tabs" role="tablist">
        <button role="tab" :aria-selected="tab === 'mine'" :class="{ on: tab === 'mine' }" @click="tab = 'mine'">내가 사용할 수 있는 목록<span class="n">{{ mineTotal }}</span></button>
        <button role="tab" :aria-selected="tab === 'all'" :class="{ on: tab === 'all' }" @click="tab = 'all'">전체 목록<span class="n">{{ resources.length }}</span></button>
      </div>

      <!-- 유형 탭 -->
      <div class="tabs tabs-sub" role="tablist">
        <button v-for="t in TYPES" :key="t.key" role="tab" :aria-selected="typeFilter === t.key"
          :class="{ on: typeFilter === t.key }" @click="setType(t.key)">
          <Icon v-if="t.ico" :name="t.ico" :size="13" class="tab-ic" />{{ t.label }}<span class="n">{{ typeCount(t.key) }}</span>
        </button>
      </div>

      <!-- 검색 + 보기 -->
      <div class="filters">
        <div class="search"><Icon name="search" :size="16" /><input v-model="q" placeholder="도구·미들웨어·스킬·MCP 검색" aria-label="검색" /></div>
        <div class="view-toggle" role="group" aria-label="보기 방식">
          <button :class="{ on: view === 'grid' }" @click="view = 'grid'" aria-label="카드 보기" title="카드 보기"><Icon name="grid" :size="16" /></button>
          <button :class="{ on: view === 'list' }" @click="view = 'list'" aria-label="리스트 보기" title="리스트 보기"><Icon name="list" :size="16" /></button>
        </div>
      </div>
    </div>

    <!-- 유형(연결 방식) · 태그 필터 -->
    <div class="tm-filters">
      <div class="tm-frow">
        <span class="tm-flabel">유형</span>
        <button class="filter-chip" :class="{ on: !protoFilter }" @click="protoFilter = ''">전체</button>
        <span class="tm-div"></span>
        <button v-for="p in PROTOS" :key="p" class="filter-chip" :class="{ on: protoFilter === p }" @click="protoFilter = protoFilter === p ? '' : p" :disabled="!protoCount(p)">
          <span class="proto-dot" :class="'p-' + p"></span>{{ p }}
        </button>
      </div>
      <div class="tm-frow" v-if="allTags.length">
        <span class="tm-flabel">태그</span>
        <button v-for="t in allTags" :key="t" class="filter-chip" :class="{ on: tagFilter === t }" @click="toggleTag(t)">{{ t }}</button>
        <button v-if="tagFilter || protoFilter" class="filter-chip clear" @click="resetFilters"><Icon name="x" :size="11" /> 초기화</button>
      </div>
    </div>

    <!-- 카드/리스트 -->
    <template v-if="totalCount">
      <section v-for="g in sections" :key="g.name || 'mine'" class="folder-group">
        <div class="folder-group-head" v-if="g.header">
          <Icon name="folder" :size="15" /><span class="fgh-name">{{ g.name }}</span><span class="fgh-count">{{ g.items.length }}</span>
        </div>

        <!-- 카드 그리드 -->
        <div class="ax-grid" v-if="view === 'grid'">
          <div v-for="r in g.items" :key="r.name" class="card ax-card tool-card">
            <span class="tool-stat" :class="'s-' + r.perm">
              <span class="tool-stat-dot"></span>{{ isMine(r) ? '보유' : r.perm === 'pending' ? '요청중' : '미보유' }}
            </span>
            <div class="ax-card-body">
              <div class="tool-card-top">
                <span class="tool-ic" :class="'t-' + r.type"><Icon :name="TYPES.find(t => t.key === r.type)?.ico || 'tool'" :size="15" /></span>
                <span class="tool-kind" :class="'t-' + r.type">{{ typeLabel(r.type) }}</span>
              </div>
              <div class="ax-name">{{ r.name }}</div>
              <div class="ax-desc">{{ r.desc }}</div>
              <div class="ax-tags">
                <span class="proto-badge" :class="'p-' + r.proto">{{ r.proto }}</span>
                <span v-for="t in (r.tags || []).slice(0, 3)" :key="t" class="ax-tag">{{ t }}</span>
              </div>
            </div>
            <div class="ax-actions">
              <span class="tool-owner"><Icon name="shield" :size="12" /> {{ r.owner }}</span>
              <span class="grow"></span>
              <span v-if="isMine(r)" class="tool-avail">사용 가능</span>
              <template v-else-if="r.perm === 'pending'">
                <button class="btn btn-ghost btn-sm" @click="cancelTool(r)">요청 취소</button>
              </template>
              <button v-else class="btn btn-gray btn-sm" @click="reqTool(r)"><Icon name="shield" :size="12" /> {{ r.perm === 'denied' ? '재요청' : '권한 신청' }}</button>
            </div>
          </div>
        </div>

        <!-- 리스트 보기 -->
        <div class="card tool-list" v-else>
          <div v-for="r in g.items" :key="r.name" class="tool-row">
            <span class="tool-ic" :class="'t-' + r.type"><Icon :name="TYPES.find(t => t.key === r.type)?.ico || 'tool'" :size="16" /></span>
            <div class="tool-body">
              <div class="tool-name">{{ r.name }} <span class="tool-kind" :class="'t-' + r.type">{{ typeLabel(r.type) }}</span> <span class="proto-badge" :class="'p-' + r.proto">{{ r.proto }}</span></div>
              <div class="tool-meta">{{ r.desc }} · 운영 {{ r.owner }}</div>
            </div>
            <div class="tool-act">
              <span v-if="isMine(r)" class="pill pill-active pill-sm">보유</span>
              <template v-else-if="r.perm === 'pending'">
                <span class="pill pill-pending pill-sm">요청중</span>
                <button class="btn btn-ghost btn-sm" @click="cancelTool(r)">취소</button>
              </template>
              <button v-else class="btn btn-gray btn-sm" @click="reqTool(r)"><Icon name="shield" :size="12" /> {{ r.perm === 'denied' ? '재요청' : '권한 신청' }}</button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <div v-else class="card empty" style="margin-top:8px">
      <b>표시할 항목이 없습니다</b>유형·연결 방식·태그·검색어를 조정해 보세요.
    </div>
  </div>
</template>
