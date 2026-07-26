<script setup>
import { computed, ref, watch } from 'vue'
import { store, go } from './store.js'
import Icon from './components/Icon.vue'
import SettingsModal from './components/SettingsModal.vue'
import Home from './pages/Home.vue'
import Agents from './pages/Agents.vue'
import Knowledge from './pages/Knowledge.vue'
import Permissions from './pages/Permissions.vue'
import Community from './pages/Community.vue'
import AgentRun from './pages/AgentRun.vue'
import AccessRequest from './pages/AccessRequest.vue'
import SysMonitor from './pages/SysMonitor.vue'
import ItOps from './pages/ItOps.vue'
import ComputerUse from './pages/ComputerUse.vue'
import DailyReport from './pages/DailyReport.vue'
import ToolManage from './pages/ToolManage.vue'
import RequestModal from './components/RequestModal.vue'
import DenyModal from './components/DenyModal.vue'
import AgentFab from './components/AgentFab.vue'

/* ── 라우팅 (간이) ── */
const pages = { home: Home, agents: Agents, tools: ToolManage, knowledge: Knowledge, perms: Permissions, community: Community, run: AgentRun, access: AccessRequest, sysmon: SysMonitor, itops: ItOps, computeruse: ComputerUse, daily: DailyReport }
const boardIds = computed(() => store.boards.map(b => b.id))
const current = computed(() => (boardIds.value.includes(store.page) ? Community : pages[store.page] || Home))

/* ── 상단 헤더에 표시할 현재 화면 타이틀 ── */
const titleMap = { home: 'AX HUB', agents: '에이전트', tools: '툴 관리', knowledge: '지식관리', perms: '마이페이지', access: '권한 신청', run: '에이전트', sysmon: '시스템 모니터링', itops: 'IT 운영 관리', computeruse: '현황 전파', daily: '일일점검 보고서' }
const currentTitle = computed(() => (boardIds.value.includes(store.page) ? '라운지' : titleMap[store.page] || 'AX HUB'))

/* ── LNB 메뉴 (설계서 IA 기준) ── */
const nav = computed(() => {
  // 마이페이지 하위: 내 요청함 / (관리자)승인함 / 권한 신청
  const mypage = [{ key: 'perms-mine', label: '내 요청함', page: 'perms', view: 'mine' }]
  if (store.role === 'admin') mypage.push({ key: 'perms-approve', label: '승인함', page: 'perms', view: 'approve' })

  const menu = [
    { key: 'home', label: '홈', ico: 'home' },
    {
      key: 'agents', label: '에이전트', ico: 'bot', children: [
        { key: 'agents-cat', label: '에이전트 카탈로그', page: 'agents', also: ['run'] },
        { key: 'tools', label: '툴 관리', page: 'tools' },
      ],
    },
    { key: 'knowledge', label: '지식관리', ico: 'book' },
    { key: 'community', label: '라운지', ico: 'chat', children: store.boards.map(b => ({ key: b.id, label: b.name, page: b.id })) },
    { key: 'mypage', label: '마이페이지', ico: 'users', children: mypage },
  ]
  // 관리자 전용: 시스템 관리 (시스템 모니터링 / IT 운영 관리)
  if (store.role === 'admin') {
    menu.push({
      key: 'system', label: '시스템 관리', ico: 'gear', children: [
        { key: 'sysmon', label: '시스템 모니터링', page: 'sysmon' },
        { key: 'itops', label: 'IT 운영 관리', page: 'itops' },
        { key: 'computeruse', label: '현황 전파', page: 'computeruse' },
        { key: 'daily', label: '일일점검 보고서', page: 'daily' },
      ],
    })
  }
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

/* ── 사이드바 추천 자료 (빈 공간 채우기 · 접으면 아이콘화) ── */
const recos = [
  { ico: 'book', title: 'AX 활용 가이드', desc: '에이전트 시작하기', to: 'community' },
  { ico: 'star', title: '이달의 추천 Agent', desc: '규정·컴플라이언스', to: 'agents' },
  { ico: 'shield', title: '권한 신청 방법', desc: '도구·지식 권한 안내', to: 'access' },
  { ico: 'chat', title: '자주 묻는 질문', desc: 'FAQ · 문의 게시판', to: 'community' },
]
</script>

<template>
  <div class="app" :class="{ 'nav-collapsed': navCollapsed }">
    <!-- 좌측 메뉴 (LNB) -->
    <aside class="sidebar">
      <!-- 상단: 신한라이프 로고 + 접기 버튼 -->
      <div class="side-head">
        <div class="side-logo"><span class="sh">S</span><span class="side-logo-txt">신한<b>라이프</b></span></div>
        <button class="side-collapse" @click="navCollapsed = !navCollapsed"
          :aria-label="navCollapsed ? '메뉴 펼치기' : '메뉴 접기'" :title="navCollapsed ? '메뉴 펼치기' : '메뉴 접기'">
          <Icon :name="navCollapsed ? 'expand' : 'collapse'" :size="18" />
        </button>
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

      <!-- 추천 자료 (접으면 아이콘만) -->
      <div class="side-reco">
        <div class="side-reco-title">추천 자료</div>
        <button v-for="r in recos" :key="r.title" class="reco-item" @click="go(r.to)" :title="r.title">
          <span class="reco-ic"><Icon :name="r.ico" :size="16" /></span>
          <span class="reco-body"><b>{{ r.title }}</b><small>{{ r.desc }}</small></span>
        </button>
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
          <div class="hdr-role" role="group" aria-label="역할 전환 (데모)">
            <button :class="{ on: store.role === 'user' }" @click="store.role = 'user'">사용자</button>
            <button :class="{ on: store.role === 'admin' }" @click="store.role = 'admin'">관리자</button>
          </div>
          <button class="hdr-profile" aria-label="프로필">
            <span class="hdr-avatar">{{ store.user.name.slice(0, 1) }}</span>
            <span class="hdr-user"><b>{{ store.user.name }}</b><small>{{ store.user.dept }}</small></span>
          </button>
        </div>
      </header>

      <div class="content-scroll">
        <div class="content-inner">
          <component :is="current" />
        </div>
      </div>
    </main>

    <AgentFab v-if="!['sysmon', 'itops', 'computeruse', 'daily'].includes(store.page)" />

    <RequestModal v-if="store.modal" />
    <DenyModal v-if="store.denyModal" />
    <SettingsModal v-if="showSettings" @close="showSettings = false" />

    <div class="toasts" aria-live="polite">
      <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.kind">{{ t.msg }}</div>
    </div>
  </div>
</template>
