<script setup>
/**
 * IT 운영 관리 — AIOps 관제 콘솔 (실시간 로그분석 중심)
 * -----------------------------------------------------------------------------
 * 대시보드 + 시그널 피드 + 분석 챗.
 *  · 대시보드: 접기 없음(폭만 조절). 피드/챗을 접으면 대시보드 헤더 버튼으로 다시 펼침.
 *  · 분석 챗: 상단 아이콘 토글로 실시간 로그분석/트러블슈팅/매뉴얼 검색 전환(대화형 3종).
 * (현황 전파·일일점검 보고서는 시스템 관리 하위 별도 메뉴)
 */
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { toast } from '../store.js'
import Icon from '../components/Icon.vue'
import DetailModal from '../components/DetailModal.vue'

const nowLabel = '2026-07-16 14:33 KST'

/* ── 시그널 피드/분석 챗 접기 (대시보드는 접기 없음) ── */
const openFeed = ref(true)
const openChat = ref(true)

/* ── 스플릿 리사이즈 ── */
const itopsEl = ref(null)
const feedW = ref(316)
const chatW = ref(360)
const dragging = ref(false)
let drag = null
function startDrag(which, e) {
  drag = { which, startX: e.clientX, startFeed: feedW.value, startChat: chatW.value }
  dragging.value = true
  window.addEventListener('pointermove', onDrag)
  window.addEventListener('pointerup', endDrag)
  e.preventDefault()
}
function onDrag(e) {
  if (!drag) return
  const dx = e.clientX - drag.startX
  const avail = itopsEl.value ? itopsEl.value.clientWidth : 1280
  const fw = openFeed.value ? feedW.value : 0
  const cw = openChat.value ? chatW.value : 0
  if (drag.which === 1) feedW.value = Math.round(Math.max(220, Math.min(drag.startFeed - dx, avail - cw - 380)))
  else chatW.value = Math.round(Math.max(260, Math.min(drag.startChat - dx, avail - fw - 380)))
}
function endDrag() {
  drag = null; dragging.value = false
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', endDrag)
}
onBeforeUnmount(endDrag)

/* ── KPI / 위험도 ── */
const risk = 72
const kpis = [
  { label: '사전탐지 건수 (24h)', value: '37', unit: '건', delta: '+6 vs 전주', up: true, spark: [8, 12, 9, 14, 18, 15, 22, 20, 26, 24, 31, 37], tone: 'info' },
  { label: 'MTTD 평균 탐지시간', value: '4.2', unit: '분', delta: '-1.3분 vs 전주', up: false, spark: [9, 8.4, 7.8, 7, 6.4, 6, 5.4, 5.1, 4.8, 4.5, 4.3, 4.2], tone: 'good' },
  { label: 'MTTR 평균 복구시간', value: '18.6', unit: '분', delta: '-2.1분 vs 전주', up: false, spark: [26, 25, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18.8, 18.6], tone: 'good' },
  { label: '모델 예측 정확도 (7d)', value: '94.2', unit: '%', delta: '+0.8%p vs 전주', up: true, spark: [90, 90.5, 91, 91.4, 92, 92.4, 92.8, 93.2, 93.6, 93.9, 94.1, 94.2], tone: 'good' },
]
const timeline = [22, 28, 34, 45, 58, 70, 80, 85, 82, 70, 56, 46, 40]
const threshold = 70
function linePath(vals, w, h, max = 100) {
  const n = vals.length
  const X = i => (i / (n - 1)) * w
  const Y = v => h - (v / max) * h
  const pts = vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`)
  return { line: 'M' + pts.join(' L'), area: 'M' + pts.join(' L') + ` L${w},${h} L0,${h} Z`, ptsArr: vals.map((v, i) => ({ x: X(i), y: Y(v), v })) }
}
const TL = computed(() => linePath(timeline, 640, 150, 100))
const thY = computed(() => 150 - (threshold / 100) * 150)
const trend = [
  { d: '월', c: 6, w: 11, i: 8 }, { d: '화', c: 4, w: 8, i: 6 }, { d: '수', c: 7, w: 14, i: 10 },
  { d: '목', c: 5, w: 10, i: 9 }, { d: '금', c: 12, w: 15, i: 10 }, { d: '토', c: 2, w: 5, i: 4 }, { d: '일', c: 4, w: 8, i: 6 },
]
const trendMax = 40

/* ── 분포 (시스템별 / 유형별) + 상세 팝업 ── */
const systemDist = [
  { name: '결제 게이트웨이', count: 24 }, { name: '인증 서비스', count: 18 }, { name: '코어뱅킹 DB', count: 14 },
  { name: 'API 게이트웨이', count: 11 }, { name: '메시지 브로커', count: 9 }, { name: '배치 스케줄러', count: 6 },
]
const typeDist = [
  { name: '응답지연(p99)', count: 21 }, { name: '커넥션/풀 고갈', count: 17 }, { name: '복제 지연', count: 12 },
  { name: '토큰 발급 실패', count: 10 }, { name: '큐 적체', count: 8 }, { name: '컨슈머 랙', count: 6 },
]
const sysMax = computed(() => Math.max(...systemDist.map(d => d.count)))
const typMax = computed(() => Math.max(...typeDist.map(d => d.count)))

const detail = ref(null)
// 분포 항목 클릭 → 시그널형 상세
function openDetail(cat, item) {
  const templates = cat === 'system'
    ? ['이상 징후 감지 · 자동 분석 착수', '임계 근접 경보', '조치 권고 생성', '자동 스케일/재기동', '해소 확인']
    : ['패턴 반복 감지', '임계값 초과', '연관 시그널 동반 발생', '조치 권고 생성', '해소']
  const sevOrder = ['critical', 'warning', 'warning', 'info', 'info']
  const n = Math.min(item.count, 8)
  const events = []
  for (let i = 0; i < n; i++) {
    const hh = Math.max(6, 14 - Math.floor(i * 1.4))
    const mm = (52 - i * 8 + 120) % 60
    events.push({ time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, sev: sevOrder[i % sevOrder.length], text: `${item.name} · ${templates[i % templates.length]}` })
  }
  detail.value = { title: item.name, sub: `${cat === 'system' ? '시스템' : '유형'}별 상세 · 총 ${item.count}건 (최근 ${n}건)`, events }
}
// 차트/패널 타이틀 클릭 → 표형 상세
function openRiskDetail() {
  detail.value = {
    title: '현재 장애 위험도 · 72 (HIGH)', sub: 'GC·장애예측 모델 기여 요인 (실시간)',
    cols: ['기여 요인', '영향도', '추세'],
    rows: [['결제 게이트웨이 p99 급등', '높음', '↑ 급상승'], ['커넥션 풀 사용률', '높음', '↑ 상승'], ['코어뱅킹 DB 복제 지연', '중간', '↑ 상승'], ['인증 토큰 실패율', '중간', '→ 완만'], ['GC pause 빈도', '낮음', '→ 안정'], ['노드 리소스 여유', '낮음', '↓ 감소']],
  }
}
function openTimelineDetail() {
  detail.value = {
    title: '위험 예측 타임라인', sub: '향후 12시간 · 구간별 장애 발생 확률(예측)',
    cols: ['구간', '확률', '상태'],
    rows: timeline.map((v, i) => [`+${i}h`, `${v}%`, v >= threshold ? '임계 초과' : v >= 50 ? '주의' : '정상']),
  }
}
function openTrendDetail() {
  detail.value = {
    title: '이상 시그널 추이', sub: '최근 7일 · 심각도별 발생 건수',
    cols: ['요일', 'Critical', 'Warning', 'Info', '합계'],
    rows: trend.map(t => [t.d, t.c, t.w, t.i, t.c + t.w + t.i]),
  }
}
function openKpiDetail(k) {
  detail.value = {
    title: k.label, sub: `${k.value}${k.unit} · ${k.delta}`,
    cols: ['시점', '값'],
    rows: k.spark.map((v, i) => [`${(k.spark.length - 1 - i) * 2}h 전`, `${v}${k.unit}`]).reverse(),
  }
}

/* ── 실시간 시그널 피드 ── */
const feed = [
  { lv: 'critical', sys: '결제 게이트웨이', msg: 'p99 latency 급등 · 커넥션 풀 고갈 패턴 감지', metric: '응답지연 p99 · 14:32:07', prob: 91, ago: '방금' },
  { lv: 'warning', sys: '인증 서비스', msg: 'OIDC 토큰 발급 실패율 완만한 상승 추세', metric: '토큰 발급 실패율 · 14:19:44', prob: 63, ago: '13분 전' },
  { lv: 'warning', sys: '코어뱅킹 DB', msg: '스탠바이 복제 지연 임계 근접(4.8s)', metric: '복제 지연 · 13:58:12', prob: 58, ago: '34분 전' },
  { lv: 'info', sys: '배치 스케줄러', msg: '야간 정산 배치 큐 소폭 적체 · 자동 스케일 대응', metric: '작업 큐 적체 · 13:40:03', prob: 31, ago: '52분 전' },
  { lv: 'info', sys: 'API 게이트웨이', msg: '특정 클라이언트 4xx 증가 · 영향도 낮음', metric: '4xx 비율 · 13:22:51', prob: 24, ago: '69분 전' },
  { lv: 'critical', sys: '메시지 브로커', msg: 'Kafka consumer lag 급증 후 자동 복구됨(해소)', metric: '컨슈머 랙 · 12:55:18', prob: 78, ago: '97분 전' },
]
const lvLabel = { critical: 'CRITICAL', warning: 'WARNING', info: 'INFO' }
let ticketSeq = 20361
function makeTicket(f) { toast(`ITSM 티켓 생성: INC-${ticketSeq++} · ${f.sys} 이상 감지`, 'ok') }
function recommend(f) { toast(`'${f.sys}' 조치 권고를 생성해 운영자에게 공유했습니다.`, 'info') }

/* ── 분석 챗 (대화형 3종 · 아이콘 토글) ── */
const chatModes = [
  { key: 'realtime', label: '실시간 로그 분석', tag: 'Spark SQL', ico: 'zap' },
  { key: 'trouble', label: '트러블슈팅', tag: 'ITSM 이력', ico: 'chat' },
  { key: 'manual', label: '매뉴얼 검색', tag: '문서 RAG', ico: 'book' },
]
const chatMode = ref('realtime')
const curMode = computed(() => chatModes.find(m => m.key === chatMode.value))
const chatInput = ref('')
const chatMsgs = ref([
  { role: 'user', text: '오늘 Critical 시그널 보여줘' },
  { role: 'agent', mode: 'realtime', text: '지난주 결제 시스템 이상 시그널은 총 92건 발생했습니다. 금요일에 집중되었고 Critical 비중이 전주 대비 18% 증가했습니다.', table: [['Critical', 14, '15%'], ['Warning', 31, '34%'], ['Info', 47, '51%']], sql: 'SELECT severity, COUNT(*) FROM signals WHERE dt = CURRENT_DATE GROUP BY severity', meta: '실행 320ms · 1.4M rows' },
])
const chatScroll = ref(null)
const chatChips = computed(() => ({
  realtime: ['결제 시스템 상세 분석', '오늘 Critical 시그널', 'MTTR 추이'],
  trouble: ['결제 게이트웨이 장애 대응', '유사 장애 이력', 'DB 복제 지연 조치'],
  manual: ['커넥션 풀 튜닝 가이드', 'Kafka lag 대응 SOP', 'OCP 스케일아웃 절차'],
}[chatMode.value]))
function askChat(text) {
  const t = (text ?? chatInput.value).trim()
  if (!t) return
  chatMsgs.value.push({ role: 'user', text: t })
  chatInput.value = ''
  const mode = chatMode.value
  setTimeout(() => {
    if (mode === 'trouble') {
      chatMsgs.value.push({ role: 'agent', mode: 'trouble', text: `증상 '${t}'에 대해 ITSM 장애이력에서 유사 사례를 검색했습니다. 원인 후보와 점검·조치 순서입니다.`, topk: [{ sys: '결제 게이트웨이', cause: '커넥션 풀 고갈', sim: '92%', inc: 'INC-20361' }, { sys: '결제 게이트웨이', cause: 'DB 커넥션 누수', sim: '81%', inc: 'INC-19884' }, { sys: 'API 게이트웨이', cause: '업스트림 타임아웃', sim: '67%', inc: 'INC-20120' }], steps: ['커넥션 풀 사용률·대기 큐 확인', '누수 의심 서비스 순차 재기동', '미해소 시 임계 상향 + 스케일아웃'] })
    } else if (mode === 'manual') {
      chatMsgs.value.push({ role: 'agent', mode: 'manual', text: `'${t}' 관련 OCP 운영 가이드·SOP를 검색했습니다. 근거 문서·페이지와 함께 답변드립니다.`, refs: [{ doc: 'OCP 운영 가이드 v3.2', page: 'p.128' }, { doc: '장애대응 SOP', page: '§4.3' }, { doc: '벤더 매뉴얼 (Kafka)', page: 'p.51' }] })
    } else {
      chatMsgs.value.push({ role: 'agent', mode: 'realtime', text: `'${t}' 질의를 Spark SQL 로 변환해 실행했습니다. 최근 7일 데이터 기준 결과입니다.`, table: [['Critical', 14, '15%'], ['Warning', 31, '34%'], ['Info', 47, '51%']], sql: 'SELECT severity, COUNT(*) cnt FROM signals WHERE dt >= date_sub(current_date, 7) GROUP BY severity', meta: '실행 288ms · 1.2M rows' })
    }
  }, 450)
}
watch(() => chatMsgs.value.length, async () => { await nextTick(); if (chatScroll.value) chatScroll.value.scrollTop = chatScroll.value.scrollHeight })
</script>

<template>
  <div class="itops" :class="{ dragging }" ref="itopsEl">
    <!-- 좌: 대시보드 (접기 없음 · 폭만 조절) -->
    <div class="io-main">
      <div class="io-head">
        <div>
          <div class="io-title">장애 예측 현황 대시보드</div>
          <div class="io-sub">실시간 장애 신호 모니터링 · {{ nowLabel }}</div>
        </div>
        <div class="io-head-ctl">
          <button v-if="!openFeed" class="btn btn-ghost btn-sm" @click="openFeed = true"><Icon name="expand" :size="13" /> 시그널 피드</button>
          <button v-if="!openChat" class="btn btn-ghost btn-sm" @click="openChat = true"><Icon name="chat" :size="13" /> 분석 챗</button>
        </div>
      </div>

      <div class="io-kpis">
        <div class="card io-risk">
          <button class="io-risk-top io-clk" @click="openRiskDetail"><span class="io-dot crit"></span> 현재 장애 위험도 <Icon name="chevron" :size="12" class="io-clk-ic" /></button>
          <div class="io-risk-body">
            <svg class="io-gauge" viewBox="0 0 120 120" width="104" height="104">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#E5E9F1" stroke-width="12" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="#D2403A" stroke-width="12" stroke-linecap="round" :stroke-dasharray="`${(risk / 100) * 314} 314`" transform="rotate(-90 60 60)" />
              <text x="60" y="58" text-anchor="middle" class="io-gauge-n">{{ risk }}</text>
              <text x="60" y="76" text-anchor="middle" class="io-gauge-l">HIGH</text>
            </svg>
            <div class="io-risk-note">결제 게이트웨이 위험 급상승, 향후 3시간 내 임계 초과 예상. (GC·장애예측 기반)<button class="btn btn-danger btn-sm" style="margin-top:10px">주요 시그널 확인</button></div>
          </div>
        </div>
        <div v-for="k in kpis" :key="k.label" class="card io-kpi">
          <button class="io-kpi-l io-clk" @click="openKpiDetail(k)">{{ k.label }} <Icon name="chevron" :size="11" class="io-clk-ic" /></button>
          <div class="io-kpi-v">{{ k.value }}<small>{{ k.unit }}</small></div>
          <div class="io-kpi-d" :class="k.up ? 'up' : 'down'">{{ k.delta }}</div>
          <svg class="io-spark" viewBox="0 0 120 34" preserveAspectRatio="none"><polyline :points="k.spark.map((v, i) => `${(i / (k.spark.length - 1)) * 120},${34 - ((v - Math.min(...k.spark)) / (Math.max(...k.spark) - Math.min(...k.spark) || 1)) * 30 - 2}`).join(' ')" fill="none" :stroke="k.tone === 'good' ? '#0E8A66' : '#2878F5'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </div>
      </div>

      <div class="card io-panel">
        <div class="io-panel-head"><div><button class="io-panel-title io-clk" @click="openTimelineDetail">위험 예측 타임라인 <Icon name="chevron" :size="13" class="io-clk-ic" /></button><div class="io-panel-sub">향후 12시간 내 장애 발생 확률 곡선</div></div></div>
        <div class="io-chart">
          <svg viewBox="0 0 640 150" preserveAspectRatio="none" class="io-area">
            <defs><linearGradient id="ioFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#D2403A" stop-opacity=".22" /><stop offset="100%" stop-color="#D2403A" stop-opacity="0" /></linearGradient></defs>
            <line :x1="0" :y1="thY" :x2="640" :y2="thY" stroke="#D2403A" stroke-width="1" stroke-dasharray="5 5" opacity=".5" />
            <path :d="TL.area" fill="url(#ioFill)" /><path :d="TL.line" fill="none" stroke="#D2403A" stroke-width="2.5" />
            <circle v-for="(p, i) in TL.ptsArr" :key="i" :cx="p.x" :cy="p.y" r="2.5" fill="#fff" stroke="#D2403A" stroke-width="1.5" v-show="i % 3 === 0" />
          </svg>
          <div class="io-th-label" :style="{ top: (thY / 150 * 100) + '%' }">임계 {{ threshold }}</div>
          <div class="io-xaxis"><span>+0h</span><span>+3h</span><span>+6h</span><span>+9h</span><span>+12h</span></div>
        </div>
      </div>

      <div class="card io-panel">
        <div class="io-panel-head"><div><button class="io-panel-title io-clk" @click="openTrendDetail">이상 시그널 추이 <Icon name="chevron" :size="13" class="io-clk-ic" /></button><div class="io-panel-sub">최근 7일 · 심각도별 발생 건수</div></div><div class="io-legend"><span class="lg crit">Critical</span><span class="lg warn">Warning</span><span class="lg info">Info</span></div></div>
        <div class="io-bars">
          <div v-for="t in trend" :key="t.d" class="io-bar-col">
            <div class="io-bar-stack" :style="{ height: '150px' }"><div class="io-bar seg-crit" :style="{ height: (t.c / trendMax * 150) + 'px' }"></div><div class="io-bar seg-warn" :style="{ height: (t.w / trendMax * 150) + 'px' }"></div><div class="io-bar seg-info" :style="{ height: (t.i / trendMax * 150) + 'px' }"></div></div>
            <div class="io-bar-x">{{ t.d }}</div>
          </div>
        </div>
      </div>

      <!-- 시스템별 / 유형별 분포 (클릭 시 상세 리스트 팝업) -->
      <div class="io-dist">
        <div class="card io-panel">
          <div class="io-panel-head"><div><div class="io-panel-title">시스템별 분포</div><div class="io-panel-sub">항목 클릭 시 상세 · 최근 7일</div></div></div>
          <div class="io-distlist">
            <button v-for="d in systemDist" :key="d.name" class="io-distbar" @click="openDetail('system', d)">
              <span class="io-distbar-name">{{ d.name }}</span>
              <span class="io-distbar-track"><span class="io-distbar-fill" :style="{ width: (d.count / sysMax * 100) + '%' }"></span></span>
              <span class="io-distbar-val">{{ d.count }}</span>
              <Icon name="chevron" :size="13" class="io-distbar-go" />
            </button>
          </div>
        </div>
        <div class="card io-panel">
          <div class="io-panel-head"><div><div class="io-panel-title">유형별 분포</div><div class="io-panel-sub">항목 클릭 시 상세 · 최근 7일</div></div></div>
          <div class="io-distlist">
            <button v-for="d in typeDist" :key="d.name" class="io-distbar" @click="openDetail('type', d)">
              <span class="io-distbar-name">{{ d.name }}</span>
              <span class="io-distbar-track"><span class="io-distbar-fill alt" :style="{ width: (d.count / typMax * 100) + '%' }"></span></span>
              <span class="io-distbar-val">{{ d.count }}</span>
              <Icon name="chevron" :size="13" class="io-distbar-go" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="openFeed" class="io-split" @pointerdown="startDrag(1, $event)" title="드래그하여 크기 조절"><span></span></div>

    <!-- 중: 실시간 시그널 피드 -->
    <aside class="io-feed" v-if="openFeed" :style="{ flex: `0 0 ${feedW}px` }">
      <div class="io-feed-head"><span class="io-dot crit live"></span> 실시간 시그널 피드 <span class="io-feed-live">LIVE</span><button class="io-collapse" @click="openFeed = false" title="피드 접기"><Icon name="collapse" :size="15" /></button></div>
      <div class="io-feed-list">
        <div v-for="(f, i) in feed" :key="i" class="io-sig" :class="f.lv">
          <div class="io-sig-top"><span class="io-sig-lv" :class="f.lv">{{ lvLabel[f.lv] }}</span><span class="io-sig-sys">{{ f.sys }}</span><span class="io-sig-ago">{{ f.ago }}</span></div>
          <div class="io-sig-msg">{{ f.msg }}</div>
          <div class="io-sig-foot"><span class="io-sig-metric">{{ f.metric }}</span><span class="io-sig-prob" :class="f.lv">확률 {{ f.prob }}%</span></div>
          <div class="io-sig-act"><button @click="recommend(f)"><Icon name="shield" :size="11" /> 조치 권고</button><button @click="makeTicket(f)"><Icon name="doc" :size="11" /> ITSM 티켓</button></div>
        </div>
      </div>
    </aside>

    <div v-if="openChat" class="io-split" @pointerdown="startDrag(2, $event)" title="드래그하여 크기 조절"><span></span></div>

    <!-- 우: 분석 챗 (대화형 3종 · 아이콘 토글) -->
    <aside class="io-chat" v-if="openChat" :style="{ flex: `0 0 ${chatW}px` }">
      <div class="io-chat-head"><span class="io-dot ok"></span> 분석 챗 <span class="io-chat-tag">{{ curMode.tag }}</span><button class="io-chat-x" @click="openChat = false" title="분석 챗 접기"><Icon name="collapse" :size="16" /></button></div>
      <div class="io-chat-modes icons">
        <button v-for="m in chatModes" :key="m.key" :class="{ on: chatMode === m.key }" @click="chatMode = m.key" :title="m.label"><Icon :name="m.ico" :size="15" /></button>
      </div>
      <div class="io-chat-scroll" ref="chatScroll">
        <div v-for="(m, i) in chatMsgs" :key="i" class="io-msg" :class="m.role">
          <div v-if="m.role === 'user'" class="io-msg-user">{{ m.text }}</div>
          <div v-else class="io-msg-agent">
            <div class="io-msg-brand"><span class="io-brand-sq">S</span> Shinhanlife 에이전트</div>
            <div class="io-msg-text">{{ m.text }}</div>
            <template v-if="m.table">
              <table class="io-tbl"><tr><th>심각도</th><th>건수</th><th>비중</th></tr><tr v-for="(row, ri) in m.table" :key="ri"><td><span class="io-tbl-dot" :class="['crit', 'warn', 'info'][ri]"></span>{{ row[0] }}</td><td>{{ row[1] }}</td><td>{{ row[2] }}</td></tr></table>
              <div v-if="m.sql" class="io-sql"><div class="io-sql-head">▸ 생성된 Spark SQL <span>{{ m.meta }}</span></div><code>{{ m.sql }}</code></div>
            </template>
            <template v-if="m.topk">
              <div class="io-topk"><div class="io-topk-label">유사 장애 Top-{{ m.topk.length }}</div><div v-for="(t, ti) in m.topk" :key="ti" class="io-topk-row"><span class="io-topk-sys">{{ t.sys }}</span><span class="io-topk-cause">{{ t.cause }}</span><span class="io-topk-sim">{{ t.sim }}</span><span class="io-topk-inc">{{ t.inc }}</span></div></div>
              <ol class="io-steps-ol"><li v-for="(s, si) in m.steps" :key="si">{{ s }}</li></ol>
            </template>
            <template v-if="m.refs"><div class="io-refs"><span v-for="(r, ri) in m.refs" :key="ri" class="io-ref"><Icon name="doc" :size="11" /> {{ r.doc }} <b>{{ r.page }}</b></span></div></template>
          </div>
        </div>
      </div>
      <div class="io-chat-chips"><button v-for="c in chatChips" :key="c" class="io-chip" @click="askChat(c)">{{ c }}</button></div>
      <div class="io-chat-input"><input v-model="chatInput" :placeholder="chatMode === 'trouble' ? '증상을 입력하세요 (예: 결제 p99 급등)' : chatMode === 'manual' ? '가이드·SOP를 검색하세요' : '데이터 통계를 자연어로 질의하세요…'" @keydown.enter="askChat()" /><button class="send-btn" @click="askChat()" aria-label="질의"><Icon name="send" :size="16" /></button></div>
      <div class="io-chat-note">{{ chatMode === 'realtime' ? '응답은 Spark SQL 로 변환·실행됩니다' : chatMode === 'trouble' ? 'ITSM 장애이력 기반 · 근거 인시던트 표시' : 'ACL 권한 필터 · 근거 문서/페이지 인용' }} · 결과는 감사 로그에 기록</div>
    </aside>

    <!-- 상세 리스트 팝업 -->
    <DetailModal v-if="detail" :detail="detail" @close="detail = null" />
  </div>
</template>
