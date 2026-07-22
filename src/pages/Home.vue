<script setup>
/**
 * 워크스페이스(홈) — 설계서 4p "Main Type B"
 * -----------------------------------------------------------------------------
 * 구성: 등록 건수 → [My Agent 폴더 트리 | Work Space 카드] + 액션 타일 + 현황 스탯 / 우측 커뮤니티 컬럼
 * ※ 아래 데이터는 화면 확인용 샘플이다. 실제로는 agentService/communityService 로 대체한다.
 */
import { store, go } from '../store.js'
import Icon from '../components/Icon.vue'

const registeredCount = 7

// My Agent 폴더 트리 (폴더 → 에이전트 목록)
const myAgentFolders = [
  { name: '나의 업무', count: 2, items: [
    { name: 'Vue3-Spring 개발 코파일럿', desc: 'Vue3와 Spring 기반의 프론트엔드/백오피스 개발…' },
    { name: 'Vue3-Spring 개발 코파일럿', desc: 'Vue3와 Spring 기반의 프론트엔드/백오피스 개발…' },
  ] },
  { name: '미분류', count: 4, items: [
    { name: 'Vue3-Spring 개발 코파일럿', desc: 'Vue3와 Spring 기반의 프론트엔드/백오피스 개발…' },
    { name: 'Vue3-Spring 개발 코파일럿', desc: 'Vue3와 Spring 기반의 프론트엔드/백오피스 개발…' },
  ] },
]

// Work Space 카드
const workspaceCards = [
  { name: 'RAG 평가 데이터셋 생성 에이전트', desc: '사용자가 업로드한 문서(PDF/Markdown/Text)를 분석…', tags: ['RAG', 'PPT', '시장분석'] },
  { name: '사내 문서 RAG 챗봇', desc: 'deepconnect_search로 사내 지식 베이스(Advanced Kno…', tags: ['주식', '도식', '뉴스레터'] },
  { name: '사내 문서 RAG 챗봇', desc: 'deepconnect_search로 사내 지식 베이스(Advanced Kno…', tags: ['교정', '출처', '컨설팅'] },
]

// 액션 타일
const actionTiles = [
  { name: '에이전트 직접 만들기', icon: 'plus' },
  { name: '에이전트 가져오기', icon: 'download' },
  { name: 'M&A 분석기 v3', fav: true },
  { name: '트렌드 대시보드 봇', fav: true },
]

// 현황 스탯
const stats = [
  { label: '나의 에이전트', value: 17, icon: 'bot' },
  { label: '승인된 에이전트', value: 3, icon: 'check' },
  { label: '권한요청 지식', value: 12, icon: 'book' },
  { label: '권한요청 도구', value: 2, icon: 'shield' },
]

// 우측 커뮤니티 컬럼
const communityCols = [
  { title: '공지사항', to: 'community', items: ['[시스템] AX Portal 배포 일정..', '[에이전트] 이 달의 추천 에이..', '[권한] 권한신청 방법 안내에 ..'] },
  { title: '커뮤니티', to: 'community', items: ['Agent 생성 기능 좋아요', '주간보고서 봇 생성방법 공유', '도구 툴에 프로그램 추가여부'] },
  { title: '문의 및 오류', to: 'community', items: ['[문의] 지식관리 등록방법', '[개선] 버튼 크기 변경 요청', '[문의] 에이전트 등록방법에…'] },
  { title: '사용자가이드', to: 'community', items: ['챗봇 기능 활성화 가이드', '업무부서 Agent 생성 안내', 'AX추진팀 문서 등록 관리'] },
]
</script>

<template>
  <div>
    <div class="mtb-count">▪ 등록한 에이전트 : <b>{{ registeredCount }}</b>건</div>

    <div class="mtb-grid">
      <!-- 좌: 메인 -->
      <div class="mtb-main">
        <!-- My Agent | Work Space -->
        <div class="mtb-panels">
          <!-- My Agent -->
          <div class="mtb-panel">
            <div class="mtb-panel-head">My Agent <button class="mtb-more" @click="go('agents')" aria-label="전체 보기"><Icon name="arrow" :size="16" /></button></div>
            <div class="search mtb-search"><Icon name="search" :size="15" /><input placeholder="Agent 검색" aria-label="Agent 검색" /></div>
            <div class="mtb-tree">
              <div v-for="f in myAgentFolders" :key="f.name" class="mtb-folder">
                <div class="mtb-folder-head"><span class="mtb-caret">▾</span> <Icon name="folder" :size="14" /> {{ f.name }} ({{ f.count }})</div>
                <div v-for="(it, i) in f.items" :key="i" class="mtb-agent-item" @click="go('agents')">
                  <div class="mtb-ai-name">{{ it.name }}</div>
                  <div class="mtb-ai-desc">{{ it.desc }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Work Space -->
          <div class="mtb-panel">
            <div class="mtb-panel-head">Work Space <button class="mtb-more" @click="go('agents')" aria-label="전체 보기"><Icon name="arrow" :size="16" /></button></div>
            <div class="search mtb-search"><Icon name="search" :size="15" /><input placeholder="Agent 검색" aria-label="Agent 검색" /></div>
            <div class="mtb-ws">
              <div v-for="(c, i) in workspaceCards" :key="i" class="mtb-ws-card" @click="go('agents')">
                <div class="mtb-ws-name">{{ c.name }}</div>
                <div class="mtb-ws-desc">{{ c.desc }}</div>
                <div class="mtb-ws-tags"><span v-for="t in c.tags" :key="t" class="ax-tag">{{ t }}</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 액션 타일 -->
        <div class="mtb-tiles">
          <div v-for="(t, i) in actionTiles" :key="i" class="mtb-tile" @click="go('agents')">
            <div v-if="t.icon" class="mtb-tile-ic"><Icon :name="t.icon" :size="16" /></div>
            <div class="mtb-tile-name">{{ t.name }}</div>
            <div v-if="t.fav" class="mtb-tile-sub">즐겨찾기</div>
          </div>
        </div>

        <!-- 현황 스탯 -->
        <div class="mtb-stats">
          <div v-for="(s, i) in stats" :key="i" class="mtb-stat">
            <div class="mtb-stat-ic"><Icon :name="s.icon" :size="18" /></div>
            <div class="mtb-stat-l">{{ s.label }}</div>
            <div class="mtb-stat-n">{{ s.value }}</div>
          </div>
        </div>
      </div>

      <!-- 우: 커뮤니티 컬럼 -->
      <aside class="mtb-side">
        <div v-for="col in communityCols" :key="col.title" class="mtb-col">
          <div class="mtb-col-head">{{ col.title }} <button class="mtb-more" @click="go(col.to)" aria-label="더 보기"><Icon name="arrow" :size="15" /></button></div>
          <ul class="mtb-col-list">
            <li v-for="(it, i) in col.items" :key="i" @click="go(col.to)">{{ it }}</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>
