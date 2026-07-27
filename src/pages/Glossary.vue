<script setup>
/**
 * 용어사전 — 대화형 용어 조회 (메인 메뉴) · [담당: 개발자 B]
 * -----------------------------------------------------------------------------
 * My Agent 실행(대화) 화면과 동일한 레이아웃으로, 용어를 채팅으로 조회한다.
 *  좌: 조회 이력(세션 목록)  ┃  중: 대화창(용어 질의·응답)  ┃  우: 카테고리·자주 찾는 용어
 * 자체 로컬 상태로 동작(에이전트 대화 store 와 분리). 답변은 glossaryTerms 목데이터 기반.
 */
import { ref, computed, nextTick, watch } from 'vue'
import { glossaryTerms } from '../data.js'
import Icon from '../components/Icon.vue'

const terms = glossaryTerms
const input = ref('')
const scrollEl = ref(null)
const showInsight = ref(true)
const chatQ = ref('')            // 이력 검색어
const menuFor = ref(null)        // 열린 항목 메뉴

// 카테고리별 개수
const cats = computed(() => {
  const m = new Map()
  terms.forEach(t => m.set(t.cat, (m.get(t.cat) || 0) + 1))
  return [...m.entries()].map(([name, n]) => ({ name, n }))
})
// 자주 찾는 용어(추천/인기)
const popular = ['RAG', 'LLM', '에이전트(Agent)', 'MCP', '언더라이팅(Underwriting)', 'ABAC']

// ── 용어 매칭 & 답변 생성 ─────────────────────────
function findTerms(q) {
  const s = q.toLowerCase().replace(/\s/g, '')
  if (!s) return []
  return terms.filter(t => {
    const hay = [t.term, ...(t.keys || [])].map(x => x.toLowerCase().replace(/\s/g, ''))
    return hay.some(h => h && (s.includes(h) || (s.length >= 2 && h.includes(s))))
  })
}
function answerFor(matches, q) {
  if (matches.length === 1) {
    const t = matches[0]
    const lines = [`📖 ${t.term}   ·   ${t.cat}`, ``, t.def]
    if (t.related?.length) lines.push('', `관련 용어: ${t.related.join(' · ')}`)
    return lines.join('\n')
  }
  if (matches.length > 1) {
    return [
      `'${q}'와(과) 관련된 용어 ${matches.length}건을 찾았습니다.`, ``,
      ...matches.slice(0, 6).map(t => `· ${t.term} — ${t.def.slice(0, 42)}…`), ``,
      `정확한 용어명을 입력하면 상세 설명을 보여드립니다.`,
    ].join('\n')
  }
  return [
    `'${q}' 용어를 사전에서 찾지 못했습니다.`, ``,
    `다른 표현으로 검색하거나, 아래 자주 찾는 용어를 참고하세요:`,
    popular.join(' · '),
  ].join('\n')
}

// ── 조회 이력(세션) ───────────────────────────────
let gseq = 1
function mkSession(termName, when) {
  const t = terms.find(x => x.term === termName)
  return { id: 'gs-' + (gseq++), title: t.term, when, msgs: [
    { role: 'user', text: `${t.term} 뜻이 뭐야?` },
    { role: 'agent', text: answerFor([t], t.term) },
  ] }
}
// 시연용 이력 시드
const sessions = ref([mkSession('RAG', '어제'), mkSession('언더라이팅(Underwriting)', '2일 전')])
const currentId = ref(null)      // null = 새 조회(웰컴)
const cur = computed(() => sessions.value.find(s => s.id === currentId.value) || null)
const msgs = computed(() => cur.value?.msgs || [])
const busy = computed(() => msgs.value.some(m => m.typing))

const filteredHistory = computed(() => {
  const q = chatQ.value.trim()
  return q ? sessions.value.filter(s => s.title.includes(q)) : sessions.value
})

function startNew() { currentId.value = null; input.value = ''; menuFor.value = null }
function selectSession(id) { currentId.value = id }
function toggleMenu(id) { menuFor.value = menuFor.value === id ? null : id }
function renameSession(s) {
  const t = window.prompt('이력 제목을 입력하세요', s.title)
  if (t !== null && t.trim()) s.title = t.trim()
  menuFor.value = null
}
function removeSession(s) {
  if (window.confirm(`'${s.title}' 조회 이력을 삭제할까요?`)) {
    const i = sessions.value.findIndex(x => x.id === s.id)
    if (i >= 0) sessions.value.splice(i, 1)
    if (currentId.value === s.id) currentId.value = null
  }
  menuFor.value = null
}

function send(text) {
  const t = (text ?? input.value).trim()
  if (!t || busy.value) return
  // 세션 없으면 새로 생성(제목 = 매칭 용어명 or 질의)
  if (!cur.value) {
    const first = findTerms(t)[0]
    const s = { id: 'gs-' + (gseq++), title: (first?.term || t).slice(0, 24), when: '방금', msgs: [] }
    sessions.value.unshift(s)
    currentId.value = s.id
  }
  const s = cur.value
  s.msgs.push({ role: 'user', text: t })
  input.value = ''
  const full = answerFor(findTerms(t), t)
  s.msgs.push({ role: 'agent', text: '', typing: true })
  // 반응형 배열은 인덱스로 접근해 변경해야 화면에 반영됨(로컬 객체 참조 직접 변경은 미반영)
  const idx = s.msgs.length - 1
  setTimeout(() => {
    s.msgs[idx].typing = false
    let i = 0
    const tm = setInterval(() => {
      i = Math.min(i + 3, full.length)
      s.msgs[idx].text = full.slice(0, i)
      if (i >= full.length) clearInterval(tm)
    }, 20)
  }, 400)
}

watch(() => msgs.value.map(m => m.text).join('|'), async () => {
  await nextTick(); if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
})
</script>

<template>
  <div>
    <div class="run-head">
      <div class="run-crumb"><Icon name="search" :size="16" style="vertical-align:-3px;margin-right:6px" />용어사전</div>
      <span style="flex:1"></span>
      <span class="gl-count">{{ terms.length }}개 용어 · {{ cats.length }}개 분류</span>
      <button class="btn btn-primary btn-sm" @click="startNew"><Icon name="plus" :size="14" /> 새 조회</button>
      <button class="btn btn-ghost btn-sm" @click="showInsight = !showInsight" :aria-pressed="showInsight"
        :title="showInsight ? '분류 숨기기' : '분류 보기'"><Icon name="list" :size="14" /> {{ showInsight ? '분류 숨기기' : '분류 보기' }}</button>
    </div>

    <div class="run-layout" :class="{ 'no-insight': !showInsight }">
      <!-- ① 조회 이력 -->
      <aside class="chat-side">
        <div class="cs-head">
          <button class="btn btn-primary btn-sm cs-new" @click="startNew"><Icon name="plus" :size="15" /> 새 조회</button>
        </div>
        <div class="cs-scroll">
          <div class="search cs-search"><Icon name="search" :size="15" /><input v-model="chatQ" placeholder="조회 이력 검색" aria-label="조회 이력 검색" /></div>
          <div class="cs-list" v-if="filteredHistory.length">
            <div v-for="s in filteredHistory" :key="s.id" class="cs-item" :class="{ on: s.id === currentId }" @click="selectSession(s.id)">
              <div class="cs-item-body">
                <div class="cs-title">{{ s.title }}</div>
                <div class="cs-when">{{ s.when }} · {{ s.msgs.filter(m => m.role === 'user').length }}회 질의</div>
              </div>
              <button class="cs-kebab" @click.stop="toggleMenu(s.id)" aria-label="이력 메뉴" title="이력 메뉴"><Icon name="dots" :size="16" /></button>
              <div class="cs-menu" v-if="menuFor === s.id" @click.stop>
                <button @click="renameSession(s)"><Icon name="edit" :size="13" /> 이름 변경</button>
                <button class="danger" @click="removeSession(s)"><Icon name="trash" :size="13" /> 삭제</button>
              </div>
            </div>
          </div>
          <div class="cs-empty" v-else>
            <div class="cs-empty-ic"><Icon name="search" :size="26" /></div>
            <b>조회 이력이 없습니다</b>
            <span>용어를 입력해 조회를 시작하거나<br>검색어를 바꿔보세요</span>
          </div>
        </div>
        <div v-if="menuFor" class="cs-menu-scrim" @click="menuFor = null"></div>
      </aside>

      <!-- ② 대화창 -->
      <div class="card chat-card">
        <div class="chat-header">
          <div class="sq sq-navy sq-sm"><Icon name="book" :size="15" /></div>
          <div class="ch-info">
            <div class="ch-name">용어사전 도우미</div>
            <div class="ch-desc">AI·보험·데이터·인프라 용어를 대화로 조회합니다</div>
          </div>
        </div>

        <!-- 대화 있음 -->
        <div class="chat-scroll" ref="scrollEl" v-if="cur">
          <div v-for="(m, i) in msgs" :key="i" class="msg" :class="m.role">
            <div v-if="m.role === 'agent'" class="sq sq-navy sq-sm"><Icon name="book" :size="14" /></div>
            <div class="msg-col">
              <div class="bubble">
                <span v-if="m.typing" class="typing" aria-label="조회 중"><i></i><i></i><i></i></span>
                <template v-else>{{ m.text }}</template>
              </div>
            </div>
          </div>
        </div>

        <!-- 웰컴(새 조회) -->
        <div class="chat-scroll chat-welcome" v-else>
          <div class="sq sq-navy sq-lg cw-ic"><Icon name="book" :size="26" /></div>
          <div class="cw-title">무슨 용어가 궁금하세요?</div>
          <div class="cw-desc">용어명을 입력하면 뜻·분류·관련 용어를 알려드립니다.</div>
          <div class="cw-hint">아래 자주 찾는 용어로 바로 시작할 수 있어요.</div>
          <div class="cw-chips">
            <button v-for="s in popular" :key="s" class="chip" @click="send(s)">{{ s }}</button>
          </div>
        </div>

        <!-- 입력 -->
        <div class="chat-input">
          <input v-model="input" placeholder="용어를 입력하세요 (예: RAG, 언더라이팅, MTTR)" aria-label="용어 입력"
            @keydown.enter="send()" :disabled="busy" />
          <button class="send-btn" :disabled="busy || !input.trim()" @click="send()" aria-label="조회"><Icon name="send" :size="17" /></button>
        </div>
      </div>

      <!-- ③ 카테고리 · 자주 찾는 용어 -->
      <aside class="insight" v-if="showInsight">
        <div class="card insight-card">
          <div class="insight-title">용어 분류</div>
          <div v-for="c in cats" :key="c.name" class="insight-row"><span class="k">{{ c.name }}</span><span class="v">{{ c.n }}개</span></div>
        </div>
        <div class="card insight-card">
          <div class="insight-title">자주 찾는 용어</div>
          <div class="gl-terms">
            <button v-for="t in popular" :key="t" class="chip" @click="send(t)">{{ t }}</button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.gl-count { font-size: 12px; color: var(--gray-lt); font-weight: 650; margin-right: 4px; }
.gl-terms { display: flex; flex-wrap: wrap; gap: 6px; }
.gl-terms .chip { padding: 5px 11px; font-size: 11.5px; }
</style>
