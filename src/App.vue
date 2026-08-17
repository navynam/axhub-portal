<script setup>
import { computed, ref, watch } from 'vue'
import { store, go, setTheme } from './store.js'
import Icon from './components/Icon.vue'
import SettingsModal from './components/SettingsModal.vue'
import Home from './pages/Home.vue'
import Agents from './pages/Agents.vue'
import Knowledge from './pages/Knowledge.vue'
import Glossary from './pages/Glossary.vue'
import Permissions from './pages/Permissions.vue'
import Community from './pages/Community.vue'
import AgentRun from './pages/AgentRun.vue'
import AccessRequest from './pages/AccessRequest.vue'
import ToolManage from './pages/ToolManage.vue'
import DocManage from './pages/DocManage.vue'
import KnowledgeReg from './pages/KnowledgeReg.vue'
import GroupManage from './pages/GroupManage.vue'
import AgentOwners from './pages/AgentOwners.vue'
import KnowledgeOwners from './pages/KnowledgeOwners.vue'
import MyPage from './pages/MyPage.vue'
import RequestModal from './components/RequestModal.vue'
import DenyModal from './components/DenyModal.vue'
import HubRail from './components/HubRail.vue'

/* ── 라우팅 (간이) ── */
const pages = { home: Home, agents: Agents, tools: ToolManage, docs: DocManage, knreg: KnowledgeReg, knowledge: Knowledge, glossary: Glossary, perms: Permissions, community: Community, run: AgentRun, access: AccessRequest, groups: GroupManage, agentowners: AgentOwners, knowledgeowners: KnowledgeOwners, mypage: MyPage }
const boardIds = computed(() => store.boards.map(b => b.id))
const current = computed(() => (boardIds.value.includes(store.page) ? Community : pages[store.page] || Home))

/* ── 상단 헤더에 표시할 현재 화면 타이틀 ── */
const titleMap = { home: 'AX HUB', agents: '에이전트', tools: '도구', docs: '문서 관리', knreg: '지식 관리', knowledge: '지식 검색', glossary: '용어사전', perms: '요청함', access: '권한 신청', run: '에이전트', groups: '그룹 관리', agentowners: '에이전트 담당자 관리', knowledgeowners: '지식 담당자 관리', mypage: '마이페이지' }
const currentTitle = computed(() => {
  if (boardIds.value.includes(store.page)) return '커뮤니티'
  if (store.page === 'perms') return store.permsView === 'approve' ? '승인함' : '요청함'
  return titleMap[store.page] || 'AX HUB'
})

/* ── LNB 메뉴 (설계서 IA 기준) ── */
const nav = computed(() => {
  // 권한 관리 하위: 그룹/담당자 관리 + 요청함 / (관리자)승인함
  const authChildren = [
    { key: 'groups', label: '그룹 관리', page: 'groups' },
    { key: 'agentowners', label: '에이전트 담당자 관리', page: 'agentowners' },
    { key: 'knowledgeowners', label: '지식 담당자 관리', page: 'knowledgeowners' },
    { key: 'perms-mine', label: '요청함', page: 'perms', view: 'mine' },
    { key: 'perms-approve', label: '승인함', page: 'perms', view: 'approve' },
  ]

  const menu = [
    { key: 'home', label: '홈', ico: 'home' },
    { key: 'agents', label: '에이전트', ico: 'agent', also: ['run'] },
    { key: 'knowledge', label: '지식', ico: 'book', also: ['knowledge'] },
    { key: 'tools', label: '도구', ico: 'tool' },
    { key: 'glossary', label: '용어사전', ico: 'search' },
    { key: 'community', label: '커뮤니티', ico: 'chat', children: store.boards.map(b => ({ key: b.id, label: b.name, page: b.id })) },
    {
      key: 'manage', label: '문서/지식 관리', ico: 'layers', children: [
        { key: 'docs', label: '문서 관리', page: 'docs' },
        { key: 'knreg', label: '지식 관리', page: 'knreg' },
      ],
    },
    { key: 'authmgmt', label: '권한 관리', ico: 'users', children: authChildren },
  ]
  // 마이페이지: 사용 통계 대시보드 — 제일 아래 메뉴
  menu.push({ key: 'mypage', label: '마이페이지', ico: 'shield' })
  return menu
})

// 하위 메뉴 항목의 활성 여부
const childOn = (c) => {
  const page = c.page || c.key
  if (c.view) return store.page === page && store.permsView === c.view
  return store.page === page || (c.also || []).includes(store.page)
}
// 1Depth 메뉴 활성 여부
const isOn = (n) => {
  if (n.children) return n.children.some(childOn)
  return store.page === n.key || (n.also || []).includes(store.page)
}

/* ── 아코디언 (한 번에 하나만 펼침, 라운지는 처음부터 확장) ── */
const openParent = ref('community')
const isExpanded = (n) => openParent.value === n.key
const toggleParent = (n) => { openParent.value = openParent.value === n.key ? '' : n.key }

function openChild(c) {
  if (c.view) store.permsView = c.view
  go(c.page || c.key)
}
function openNav(n) {
  if (n.children) { openParent.value = n.key; openChild(n.children[0]); return } // 펼치며 첫 항목으로
  openParent.value = ''                                                          // 하위 없는 메뉴 → 아코디언 닫힘
  go(n.key)
}

/* ── 사이드바 접기 ── */
const navCollapsed = ref(false)

/* ── 설정 팝업 + 테마 적용 ── */
const showSettings = ref(false)
watch(() => store.theme, t => document.documentElement.setAttribute('data-theme', t), { immediate: true })

/* ── 라이트/다크 테마 토글 (LNB 하단) ── */
const isDark = computed(() => store.theme === 'dark')
</script>

<template>
  <div class="app" :class="{ 'nav-collapsed': navCollapsed }">
    <!-- 좌측 메뉴 (LNB) -->
    <aside class="sidebar">
      <!-- 상단: 패널 버튼 + AX Portal 로고 -->
      <div class="side-head">
        <button class="side-collapse" @click="navCollapsed = !navCollapsed"
          :aria-label="navCollapsed ? '메뉴 펼치기' : '메뉴 접기'" :title="navCollapsed ? '메뉴 펼치기' : '메뉴 접기'">
          <Icon name="panel" :size="18" />
        </button>
        <p class="side-logo"><span class="ax">AX</span> Portal</p>
      </div>

      <nav class="side-nav" aria-label="주 메뉴">
        <div class="nav-item" v-for="n in nav" :key="n.key">
          <button :class="{ on: isOn(n) }" @click="openNav(n)" :title="n.label"
            :aria-expanded="n.children ? isExpanded(n) : undefined">
            <span class="ico"><Icon :name="n.ico" :size="18" /></span>
            <span class="label">{{ n.label }}</span>
            <span class="grow"></span>
            <span v-if="n.children" class="caret" :class="{ open: isExpanded(n) }"
              role="button" tabindex="0" aria-label="펼치기/접기"
              @click.stop="toggleParent(n)" @keydown.enter.stop="toggleParent(n)">›</span>
          </button>
          <!-- 펼침: 아코디언 / 접힘: hover 플라이아웃 -->
          <div v-if="n.children && (navCollapsed || isExpanded(n))" class="side-sub">
            <div class="side-sub-title">{{ n.label }}</div>
            <button v-for="c in n.children" :key="c.key" :class="{ on: childOn(c) }" @click="openChild(c)">{{ c.label }}</button>
          </div>
        </div>
      </nav>

      <!-- 하단: 라이트/다크 테마 토글 -->
      <div class="side-theme" role="group" aria-label="테마 전환">
        <button :class="{ on: !isDark }" @click="setTheme('default')" title="라이트 모드"><Icon name="sun" :size="16" /><span>라이트</span></button>
        <button :class="{ on: isDark }" @click="setTheme('dark')" title="다크 모드"><Icon name="moon" :size="16" /><span>다크</span></button>
      </div>
    </aside>

    <!-- 우측 워크스페이스 -->
    <main class="content">
      <!-- 글로벌 헤더: 화면 타이틀 + 로그인 정보 -->
      <header class="app-header">
        <div class="app-title"><span class="app-ci">CI</span> {{ currentTitle }}</div>
        <div class="app-actions">
          <button class="hdr-btn" aria-label="알림"><Icon name="bell" :size="18" /><span class="hdr-dot"></span></button>
          <button class="hdr-btn" aria-label="설정" title="설정 · 테마" @click="showSettings = true"><Icon name="gear" :size="18" /></button>
          <button class="hdr-profile" aria-label="프로필">
            <span class="hdr-avatar">{{ store.user.name.slice(0, 1) }}</span>
            <span class="hdr-user"><b>{{ store.user.name }}</b><small>{{ store.user.dept }}</small></span>
          </button>
        </div>
      </header>

      <div class="content-scroll" :class="{ 'is-home': store.page === 'home', 'is-run': store.page === 'run', 'is-fill': store.knChatOpen }">
        <div class="content-inner">
          <component :is="current" />
        </div>
      </div>
    </main>

    <!-- 우측 허브 레일 (플로팅 버튼 대체) -->
    <HubRail />

    <RequestModal v-if="store.modal" />
    <DenyModal v-if="store.denyModal" />
    <SettingsModal v-if="showSettings" @close="showSettings = false" />

    <div class="toasts" aria-live="polite">
      <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.kind">{{ t.msg }}</div>
    </div>
  </div>
</template>
