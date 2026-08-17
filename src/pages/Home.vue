<script setup>
/**
 * 홈(메인) — 기획 ax-portal-main-prototype 디자인 반영.
 * -----------------------------------------------------------------------------
 * 히어로(카피 + 물어보기 박스) + 에이전트 카드 캐러셀 4종(최근/Favorite/New/전사인기).
 * 데이터·동작은 우리 스토어 기준(실제 에이전트, 실행/권한요청).
 */
import { ref, computed } from 'vue'
import { store, go, openRun, agentReady, resourcePerm, openRequest, toast } from '../store.js'
import Icon from '../components/Icon.vue'
import AgentCarousel from '../components/AgentCarousel.vue'

const isRunnable = a => agentReady(a) && (a.perm !== 'owner' || a.active)
const toItems = list => list.map(a => ({ name: a.name, locked: !isRunnable(a), agent: a }))

// 실제 에이전트에서 4개 그룹 파생
const recent = computed(() => toItems(store.agents.filter(a => a.perm === 'owner' || a.perm === 'granted').slice(0, 10)))
const favorite = computed(() => toItems(store.agents.filter(a => a.fav)))
const newest = computed(() => toItems(store.agents.slice().sort((a, b) => (b.updated || '').localeCompare(a.updated || '')).slice(0, 10)))
const popular = computed(() => toItems(store.agents.slice().sort((a, b) => b.runs - a.runs).slice(0, 10)))

function cardClick(it) {
  if (it.locked) openRequest('agent', it.agent)
  else openRun(it.agent)
}

// 물어보기 박스 → 에이전트 카탈로그로 안내(데모)
const ask = ref('')
function submitAsk() {
  const t = ask.value.trim()
  if (!t) return
  toast(`‘${t.slice(0, 20)}${t.length > 20 ? '…' : ''}’ 관련 에이전트를 찾아드릴게요.`, 'ok')
  ask.value = ''
  go('agents')
}
</script>

<template>
  <div class="home2">
    <!-- HERO -->
    <section class="hero2">
      <div class="hero2-copy">
        <h1>당신의 모든 업무에, AI의 지능을 더해보세요</h1>
        <p>원하는 업무를 에이전트에게 설명하면 AI가 답변해 드릴게요</p>
      </div>
      <div class="ask2">
        <textarea v-model="ask" placeholder="궁금한 것을 물어보세요." rows="2" @keydown.enter.exact.prevent="submitAsk"></textarea>
        <div class="ask2-actions">
          <button class="ask2-attach"><Icon name="attach" :size="18" /> 파일첨부</button>
          <button class="ask2-send" :disabled="!ask.trim()" @click="submitAsk" title="전송"><Icon name="arrowup" :size="18" /></button>
        </div>
      </div>
    </section>

    <!-- 카드 섹션 -->
    <div class="home2-sections">
      <div class="home2-col">
        <section class="home2-sec">
          <div class="home2-sec-title"><p>최근사용 에이전트</p><button @click="go('agents')" aria-label="전체 보기"><Icon name="plus" :size="18" /></button></div>
          <AgentCarousel :items="recent" @select="cardClick" />
        </section>
        <section class="home2-sec">
          <div class="home2-sec-title"><p>Favorite 에이전트</p><button @click="go('agents')" aria-label="전체 보기"><Icon name="plus" :size="18" /></button></div>
          <AgentCarousel :items="favorite" @select="cardClick" />
        </section>
      </div>
      <div class="home2-col">
        <section class="home2-sec">
          <div class="home2-sec-title"><p>New 에이전트</p><button @click="go('agents')" aria-label="전체 보기"><Icon name="plus" :size="18" /></button></div>
          <AgentCarousel :items="newest" plain @select="cardClick" />
        </section>
        <section class="home2-sec">
          <div class="home2-sec-title"><p>전사 인기 에이전트</p><button @click="go('agents')" aria-label="전체 보기"><Icon name="plus" :size="18" /></button></div>
          <AgentCarousel :items="popular" plain @select="cardClick" />
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home2 {
  --brand:#1a4bf5; --ink:#22252b; --sub:#889099; --n4:#dedfe2; --n2:#afb3b9;
  font-family:"Pretendard","Pretendard Variable",-apple-system,"Apple SD Gothic Neo","Malgun Gothic","Segoe UI",system-ui,sans-serif;
  letter-spacing:-.02em; color:var(--ink);
  position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
}
:root[data-theme="dark"] .home2 { --brand:#5B87FF; --ink:#eaedf2; --sub:#7f8a99; --n4:#2a313c; --n2:#5a626e; }
/* 홈 전체에 깔리는 은은한 앰비언트 글로우 (히어로↔카드 이음새 없이 하나로) */
.home2::before {
  content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: .7;
  background:
    radial-gradient(520px 300px at 32% 30%, rgba(114,146,232,.24), rgba(114,146,232,0) 70%),
    radial-gradient(460px 260px at 66% 34%, rgba(157,120,240,.16), rgba(157,120,240,0) 70%),
    radial-gradient(70% 42% at 50% 44%, rgba(96,140,255,.11), rgba(96,140,255,0) 68%);
}
.home2 > * { position: relative; z-index: 1; }
:root[data-theme="dark"] .home2::before { opacity: .5; }

/* HERO */
.hero2 { flex: 1; min-height: 200px; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: clamp(20px, 3vh, 44px); }
.hero2-copy { position: relative; text-align: center; display: flex; flex-direction: column; gap: 12px; }
.hero2-copy h1 { font-size: clamp(22px, 3vw, 32px); font-weight: 600; line-height: 1.3; }
.hero2-copy p { font-size: clamp(15px, 1.6vw, 20px); font-weight: 300; color: var(--sub); }

.ask2 { position: relative; width: min(729px, 92%); min-height: 120px; padding: 20px 24px;
  background: var(--surface-2, #fff); border: 1px solid rgba(109,158,255,.8); border-radius: 20px;
  box-shadow: 0 2px 12px rgba(36,133,255,.10); display: flex; flex-direction: column; justify-content: space-between; gap: 12px;
  transition: border-color .2s, box-shadow .2s; }
:root[data-theme="dark"] .ask2 { background: #171c24; border-color: rgba(91,135,255,.55); }
.ask2:focus-within { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(26,75,245,.10); }
.ask2 textarea { border: 0; outline: 0; resize: none; background: transparent; font: inherit; font-size: 16px; line-height: 1.5; color: var(--ink); min-height: 44px; }
.ask2 textarea::placeholder { color: var(--n2); }
.ask2-actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.ask2-attach { display: flex; align-items: center; gap: 4px; padding: 5px 12px; border: 1px solid var(--n4); border-radius: 100px; font: inherit; font-size: 13px; color: var(--sub); cursor: pointer; }
.ask2-send { width: 34px; height: 34px; border-radius: 100px; background: var(--brand); color: #fff; display: grid; place-items: center; cursor: pointer; transition: transform .15s, background .15s; }
.ask2-send:hover:not(:disabled) { background: #2650d6; transform: scale(1.08); }
.ask2-send:disabled { opacity: .5; cursor: not-allowed; }

/* 카드 섹션 (고정 높이 — 스크롤 없이 하단 정렬) */
.home2-sections { flex-shrink: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding: 8px 0 4px; }
.home2-col { display: flex; flex-direction: column; gap: clamp(20px, 3vh, 36px); min-width: 0; }
.home2-sec { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.home2-sec-title { display: flex; align-items: center; gap: 10px; padding: 0 8px; }
.home2-sec-title p { flex: 1; font-size: 16px; font-weight: 700; }
.home2-sec-title button { color: var(--sub); background: transparent; border: 0; cursor: pointer; display: grid; place-items: center; }
.home2-sec-title button:hover { color: var(--brand); }

@media (max-width: 1100px) { .home2-sections { grid-template-columns: 1fr; } }
</style>
