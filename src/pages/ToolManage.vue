<script setup>
/**
 * 툴 관리 — 에이전트 생성에 쓰는 도구·미들웨어·스킬·MCP 카탈로그 · [담당: 개발자 C]
 * -----------------------------------------------------------------------------
 * 원천(툴) 시스템 화면을 본떠 카드 그리드로 구성. 레이아웃은 에이전트 카탈로그와 동일.
 *  · 상단 탭: 내가 사용할 수 있는 목록 / 전체 목록
 *  · 유형 탭: 전체 / 도구 / 미들웨어 / 스킬 / MCP
 *  · 유형·업무부서·태그로 추가 필터, 내 목록·전체 목록 모두 부서(워크스페이스)별 섹션으로 그룹화
 *  · 각 카드에서 도구/미들웨어/스킬/MCP 권한을 하나씩 신청
 */
import { ref, computed } from 'vue'
import { store, requestResource, cancelRequest } from '../store.js'
import Icon from '../components/Icon.vue'
import ToolDetailModal from '../components/ToolDetailModal.vue'

const tab = ref('mine')            // mine | all
const typeFilter = ref('all')      // all | tool | mcp | middleware | skill
const tagFilter = ref('')
const deptFilter = ref('all')      // 업무부서 필터 (all | 조직명)
const onlyNoPerm = ref(false)      // 권한 없음(미보유)만 보기
const q = ref('')
const view = ref('grid')           // grid | list

// 유형 탭 순서: 전체 · 도구 · MCP · 미들웨어 · 스킬
const TYPES = [
  { key: 'all', label: '전체' },
  { key: 'tool', label: '도구', ico: 'tool' },
  { key: 'mcp', label: 'MCP', ico: 'grid' },
  { key: 'middleware', label: '미들웨어', ico: 'layers' },
  { key: 'skill', label: '스킬', ico: 'zap' },
]
const typeLabel = k => (TYPES.find(t => t.key === k) || {}).label || k

// 업무부서(사용 조직) — 콤보 목록. 카드에는 각 도구의 dept 를 태그로 표시.
const DEPTS = [
  '고객채널', '영업채널', 'AX추진팀', '디지털전략팀', '데이터플랫폼팀', 'AI플랫폼팀',
  '상품개발부', '심사부', '계리부', '준법감시부', '리스크관리부', '마케팅부',
  '고객서비스부', '경영기획부', '재무기획부', '인사부', 'IT인프라팀', '정보보안팀',
  '클라우드플랫폼팀', 'RPA자동화팀',
]

// 부서·워크스페이스 (전체 목록 섹션 그룹)
const WORKSPACES = [
  { id: 'platform', name: 'AX 플랫폼', depts: ['AI플랫폼팀', '데이터플랫폼팀'] },
  { id: 'biz', name: '업무 부서', depts: ['CS팀', '심사부', '상품개발부', '준법감시부', '경영지원부'] },
  { id: 'infra', name: '인프라·협업', depts: ['IT인프라팀', '정보시스템부', '협업플랫폼팀', 'DevOps팀'] },
]

// store.resources 맵 → 배열
const resources = computed(() => Object.entries(store.resources).map(([name, r]) => ({ name, ...r })))
const orderOf = { tool: 0, mcp: 1, middleware: 2, skill: 3 }
const isMine = r => r.perm === 'granted' || r.perm === 'owner'

// 탭 기준 base (내 목록 = 보유, 전체 = 전부)
const tabBase = computed(() => tab.value === 'mine' ? resources.value.filter(isMine) : resources.value)

// 유형 탭을 제외한 필터 적용(유형 탭 카운트 계산용)
const filteredExceptType = computed(() => {
  const t = q.value.trim()
  return tabBase.value
    .filter(r => deptFilter.value === 'all' || r.dept === deptFilter.value)
    .filter(r => !onlyNoPerm.value || !isMine(r))
    .filter(r => !tagFilter.value || (r.tags || []).includes(tagFilter.value))
    .filter(r => !t || (r.name + r.desc + r.owner + (r.dept || '') + (r.tags || []).join()).includes(t))
})

// 최종 목록(유형 탭까지 적용 + 정렬)
const list = computed(() =>
  filteredExceptType.value
    .filter(r => typeFilter.value === 'all' || r.type === typeFilter.value)
    .slice()
    .sort((a, b) => (orderOf[a.type] - orderOf[b.type]) || a.name.localeCompare(b.name))
)

// 부서(워크스페이스)별 섹션 그룹화 — 내 목록·전체 목록 공통.
// 워크스페이스에 속하지 않는 소유 부서는 '기타'로 모은다.
const sections = computed(() => {
  const known = new Set(WORKSPACES.flatMap(w => w.depts))
  const groups = WORKSPACES.map(w => ({ name: w.name, items: list.value.filter(r => w.depts.includes(r.owner)), header: true }))
  const others = list.value.filter(r => !known.has(r.owner))
  if (others.length) groups.push({ name: '기타', items: others, header: true })
  return groups.filter(g => g.items.length)
})
const totalCount = computed(() => list.value.length)

// 카운트
const mineTotal = computed(() => resources.value.filter(isMine).length)
const typeCount = k => k === 'all' ? filteredExceptType.value.length : filteredExceptType.value.filter(r => r.type === k).length

// 태그 풀 (현재 탭 base 기준)
const allTags = computed(() => {
  const set = new Set()
  tabBase.value.forEach(r => (r.tags || []).forEach(t => set.add(t)))
  return [...set].sort()
})
function toggleTag(t) { tagFilter.value = tagFilter.value === t ? '' : t }
function setType(k) { typeFilter.value = k }

// 태그 라인 좌우 스크롤
const tagTrack = ref(null)
function scrollTags(dir) { tagTrack.value?.scrollBy({ left: dir * 260, behavior: 'smooth' }) }

// 카드 클릭 → 툴 상세 팝업
const detailTool = ref(null)

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

      <!-- 검색 + 업무부서 콤보 + 보기 -->
      <div class="filters">
        <div class="search"><Icon name="search" :size="16" /><input v-model="q" placeholder="도구·미들웨어·스킬·MCP 검색" aria-label="검색" /></div>
        <select class="select" v-model="deptFilter" aria-label="업무부서">
          <option value="all">업무부서 전체</option>
          <option v-for="d in DEPTS" :key="d" :value="d">{{ d }}</option>
        </select>
        <label class="tm-check" :class="{ on: onlyNoPerm }" title="권한 없는(미보유) 항목만 표시">
          <input type="checkbox" v-model="onlyNoPerm" /> 권한 없음만
        </label>
        <div class="view-toggle" role="group" aria-label="보기 방식">
          <button :class="{ on: view === 'grid' }" @click="view = 'grid'" aria-label="카드 보기" title="카드 보기"><Icon name="grid" :size="16" /></button>
          <button :class="{ on: view === 'list' }" @click="view = 'list'" aria-label="리스트 보기" title="리스트 보기"><Icon name="list" :size="16" /></button>
        </div>
      </div>
    </div>

    <!-- 태그 필터 (한 줄 · 좌우 스크롤) -->
    <div class="tm-filters" v-if="allTags.length">
      <div class="tm-frow tm-tags">
        <button class="tag-nav" @click="scrollTags(-1)" aria-label="태그 왼쪽으로" title="왼쪽으로"><Icon name="back" :size="14" /></button>
        <div class="tag-track" ref="tagTrack">
          <button v-for="t in allTags" :key="t" class="filter-chip" :class="{ on: tagFilter === t }" @click="toggleTag(t)">{{ t }}</button>
        </div>
        <button class="tag-nav" @click="scrollTags(1)" aria-label="태그 오른쪽으로" title="오른쪽으로"><Icon name="arrow" :size="14" /></button>
        <button v-if="tagFilter" class="filter-chip clear" @click="tagFilter = ''"><Icon name="x" :size="11" /> 초기화</button>
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
          <div v-for="r in g.items" :key="r.name" class="card ax-card tool-card" role="button" tabindex="0"
            @click="detailTool = r" @keydown.enter="detailTool = r">
            <span class="tool-stat" :class="'s-' + r.perm">
              <span class="tool-stat-dot"></span>{{ isMine(r) ? '보유' : r.perm === 'pending' ? '요청중' : '미보유' }}
            </span>
            <div class="ax-card-body">
              <div class="tool-card-top">
                <span class="tool-ic" :class="'t-' + r.type"><Icon :name="TYPES.find(t => t.key === r.type)?.ico || 'tool'" :size="15" /></span>
                <span class="tool-kind" :class="'t-' + r.type">{{ typeLabel(r.type) }}</span>
                <span v-if="r.dept" class="tool-dept"><Icon name="users" :size="11" /> {{ r.dept }}</span>
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
                <button class="btn btn-ghost btn-sm" @click.stop="cancelTool(r)">요청 취소</button>
              </template>
              <button v-else class="btn btn-gray btn-sm" @click.stop="reqTool(r)"><Icon name="shield" :size="12" /> {{ r.perm === 'denied' ? '재요청' : '권한 신청' }}</button>
            </div>
          </div>
        </div>

        <!-- 리스트 보기 -->
        <div class="card tool-list" v-else>
          <div v-for="r in g.items" :key="r.name" class="tool-row" role="button" tabindex="0"
            @click="detailTool = r" @keydown.enter="detailTool = r">
            <span class="tool-ic" :class="'t-' + r.type"><Icon :name="TYPES.find(t => t.key === r.type)?.ico || 'tool'" :size="16" /></span>
            <div class="tool-body">
              <div class="tool-name">{{ r.name }} <span class="tool-kind" :class="'t-' + r.type">{{ typeLabel(r.type) }}</span> <span v-if="r.dept" class="tool-dept"><Icon name="users" :size="11" /> {{ r.dept }}</span> <span class="proto-badge" :class="'p-' + r.proto">{{ r.proto }}</span></div>
              <div class="tool-meta">{{ r.desc }} · 운영 {{ r.owner }}</div>
            </div>
            <div class="tool-act">
              <span v-if="isMine(r)" class="pill pill-active pill-sm">보유</span>
              <template v-else-if="r.perm === 'pending'">
                <span class="pill pill-pending pill-sm">요청중</span>
                <button class="btn btn-ghost btn-sm" @click.stop="cancelTool(r)">취소</button>
              </template>
              <button v-else class="btn btn-gray btn-sm" @click.stop="reqTool(r)"><Icon name="shield" :size="12" /> {{ r.perm === 'denied' ? '재요청' : '권한 신청' }}</button>
            </div>
          </div>
        </div>
      </section>
    </template>

    <div v-else class="card empty" style="margin-top:8px">
      <b>표시할 항목이 없습니다</b>유형·연결 방식·태그·검색어를 조정해 보세요.
    </div>

    <!-- 툴 상세 팝업 -->
    <ToolDetailModal v-if="detailTool" :tool="detailTool" @close="detailTool = null" />
  </div>
</template>
