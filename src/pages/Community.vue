<script setup>
import { computed } from 'vue'
import { store, toast, openRun } from '../store.js'

// 활성 게시판 = 사이드바에서 선택한 페이지(게시판 id)
const board = computed(() => store.boards.find(b => b.id === store.page) || store.boards[0])

function runAgent(id) {
  const a = store.agents.find(x => x.id === id)
  if (!a) return
  if (a.perm === 'granted' || a.perm === 'owner') openRun(a)
  else toast(`'${a.name}' 사용 권한이 없습니다. 카탈로그에서 권한을 요청하세요.`, 'warn')
}
function write() { toast(`'${board.value.name}' 글 작성 화면으로 이동합니다. (데모)`) }
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <div class="eyebrow">커뮤니티</div>
        <div class="page-title">{{ board.name }}</div>
        <div class="page-desc">{{ board.desc }}</div>
      </div>
      <button class="btn btn-primary" @click="write">글 작성</button>
    </div>

    <div v-if="board.id === 'notice'" class="notice-strip" role="status">
      <span aria-hidden="true">📢</span> [중요] 신규 Agent 12종 오픈 안내 — 자세한 내용은 공지사항을 확인하세요.
    </div>

    <div class="section">
      <div class="section-title">{{ board.name }} <span class="count">{{ board.posts.length }}건</span></div>
      <div class="card">
        <div v-for="(p, i) in board.posts" :key="i" class="post-row">
          <span class="post-title">{{ p.title }}</span>
          <span class="post-meta">{{ p.author }} · {{ p.date }} · 조회 {{ p.views.toLocaleString() }}</span>
          <button v-if="p.agent" class="btn btn-green btn-sm" @click="runAgent(p.agent)">관련 Agent 실행</button>
        </div>
        <div v-if="!board.posts.length" class="empty"><b>아직 글이 없습니다</b>첫 글을 작성해 보세요.</div>
      </div>
    </div>
  </div>
</template>
