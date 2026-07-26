<script setup>
/**
 * 현황 전파 — Computer-Use Agent (시스템 관리 하위 메뉴)
 * 웹 콘솔·대시보드 자동 탐색 → 이상 판단 → 민감정보 Redaction → 그룹웨어·메일 자동 전파.
 */
import Icon from '../components/Icon.vue'
import { toast } from '../store.js'

const scanTargets = [
  { target: 'OCP Console', desc: '클러스터·워크로드 상태', result: '이상 없음', ok: true, when: '06:00', sent: '그룹웨어' },
  { target: 'Grafana', desc: '결제 대시보드', result: 'p99 이상 감지', ok: false, when: '14:31', sent: '메일·그룹웨어' },
  { target: 'Splunk', desc: '인증 로그', result: '실패율 상승', ok: false, when: '14:20', sent: '메일' },
]
const propChannels = ['그룹웨어', '메일', 'Slack(연동 예정)']
function runScan() { toast('현황 자동 탐색을 실행했습니다. 완료 후 이상 여부를 전파합니다.', 'ok') }
</script>

<template>
  <div class="io-work">
    <div class="io-work-head">
      <div><div class="io-title">현황 전파 <span class="io-type-badge">Computer-Use</span></div><div class="io-sub">웹 콘솔·대시보드 자동 탐색 → 이상 판단 → 민감정보 Redaction → 자동 전파 · 스케줄 + 이벤트 감지 시</div></div>
      <button class="btn btn-primary btn-sm" @click="runScan"><Icon name="zap" :size="13" /> 지금 탐색 실행</button>
    </div>
    <div class="io-scan">
      <div v-for="t in scanTargets" :key="t.target" class="card io-scan-card">
        <div class="io-scan-shot" :class="{ bad: !t.ok }"><Icon name="grid" :size="20" /><span class="io-scan-redact">Redacted</span></div>
        <div class="io-scan-body">
          <div class="io-scan-target">{{ t.target }} <span class="io-scan-desc">{{ t.desc }}</span></div>
          <div class="io-scan-result" :class="{ bad: !t.ok }"><span class="io-dot" :class="t.ok ? 'ok' : 'crit'"></span> AI 판단: {{ t.result }}</div>
          <div class="io-scan-meta">{{ t.when }} · {{ t.sent }} 전파 완료</div>
        </div>
      </div>
    </div>
    <div class="card io-panel">
      <div class="io-panel-head"><div class="io-panel-title">전파 대상 채널</div></div>
      <div class="io-chan"><span v-for="c in propChannels" :key="c" class="io-chan-chip">{{ c }}</span></div>
      <div class="io-work-foot" style="margin-top:12px"><span class="io-daily-src">이상 감지 시 자동 전파 · 민감정보는 Redaction 후 발송</span></div>
    </div>
  </div>
</template>
