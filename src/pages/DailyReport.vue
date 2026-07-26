<script setup>
/**
 * 일일점검 보고서 — 배치형 Agent (시스템 관리 하위 메뉴)
 * 매일 06:00 시스템 상태 자동 수집 → AI 초안 → 문서 변환 → 승인 → 그룹웨어 발송.
 */
import Icon from '../components/Icon.vue'
import { toast } from '../store.js'

const dataSources = [
  { name: 'OCP 클러스터 상태', ok: true, at: '05:58' }, { name: 'GPU 사용률', ok: true, at: '05:58' },
  { name: 'DB 연결 · API 응답', ok: true, at: '05:59' }, { name: '보안 로그', ok: true, at: '05:59' },
]
const dailyStages = [
  { name: '상태 수집', done: true }, { name: 'AI 초안', done: true }, { name: '문서 변환', done: true },
  { name: '승인', done: false, current: true }, { name: '그룹웨어 발송', done: false },
]
const reportSections = ['1. 종합 요약', '2. 리소스 현황 (OCP·GPU)', '3. DB·API 헬스체크', '4. 이상 항목 및 조치', '5. 보안 로그 요약']
const reportHistory = [
  { date: '2026-07-15', status: '발송 완료', to: '운영팀 그룹웨어' },
  { date: '2026-07-14', status: '발송 완료', to: '운영팀 그룹웨어' },
  { date: '2026-07-13', status: '발송 완료', to: '운영팀 그룹웨어' },
]
function sendDaily() { toast('일일점검 보고서를 승인·발송했습니다. (운영팀 그룹웨어)', 'ok') }
</script>

<template>
  <div class="io-work">
    <div class="io-work-head">
      <div><div class="io-title">일일점검 보고서 <span class="io-type-badge">배치형</span></div><div class="io-sub">매일 06:00 스케줄 배치 · 요건 재정리중 (김건호·이응규·정성원)</div></div>
    </div>
    <div class="io-work-grid">
      <div class="card io-panel">
        <div class="io-panel-head"><div><div class="io-panel-title">데이터 소스 수집</div><div class="io-panel-sub">오늘 06:00 자동 수집</div></div></div>
        <div class="io-src"><div v-for="s in dataSources" :key="s.name" class="io-src-row"><span class="io-src-ck"><Icon name="check" :size="12" /></span><span class="io-src-name">{{ s.name }}</span><span class="io-src-at">{{ s.at }} 수집</span></div></div>
      </div>
      <div class="card io-panel">
        <div class="io-panel-head"><div><div class="io-panel-title">생성 파이프라인</div><div class="io-panel-sub">현재 ‘승인’ 단계 대기</div></div></div>
        <div class="io-steps"><div v-for="(s, i) in dailyStages" :key="i" class="io-step" :class="{ done: s.done, cur: s.current }"><span class="io-step-dot"><Icon v-if="s.done" name="check" :size="11" /></span><span class="io-step-name">{{ s.name }}</span></div></div>
      </div>
      <div class="card io-panel io-span2">
        <div class="io-panel-head"><div><div class="io-panel-title">보고서 미리보기</div><div class="io-panel-sub">AI 초안 · 사내 양식 템플릿</div></div><div class="io-dl"><button class="btn btn-ghost btn-sm">Word</button><button class="btn btn-ghost btn-sm">PDF</button><button class="btn btn-ghost btn-sm">HTML</button></div></div>
        <div class="io-doc"><div v-for="s in reportSections" :key="s" class="io-doc-sec">{{ s }}</div></div>
        <div class="io-work-foot"><span class="io-daily-src">데이터 소스 4/4 수집 완료 · AI 초안 생성됨</span><button class="btn btn-primary btn-sm" @click="sendDaily">승인 · 그룹웨어 발송</button></div>
      </div>
      <div class="card io-panel io-span2">
        <div class="io-panel-head"><div class="io-panel-title">최근 발송 이력</div></div>
        <div class="io-hist"><div v-for="h in reportHistory" :key="h.date" class="io-hist-row"><span class="io-hist-date">{{ h.date }}</span><span class="pill pill-active pill-sm">{{ h.status }}</span><span class="io-hist-to">{{ h.to }}</span></div></div>
      </div>
    </div>
  </div>
</template>
