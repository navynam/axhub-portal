<script setup>
/**
 * 설정 팝업 — 디자인 테마(시안) 전환
 * -----------------------------------------------------------------------------
 * 5가지 테마 시안을 미리보기와 함께 선택한다. 선택 즉시 전역에 적용(localStorage 유지).
 */
import { store, setTheme } from '../store.js'
import Icon from './Icon.vue'

const emit = defineEmits(['close'])

// 각 시안: 미리보기용 색상 + 설명
const themes = [
  { key: 'default', name: '기본 (신한 CI)', desc: '표준 반응형 그리드 · 신한 블루',
    c: { primary: '#0046FF', canvas: '#F6F7F9', card: '#FFFFFF', accent: '#C6982E', side: '#17284C' } },
  { key: 'bento', name: '베토 그리드', desc: '크기 다른 타일 매트릭스 · 파스텔 모자이크',
    c: { primary: '#4F46E5', canvas: '#F0F1F8', card: '#FFFFFF', accent: '#F59E0B', side: '#312E81' } },
  { key: 'dynamic', name: '다이나믹 카드', desc: '넷플릭스식 가로 스크롤 레일 · 그라데이션',
    c: { primary: '#7C3AED', canvas: '#F7F5FC', card: '#FFFFFF', accent: '#EC4899', side: '#3B1D6E' } },
  { key: 'minimal', name: '미니멀', desc: '플랫 리스트 행(한 줄 카드) · 모노톤',
    c: { primary: '#111827', canvas: '#FFFFFF', card: '#FFFFFF', accent: '#6B7280', side: '#14171F' } },
  { key: 'dark', name: '다크', desc: '다크 대시보드 · 네온 글로우',
    c: { primary: '#3B82F6', canvas: '#0E1116', card: '#171B22', accent: '#F5B301', side: '#0B0D12' } },
]
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-settings" role="dialog" aria-modal="true" aria-label="설정">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>

      <div class="set-head">
        <div class="set-title"><Icon name="gear" :size="17" /> 설정</div>
        <div class="set-sub">디자인 테마 · 시안 (5)</div>
      </div>

      <div class="theme-grid">
        <button v-for="t in themes" :key="t.key" class="theme-card" :class="{ on: store.theme === t.key }"
          @click="setTheme(t.key)" :aria-pressed="store.theme === t.key">
          <!-- 미리보기 모형 -->
          <div class="tp" :style="{ background: t.c.canvas }">
            <div class="tp-side" :style="{ background: t.c.side }"></div>
            <div class="tp-body">
              <div class="tp-bar" :style="{ background: t.c.card }">
                <span class="tp-dot" :style="{ background: t.c.primary }"></span>
                <span class="tp-dot" :style="{ background: t.c.accent }"></span>
              </div>
              <div class="tp-cards">
                <div class="tp-mini" :style="{ background: t.c.card }"><span :style="{ background: t.c.primary }"></span></div>
                <div class="tp-mini" :style="{ background: t.c.card }"><span :style="{ background: t.c.accent }"></span></div>
              </div>
            </div>
          </div>
          <div class="theme-meta">
            <div class="theme-name">{{ t.name }}<Icon v-if="store.theme === t.key" name="check" :size="15" class="theme-check" /></div>
            <div class="theme-desc">{{ t.desc }}</div>
          </div>
        </button>
      </div>

      <p class="set-note">선택하면 전체 화면에 즉시 적용되며, 다음 접속에도 유지됩니다.</p>
    </div>
  </div>
</template>
