<script setup>
import { ref, computed } from 'vue'
import { store, toggleActive, openRun, toggleFavorite, agentReady, resourcePerm, openRequest, addFolder } from '../store.js'
import Icon from '../components/Icon.vue'
import AgentInfoModal from '../components/AgentInfoModal.vue'
import FolderPickerModal from '../components/FolderPickerModal.vue'
import PromptDialog from '../components/PromptDialog.vue'

const tabs = [
  { key: 'mine', label: '내 Agent' },
  { key: 'all', label: '전체 Agent' },
  { key: 'fav', label: '즐겨찾기', icon: 'star' },
]
const tab = ref('all')
const q = ref('')
const accessFilter = ref('all')   // all | yes(실행 가능) | no(도구 권한 필요)
const view = ref('grid')          // grid | list
const infoAgent = ref(null)

const tagFilter = ref('')         // 선택된 해시태그(도구)
const folderFilter = ref('전체')  // 선택된 폴더
const folderFor = ref(null)       // 폴더 이동 팝업 대상 에이전트
const showNewFolder = ref(false)  // 새 폴더 생성 팝업

// 실행 가능 = 활용 도구를 모두 보유(내 소유는 활성 상태여야)
const isRunnable = a => agentReady(a) && (a.perm !== 'owner' || a.active)

// 즐겨찾기 = 별 표시 / 내 Agent = 소유 / 전체 Agent = 타 Agent + 소유이면서 활성인 것만
const inTab = a =>
  tab.value === 'fav' ? a.fav
    : tab.value === 'mine' ? a.perm === 'owner'
      : (a.perm !== 'owner' || a.active)

// 해시태그 = 에이전트가 쓰는 도구명 모음 (태그 클릭으로 검색)
const allTags = computed(() => {
  const set = new Set()
  store.agents.forEach(a => (a.tools || []).forEach(t => set.add(t)))
  return [...set]
})
function toggleTag(t) { tagFilter.value = tagFilter.value === t ? '' : t }

// 폴더 목록 = 전체 + 에이전트 폴더 + 사용자 생성 폴더
const folderList = computed(() => {
  const set = new Set(store.agents.map(a => a.folder).filter(Boolean))
  store.folders.forEach(f => set.add(f))
  return ['전체', ...set]
})
// 폴더별 개수(현재 탭 기준)
function folderCount(f) {
  const base = store.agents.filter(inTab)
  return f === '전체' ? base.length : base.filter(a => a.folder === f).length
}
// 공통 팝업으로 새 폴더 생성 → 생성한 폴더로 필터 전환
function onCreateFolder(name) {
  const f = addFolder(name)
  showNewFolder.value = false
  if (f) folderFilter.value = f
}

// 요청중 = 실행 불가인데 미보유 도구가 전부 '요청중'(none/denied 없음)
const agentPending = a =>
  !agentReady(a) &&
  (a.tools || []).some(t => resourcePerm(t) === 'pending') &&
  !(a.tools || []).some(t => ['none', 'denied'].includes(resourcePerm(t)))

// 폴더를 제외한 모든 필터 (폴더는 아래 섹션에서 그룹화) + 공유 많은 순 정렬
const list = computed(() =>
  store.agents
    .filter(inTab)
    .filter(a => !tagFilter.value || (a.tools || []).includes(tagFilter.value))
    .filter(a => !q.value.trim() || (a.name + a.desc + a.owner).includes(q.value.trim()))
    .filter(a => accessFilter.value === 'all' || isRunnable(a) === (accessFilter.value === 'yes'))
    .slice()
    .sort((x, y) => y.shares - x.shares)
)

// 폴더별 그룹 섹션.
//  · '전체' 선택 → 폴더별로 나눠 헤더와 함께 표시 (그룹화 시각화)
//  · 특정 폴더 선택 → 그 폴더만 평면으로 표시 (헤더 없음)
const sections = computed(() => {
  const base = list.value
  if (folderFilter.value !== '전체') {
    return [{ folder: folderFilter.value, items: base.filter(a => a.folder === folderFilter.value), header: false }]
  }
  return folderList.value
    .filter(f => f !== '전체')
    .map(f => ({ folder: f, items: base.filter(a => a.folder === f), header: true }))
    .filter(g => g.items.length)
})
const totalCount = computed(() => sections.value.reduce((n, g) => n + g.items.length, 0))

const tabCount = key =>
  key === 'fav' ? store.agents.filter(a => a.fav).length
    : key === 'mine' ? store.agents.filter(a => a.perm === 'owner').length
      : store.agents.filter(a => a.perm !== 'owner' || a.active).length
</script>

<template>
  <div>
    <div class="catalog-toolbar">
      <div class="tabs" role="tablist">
        <button v-for="t in tabs" :key="t.key" role="tab" :aria-selected="tab === t.key"
          :class="{ on: tab === t.key }" @click="tab = t.key">
          <Icon v-if="t.icon" :name="t.icon" :size="13" class="tab-ic" />{{ t.label }}<span class="n">{{ tabCount(t.key) }}</span>
        </button>
      </div>

      <div class="filters">
        <div class="search"><Icon name="search" :size="16" /><input v-model="q" placeholder="Agent 검색" aria-label="Agent 검색" /></div>
        <select class="select" v-model="accessFilter" aria-label="상태 필터">
          <option value="all">상태 전체</option>
          <option value="yes">실행 가능</option>
          <option value="no">도구 권한 필요</option>
        </select>
        <div class="view-toggle" role="group" aria-label="보기 방식">
          <button :class="{ on: view === 'grid' }" @click="view = 'grid'" aria-label="카드 보기" title="카드 보기"><Icon name="grid" :size="16" /></button>
          <button :class="{ on: view === 'list' }" @click="view = 'list'" aria-label="리스트 보기" title="리스트 보기"><Icon name="list" :size="16" /></button>
        </div>
      </div>

      <!-- 폴더 그룹 바 (전체·폴더별 필터 + 새 폴더) -->
      <div class="folder-bar" role="group" aria-label="폴더">
        <button v-for="f in folderList" :key="f" class="folder-chip" :class="{ on: folderFilter === f }" @click="folderFilter = f">
          <Icon :name="f === '전체' ? 'grid' : 'folder'" :size="13" />{{ f }}<span class="fc-n">{{ folderCount(f) }}</span>
        </button>
        <button class="folder-chip add" @click="showNewFolder = true" title="새 폴더 만들기"><Icon name="plus" :size="13" /> 새 폴더</button>
      </div>
    </div>

    <!-- 해시태그 검색 (도구 기준) -->
    <div class="hashtags" v-if="allTags.length">
      <button v-for="t in allTags" :key="t" class="hashtag" :class="{ on: tagFilter === t }" @click="toggleTag(t)">#{{ t }}</button>
      <button v-if="tagFilter" class="hashtag clear" @click="tagFilter = ''"><Icon name="x" :size="11" /> 초기화</button>
    </div>

    <!-- 폴더별 그룹 섹션 -->
    <template v-if="totalCount">
      <section v-for="g in sections" :key="g.folder" class="folder-group">
        <div class="folder-group-head" v-if="g.header">
          <Icon name="folder" :size="15" /><span class="fgh-name">{{ g.folder }}</span><span class="fgh-count">{{ g.items.length }}</span>
        </div>

        <!-- 카드 보기 -->
        <div class="ax-grid" v-if="view === 'grid'">
          <div v-for="a in g.items" :key="a.id" class="card ax-card" role="button" tabindex="0"
            @click="infoAgent = a" @keydown.enter="infoAgent = a">
            <button class="ax-fav" :class="{ on: a.fav }" @click.stop="toggleFavorite(a)"
              :aria-label="`${a.name} 즐겨찾기 ${a.fav ? '해제' : '추가'}`" :aria-pressed="a.fav"><Icon name="star" :size="16" /></button>
            <div class="ax-card-body">
              <div class="ax-name">{{ a.name }}</div>
              <div class="ax-desc">{{ a.desc }}</div>
              <div class="ax-tags"><span v-for="t in (a.tools || []).slice(0, 3)" :key="t" class="ax-tag">{{ t }}</span></div>
            </div>
            <div class="ax-actions" @click.stop>
              <button v-if="a.perm === 'owner'" class="toggle sm" :class="{ on: a.active }" @click="toggleActive(a)"
                :aria-label="`${a.name} ${a.active ? '비활성화' : '활성화'}`" :aria-pressed="a.active"></button>
              <button class="ax-folder" @click="folderFor = a" :title="`폴더: ${a.folder} · 클릭하여 이동`">
                <Icon name="folder" :size="12" /><span class="axf-name">{{ a.folder }}</span>
              </button>
              <span class="ax-share" title="공유 횟수"><Icon name="share" :size="11" /> {{ a.shares.toLocaleString() }}</span>
              <span class="grow"></span>
              <button v-if="agentReady(a)" class="btn btn-primary btn-sm" :disabled="a.perm === 'owner' && !a.active" @click="openRun(a)">
                <Icon name="play" :size="13" /> 실행
              </button>
              <button v-else-if="agentPending(a)" class="btn btn-ghost btn-sm" disabled>
                <Icon name="clock" :size="12" /> 요청중
              </button>
              <button v-else class="btn btn-gray btn-sm" @click="openRequest('agent', a)">
                <Icon name="shield" :size="12" /> 권한 요청
              </button>
            </div>
          </div>
        </div>

        <!-- 리스트 보기 -->
        <div class="card agent-list" v-else>
          <div v-for="a in g.items" :key="a.id" class="alr">
            <div class="sq sq-navy sq-sm">{{ a.name.slice(0, 1) }}</div>
            <div class="alr-main">
              <div class="alr-name">{{ a.name }}</div>
              <div class="alr-desc">{{ a.desc }}</div>
            </div>
            <div class="alr-owner">{{ a.owner }}</div>
            <div class="alr-meta">
              <span class="kn"><Icon name="book" :size="12" /> {{ a.knowledge }}</span>
              <span>실행 {{ a.runs.toLocaleString() }}</span>
            </div>
            <div class="alr-status">
              <button v-if="a.perm === 'owner'" class="toggle" :class="{ on: a.active }" @click="toggleActive(a)"
                :aria-label="`${a.name} ${a.active ? '비활성화' : '활성화'}`" :aria-pressed="a.active"></button>
              <button v-if="agentReady(a)" class="btn btn-primary btn-sm" :disabled="a.perm === 'owner' && !a.active" @click="openRun(a)">
                <Icon name="play" :size="13" /> 실행
              </button>
              <button v-else-if="agentPending(a)" class="btn btn-ghost btn-sm" disabled>
                <Icon name="clock" :size="12" /> 요청중
              </button>
              <button v-else class="btn btn-gray btn-sm" @click="openRequest('agent', a)">
                <Icon name="shield" :size="12" /> 권한 요청
              </button>
            </div>
            <button class="ax-folder alr-folder" @click="folderFor = a" :title="`폴더: ${a.folder} · 클릭하여 이동`">
              <Icon name="folder" :size="12" /><span class="axf-name">{{ a.folder }}</span>
            </button>
            <button class="fav-btn" :class="{ on: a.fav }" @click="toggleFavorite(a)"
              :aria-label="`${a.name} 즐겨찾기 ${a.fav ? '해제' : '추가'}`" :aria-pressed="a.fav" :title="a.fav ? '즐겨찾기 해제' : '즐겨찾기 추가'">
              <Icon name="star" :size="16" />
            </button>
            <button class="card-menu" @click="infoAgent = a" aria-label="Agent 정보 보기" title="Agent 정보"><Icon name="menu" :size="17" /></button>
          </div>
        </div>
      </section>
    </template>

    <div v-else class="card empty" style="margin-top:8px">
      <template v-if="tab === 'fav' && !q.trim()">
        <b>즐겨찾기한 Agent가 없습니다</b>카드의 별(★)을 눌러 즐겨찾기에 추가해 보세요.
      </template>
      <template v-else>
        <b>조건에 맞는 Agent가 없습니다</b>검색어·폴더·상태 필터를 조정해 보세요.
      </template>
    </div>

    <AgentInfoModal v-if="infoAgent" :agent="infoAgent" @close="infoAgent = null" />

    <!-- 폴더 이동 팝업 -->
    <FolderPickerModal v-if="folderFor" :agent="folderFor" @close="folderFor = null" />

    <!-- 공통 입력 팝업: 새 폴더 생성 -->
    <PromptDialog v-if="showNewFolder" title="새 폴더" label="폴더 이름" placeholder="예: 마케팅 봇" confirm-text="만들기"
      @confirm="onCreateFolder" @close="showNewFolder = false" />
  </div>
</template>
