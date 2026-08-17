<script setup>
/**
 * 우측 허브 레일 — 화면 우측 고정 사이드바 · [담당: 개발자 E · 공통]
 * -----------------------------------------------------------------------------
 * 기존 플로팅 생성 버튼(AgentFab)을 대체. 로그인 역할·내 현황 스탯·자주 찾는 메뉴·
 * 하단 바로가기(챗봇/용어사전/가이드)를 담는다. 접기/펼치기 가능.
 * 생성(에이전트 빌더)·챗봇 팝업(BuilderModal/ChatbotModal)은 여기서 연다.
 */
import { ref, computed } from 'vue'
import { store, go, toast } from '../store.js'
import Icon from './Icon.vue'
import BuilderModal from './BuilderModal.vue'
import ChatbotModal from './ChatbotModal.vue'

const collapsed = ref(false)
const builder = ref(null)   // { title, url, ico, tone } | null
const chatbot = ref(false)

const roleLabel = computed(() => (store.role === 'admin' ? '관리자' : '일반사용자'))

// 내 현황 스탯 (실데이터에서 집계). hot=강조 색, sep=위 구분선
const mine = p => p === 'granted' || p === 'owner'
const stats = computed(() => [
  { label: '나의 에이전트', value: store.agents.filter(a => mine(a.perm)).length, to: 'agents' },
  { label: '사용가능 지식', value: store.knowledge.filter(k => mine(k.perm)).length, sub: true, to: 'knowledge' },
  { label: '사용가능 도구', value: Object.values(store.resources).filter(r => mine(r.perm)).length, sub: true, to: 'tools' },
  { label: '나의 지식요청', value: store.requests.filter(r => r.mine && r.targetType === 'knowledge').length, sep: true, to: 'perms' },
  { label: '권한요청중', value: store.requests.filter(r => r.mine && r.status === 'pending').length, to: 'perms' },
])

function openBuilder() { builder.value = { title: 'Agent 빌더', url: 'https://deepagent-builder.ai/app', ico: 'bot', tone: 'blue' } }
const quick = [
  { label: '에이전트 생성', act: openBuilder },
  { label: '권한신청 목록', act: () => go('perms') },
  { label: '나의 에이전트', act: () => go('agents') },
]
// Quick Link (시안: 하단 섹션) — 헬프데스크 챗봇 · 용어사전 · 가이드
const quicklink = [
  { label: 'AX Portal 헬프데스크', ico: 'chat', act: () => { chatbot.value = true } },
  { label: '용어사전', ico: 'book', act: () => go('glossary') },
  { label: '가이드 다운로드', ico: 'download', act: () => toast('활용 가이드를 다운로드합니다. (데모)') },
]
</script>

<template>
  <aside class="hub-rail" :class="{ collapsed }">
    <!-- 접힘: 얇은 스트립 + 펼치기 버튼 -->
    <button v-if="collapsed" class="hub-expand" @click="collapsed = false" title="메뉴 펼치기" aria-label="메뉴 펼치기">
      <Icon name="expand" :size="18" />
    </button>

    <template v-else>
      <div class="hub-head">
        <span class="hub-role"><Icon name="user" :size="16" /> {{ roleLabel }}</span>
        <button class="hub-collapse" @click="collapsed = true" title="메뉴 접기" aria-label="메뉴 접기"><Icon name="collapse" :size="16" /></button>
      </div>

      <!-- 내 현황 -->
      <div class="hub-stats">
        <button v-for="s in stats" :key="s.label" class="hub-stat" :class="{ sep: s.sep, sub: s.sub }" @click="go(s.to)">
          <span class="hs-label">{{ s.label }}</span>
          <span class="hs-value">{{ s.value }}</span>
        </button>
      </div>

      <!-- 자주 찾는 메뉴 -->
      <div class="hub-quick">
        <div class="hub-sec-title">자주 찾는 메뉴</div>
        <button v-for="m in quick" :key="m.label" class="hub-quick-item" @click="m.act()"><Icon name="star" :size="13" />{{ m.label }}</button>
      </div>

      <!-- Quick Link (사이드바 하단 고정) -->
      <div class="hub-bottom">
        <div class="hub-sec-title">Quick Link</div>
        <button v-for="l in quicklink" :key="l.label" class="hub-link-item" @click="l.act()">{{ l.label }}</button>
      </div>
    </template>
  </aside>

  <BuilderModal v-if="builder" :title="builder.title" :url="builder.url" :ico="builder.ico" :tone="builder.tone" @close="builder = null" />
  <ChatbotModal v-if="chatbot" @close="chatbot = false" />
</template>
