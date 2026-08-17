<script setup>
/**
 * 마이페이지 — 내 사용 통계 대시보드.
 *  ① 내가 사용하는 에이전트의 사용율(실행 횟수 기준)
 *  ② 내가 사용하는 지식의 사용율(문서 활용 기준)
 */
import { computed } from 'vue'
import { store } from '../store.js'
import Icon from '../components/Icon.vue'

const isMine = x => x.perm === 'owner' || x.perm === 'granted'

// ① 에이전트 사용율 (실행 횟수)
const agentRows = computed(() => {
  const used = store.agents.filter(isMine)
  const total = used.reduce((n, a) => n + (a.runs || 0), 0) || 1
  const max = Math.max(1, ...used.map(a => a.runs || 0))
  return used.map(a => ({ id: a.id, name: a.name, owner: a.owner, runs: a.runs || 0, pct: Math.round((a.runs || 0) / total * 100), bar: Math.round((a.runs || 0) / max * 100) }))
    .sort((x, y) => y.runs - x.runs)
})
const agentTotal = computed(() => agentRows.value.reduce((n, a) => n + a.runs, 0))

// ② 지식 사용율 (문서 활용)
const knRows = computed(() => {
  const used = store.knowledge.filter(isMine)
  const total = used.reduce((n, k) => n + (k.docs || 0), 0) || 1
  const max = Math.max(1, ...used.map(k => k.docs || 0))
  return used.map(k => ({ id: k.id, name: k.name, owner: k.owner, docs: k.docs || 0, linked: k.linked || 0, pct: Math.round((k.docs || 0) / total * 100), bar: Math.round((k.docs || 0) / max * 100) }))
    .sort((x, y) => y.docs - x.docs)
})
const knTotal = computed(() => knRows.value.reduce((n, k) => n + k.docs, 0))
</script>

<template>
  <div>
    <p class="mp-lead"><b>{{ store.user.name }}</b>님의 사용 현황입니다. 내가 사용하는 에이전트와 지식의 사용율을 확인하세요.</p>

    <div class="mp-grid">
      <!-- ① 에이전트 사용율 -->
      <section class="card mp-card">
        <div class="mp-head">
          <div class="mp-title"><span class="mp-ic navy"><Icon name="agent" :size="16" /></span> 에이전트 사용율</div>
          <div class="mp-kpi"><b>{{ agentRows.length }}</b>개 사용 · 총 실행 <b>{{ agentTotal.toLocaleString() }}</b>회</div>
        </div>
        <div v-if="agentRows.length" class="mp-bars">
          <div v-for="a in agentRows" :key="a.id" class="mp-row">
            <div class="mp-row-top"><span class="mp-name">{{ a.name }}</span><span class="mp-val">{{ a.runs.toLocaleString() }}회 · {{ a.pct }}%</span></div>
            <div class="mp-track"><div class="mp-fill navy" :style="{ width: a.bar + '%' }"></div></div>
            <div class="mp-sub">{{ a.owner }}</div>
          </div>
        </div>
        <div v-else class="mp-empty">사용 중인 에이전트가 없습니다.</div>
      </section>

      <!-- ② 지식 사용율 -->
      <section class="card mp-card">
        <div class="mp-head">
          <div class="mp-title"><span class="mp-ic green"><Icon name="book" :size="16" /></span> 지식 사용율</div>
          <div class="mp-kpi"><b>{{ knRows.length }}</b>개 사용 · 총 문서 <b>{{ knTotal.toLocaleString() }}</b>건</div>
        </div>
        <div v-if="knRows.length" class="mp-bars">
          <div v-for="k in knRows" :key="k.id" class="mp-row">
            <div class="mp-row-top"><span class="mp-name">{{ k.name }}</span><span class="mp-val">{{ k.docs.toLocaleString() }}건 · {{ k.pct }}%</span></div>
            <div class="mp-track"><div class="mp-fill green" :style="{ width: k.bar + '%' }"></div></div>
            <div class="mp-sub">{{ k.owner }} · 연결 Agent {{ k.linked }}</div>
          </div>
        </div>
        <div v-else class="mp-empty">사용 중인 지식이 없습니다.</div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.mp-lead { font-size: 13px; color: var(--gray); line-height: 1.55; margin: 4px 0 18px; }
.mp-lead b { color: var(--ink); font-weight: 750; }

.mp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.mp-card { padding: 18px 20px; }
.mp-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 14px; margin-bottom: 6px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
.mp-title { display: flex; align-items: center; gap: 9px; font-size: 15px; font-weight: 800; color: var(--ink); }
.mp-ic { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; }
.mp-ic.navy { background: var(--navy-soft); color: var(--navy); }
.mp-ic.green { background: #E3F3EC; color: var(--green); }
.mp-kpi { font-size: 12px; color: var(--gray); }
.mp-kpi b { color: var(--ink); font-weight: 800; }

.mp-bars { display: flex; flex-direction: column; gap: 14px; padding-top: 10px; }
.mp-row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 5px; }
.mp-name { font-size: 13px; font-weight: 700; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mp-val { font-size: 11.5px; font-weight: 700; color: var(--gray); flex-shrink: 0; }
.mp-track { height: 9px; border-radius: 6px; background: var(--canvas); overflow: hidden; }
.mp-fill { height: 100%; border-radius: 6px; transition: width .4s ease; }
.mp-fill.navy { background: linear-gradient(90deg, #3b74ff, var(--navy)); }
.mp-fill.green { background: linear-gradient(90deg, #34b98a, var(--green)); }
.mp-sub { font-size: 11px; color: var(--gray-lt); margin-top: 4px; }
.mp-empty { font-size: 13px; color: var(--gray-lt); text-align: center; padding: 30px 0; }

@media (max-width: 800px) { .mp-grid { grid-template-columns: 1fr; } }
</style>
