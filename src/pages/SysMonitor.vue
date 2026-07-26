<script setup>
/**
 * 시스템 모니터링 — OCP 환경 Agent 관리 시스템 관제
 * -----------------------------------------------------------------------------
 * 토큰 사용량 · 트래픽 · 서비스 요청/수행시간 · LLM 모델 사용량 · CPU/GPU 모니터링.
 * (실서비스에서는 각 지표를 모니터링 API로 수집; 여기서는 데모 목데이터)
 */
import { computed, ref } from 'vue'
import Icon from '../components/Icon.vue'
import DetailModal from '../components/DetailModal.vue'

const nowLabel = '2026-07-16 14:33 KST'

const kpis = [
  { label: '토큰 사용량 (오늘)', value: '4.82', unit: 'M', delta: '+12% vs 어제', up: true, tone: 'info' },
  { label: '트래픽', value: '1,240', unit: 'req/min', delta: '+3% vs 1h', up: true, tone: 'info' },
  { label: '평균 수행 시간', value: '842', unit: 'ms', delta: '-46ms vs 1h', up: false, tone: 'good' },
  { label: '서비스 요청 (24h)', value: '128.4', unit: 'K', delta: '+8% vs 전일', up: true, tone: 'info' },
  { label: 'LLM 호출 (24h)', value: '32.1', unit: 'K', delta: '+15% vs 전일', up: true, tone: 'info' },
  { label: '오류율', value: '0.37', unit: '%', delta: '-0.05%p vs 1h', up: false, tone: 'good' },
]

// 24시간 라인 차트용
const tokenSeries = [1.1, 0.9, 0.7, 0.6, 0.8, 1.4, 2.1, 3.0, 3.6, 4.0, 4.3, 4.2, 4.5, 4.8, 5.0, 4.9, 4.6, 4.2, 3.8, 3.4, 3.0, 2.4, 1.8, 1.3]
const trafficSeries = [420, 380, 300, 260, 320, 620, 980, 1220, 1340, 1300, 1280, 1240, 1360, 1420, 1480, 1440, 1320, 1240, 1120, 980, 820, 660, 540, 460]
function linePath(vals, w, h) {
  const mn = Math.min(...vals), mx = Math.max(...vals), sp = mx - mn || 1
  const X = i => (i / (vals.length - 1)) * w
  const Y = v => h - ((v - mn) / sp) * (h - 6) - 3
  const pts = vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`)
  return { line: 'M' + pts.join(' L'), area: 'M' + pts.join(' L') + ` L${w},${h} L0,${h} Z` }
}
const tokenP = computed(() => linePath(tokenSeries, 520, 130))
const trafficP = computed(() => linePath(trafficSeries, 520, 130))

const llmModels = [
  { name: 'GPT-4o', pct: 42, calls: '13.5K', color: 'var(--navy)' },
  { name: 'Claude 3.5 Sonnet', pct: 31, calls: '9.9K', color: 'var(--navy-lt)' },
  { name: 'HCX-3 (HyperCLOVA)', pct: 18, calls: '5.8K', color: 'var(--green)' },
  { name: 'Llama-3 70B', pct: 9, calls: '2.9K', color: 'var(--accent)' },
]

const nodes = [
  { node: 'worker-gpu-01', cpu: 63, gpu: 78, mem: 71 },
  { node: 'worker-gpu-02', cpu: 58, gpu: 91, mem: 68 },
  { node: 'worker-cpu-01', cpu: 47, gpu: null, mem: 55 },
  { node: 'worker-cpu-02', cpu: 72, gpu: null, mem: 64 },
]
const barTone = v => (v >= 85 ? 'hot' : v >= 65 ? 'warm' : 'ok')

const services = [
  { name: 'agent-gateway', ns: 'axhub-prod', status: 'healthy', p95: '220ms', rps: 420, pods: '4/4' },
  { name: 'rag-retriever', ns: 'axhub-prod', status: 'healthy', p95: '310ms', rps: 180, pods: '3/3' },
  { name: 'llm-router', ns: 'axhub-prod', status: 'degraded', p95: '910ms', rps: 260, pods: '3/4' },
  { name: 'tool-executor', ns: 'axhub-prod', status: 'healthy', p95: '140ms', rps: 95, pods: '2/2' },
  { name: 'vector-db', ns: 'axhub-data', status: 'healthy', p95: '48ms', rps: 540, pods: '3/3' },
]
const svcCls = { healthy: 'pill-active', degraded: 'pill-pending', down: 'pill-denied' }
const svcLabel = { healthy: '정상', degraded: '주의', down: '중단' }

// 차트 타이틀 클릭 → 상세 리스트 팝업
const detail = ref(null)
const hh = i => `${String(i).padStart(2, '0')}:00`
const detailToken = () => (detail.value = { title: '토큰 사용량 추이', sub: '최근 24시간 (M tokens)', cols: ['시간', 'M tokens'], rows: tokenSeries.map((v, i) => [hh(i), v.toFixed(2)]) })
const detailTraffic = () => (detail.value = { title: '트래픽 · 서비스 요청', sub: '최근 24시간 (req/min)', cols: ['시간', 'req/min'], rows: trafficSeries.map((v, i) => [hh(i), v.toLocaleString()]) })
const detailLlm = () => (detail.value = { title: 'LLM 모델별 사용량', sub: '오늘 호출 비중', cols: ['모델', '비중', '호출'], rows: llmModels.map(m => [m.name, m.pct + '%', m.calls]) })
const detailNodes = () => (detail.value = { title: 'CPU · GPU 사용률', sub: '노드별 실시간', cols: ['노드', 'CPU', 'GPU', 'MEM'], rows: nodes.map(n => [n.node, n.cpu + '%', n.gpu !== null ? n.gpu + '%' : '—', n.mem + '%']) })
const detailServices = () => (detail.value = { title: 'Agent 서비스 상태', sub: 'OCP 워크로드 · 파드/응답', cols: ['서비스', '네임스페이스', '파드', 'p95', 'RPS', '상태'], rows: services.map(s => [s.name, s.ns, s.pods, s.p95, s.rps, svcLabel[s.status]]) })
</script>

<template>
  <div class="sm">
    <div class="sm-head">
      <div><div class="io-title">시스템 모니터링</div><div class="io-sub">OCP 운영 환경 · Agent 관리 시스템 · {{ nowLabel }}</div></div>
      <span class="sm-env"><span class="io-dot ok"></span> OCP prod · 정상</span>
    </div>

    <!-- KPI -->
    <div class="sm-kpis">
      <div v-for="k in kpis" :key="k.label" class="card sm-kpi">
        <div class="io-kpi-l">{{ k.label }}</div>
        <div class="io-kpi-v">{{ k.value }}<small>{{ k.unit }}</small></div>
        <div class="io-kpi-d" :class="k.up ? 'up' : 'down'">{{ k.delta }}</div>
      </div>
    </div>

    <!-- 차트 2열 -->
    <div class="sm-grid">
      <div class="card io-panel">
        <div class="io-panel-head"><div><button class="io-panel-title io-clk" @click="detailToken">토큰 사용량 추이 <Icon name="chevron" :size="13" class="io-clk-ic" /></button><div class="io-panel-sub">최근 24시간 (M tokens)</div></div></div>
        <div class="io-chart sm-chart">
          <svg viewBox="0 0 520 130" preserveAspectRatio="none" class="io-area">
            <defs><linearGradient id="smTok" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0046FF" stop-opacity=".18" /><stop offset="100%" stop-color="#0046FF" stop-opacity="0" /></linearGradient></defs>
            <path :d="tokenP.area" fill="url(#smTok)" /><path :d="tokenP.line" fill="none" stroke="#0046FF" stroke-width="2.4" />
          </svg>
        </div>
      </div>

      <div class="card io-panel">
        <div class="io-panel-head"><div><button class="io-panel-title io-clk" @click="detailLlm">LLM 모델별 사용량 <Icon name="chevron" :size="13" class="io-clk-ic" /></button><div class="io-panel-sub">오늘 호출 비중</div></div></div>
        <div class="sm-llm">
          <div v-for="m in llmModels" :key="m.name" class="sm-llm-row">
            <div class="sm-llm-name">{{ m.name }}</div>
            <div class="sm-llm-bar"><div class="sm-llm-fill" :style="{ width: m.pct + '%', background: m.color }"></div></div>
            <div class="sm-llm-val">{{ m.pct }}% · {{ m.calls }}</div>
          </div>
        </div>
      </div>

      <div class="card io-panel">
        <div class="io-panel-head"><div><button class="io-panel-title io-clk" @click="detailTraffic">트래픽 · 서비스 요청 <Icon name="chevron" :size="13" class="io-clk-ic" /></button><div class="io-panel-sub">최근 24시간 (req/min)</div></div></div>
        <div class="io-chart sm-chart">
          <svg viewBox="0 0 520 130" preserveAspectRatio="none" class="io-area">
            <defs><linearGradient id="smTraf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0E8A66" stop-opacity=".18" /><stop offset="100%" stop-color="#0E8A66" stop-opacity="0" /></linearGradient></defs>
            <path :d="trafficP.area" fill="url(#smTraf)" /><path :d="trafficP.line" fill="none" stroke="#0E8A66" stroke-width="2.4" />
          </svg>
        </div>
      </div>

      <div class="card io-panel">
        <div class="io-panel-head"><div><button class="io-panel-title io-clk" @click="detailNodes">CPU · GPU 사용률 <Icon name="chevron" :size="13" class="io-clk-ic" /></button><div class="io-panel-sub">노드별 실시간</div></div></div>
        <div class="sm-res">
          <div v-for="n in nodes" :key="n.node" class="sm-res-row">
            <div class="sm-res-node">{{ n.node }}</div>
            <div class="sm-res-bars">
              <div class="sm-res-line"><span class="sm-res-k">CPU</span><div class="sm-res-track"><div class="sm-res-fill" :class="barTone(n.cpu)" :style="{ width: n.cpu + '%' }"></div></div><span class="sm-res-v">{{ n.cpu }}%</span></div>
              <div class="sm-res-line"><span class="sm-res-k">GPU</span><div class="sm-res-track"><div v-if="n.gpu !== null" class="sm-res-fill" :class="barTone(n.gpu)" :style="{ width: n.gpu + '%' }"></div></div><span class="sm-res-v">{{ n.gpu !== null ? n.gpu + '%' : '—' }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 서비스 상태 -->
    <div class="card sm-svc">
      <div class="io-panel-head"><div><button class="io-panel-title io-clk" @click="detailServices">Agent 서비스 상태 <Icon name="chevron" :size="13" class="io-clk-ic" /></button><div class="io-panel-sub">OCP 워크로드 · 파드/응답</div></div></div>
      <div class="sm-svc-list">
        <div class="sm-svc-row sm-svc-h"><span>서비스</span><span>네임스페이스</span><span>파드</span><span>p95</span><span>RPS</span><span>상태</span></div>
        <div v-for="s in services" :key="s.name" class="sm-svc-row">
          <span class="sm-svc-name">{{ s.name }}</span>
          <span class="sm-svc-mut">{{ s.ns }}</span>
          <span>{{ s.pods }}</span>
          <span>{{ s.p95 }}</span>
          <span>{{ s.rps }}</span>
          <span><span class="pill pill-sm" :class="svcCls[s.status]">{{ svcLabel[s.status] }}</span></span>
        </div>
      </div>
    </div>

    <DetailModal v-if="detail" :detail="detail" @close="detail = null" />
  </div>
</template>
