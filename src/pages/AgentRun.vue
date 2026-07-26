<script setup>
/**
 * My Agent 상세 · 대화창 — 설계서 "Main > Agent > My Agent"
 * -----------------------------------------------------------------------------
 * 좌: 채팅 목록(새 채팅 + 공개여부 + 검색 + 목록/빈상태)  ┃  중: 대화창  ┃  우: 인사이트(접기 가능)
 */
import { ref, computed, nextTick, watch } from 'vue'
import {
  store, go, sendMessage, currentConv, newConversation, selectConversation,
  deleteConversation, renameConversation,
} from '../store.js'
import Icon from '../components/Icon.vue'
import StatusPill from '../components/StatusPill.vue'
import ReportModal from '../components/ReportModal.vue'

const agent = computed(() => store.currentAgent)
const conv = computed(() => currentConv())
const msgs = computed(() => conv.value?.msgs || [])
const input = ref('')
const scrollEl = ref(null)
const showInsight = ref(true)   // 오른쪽 상세(인사이트) 패널 표시
const showReport = ref(false)   // 신고·개선요청 팝업

// ── 좌측 채팅 목록 ────────────────────────────────
const chatQ = ref('')           // 채팅 검색어
const menuFor = ref(null)       // 열려있는 항목 메뉴(대화 id)

// 이 Agent의 대화 목록 (검색어로 제목 필터)
const history = computed(() => agent.value ? store.conversations.filter(c => c.agentId === agent.value.id) : [])
const filteredHistory = computed(() => {
  const q = chatQ.value.trim()
  return q ? history.value.filter(c => c.title.includes(q)) : history.value
})

// 새 채팅: 새로운 대화를 시작하고 목록 선택을 해당 대화로 이동(설계서 3)
function startNewChat() { newConversation(); menuFor.value = null }
function toggleMenu(id) { menuFor.value = menuFor.value === id ? null : id }
function renameChat(c) {
  const t = window.prompt('대화 제목을 입력하세요', c.title)
  if (t !== null) renameConversation(c.id, t)
  menuFor.value = null
}
function removeChat(c) {
  if (window.confirm(`'${c.title}' 대화를 삭제할까요?`)) deleteConversation(c.id)
  menuFor.value = null
}

const busy = computed(() => msgs.value.some(m => m.typing))

// 연결 지식: 소유 부서 일치 우선, 부족하면 앞에서 채움
const linkedKnowledge = computed(() => {
  if (!agent.value) return []
  const own = store.knowledge.filter(k => k.owner === agent.value.owner)
  const rest = store.knowledge.filter(k => k.owner !== agent.value.owner)
  return [...own, ...rest].slice(0, Math.max(agent.value.knowledge, 1))
})

// 관련 가이드·사례 (agent id가 연결된 게시글)
const relatedPosts = computed(() => {
  if (!agent.value) return []
  const out = []
  store.boards.forEach(b => b.posts.forEach(p => { if (p.agent === agent.value.id) out.push({ ...p, board: b.name }) }))
  return out.slice(0, 3)
})

const suggestions = computed(() => agent.value ? [
  `${agent.value.name.replace(' Agent', '')} 최근 현황 요약해줘`,
  '핵심 지표 3가지만 알려줘',
  '결과를 보고서 초안으로 정리해줘',
] : [])

// 입력창 하단 도구 아이콘 (설계서 하단 툴바 — 데모용 표시)
const inputTools = [
  { icon: 'star', label: '즐겨찾기 프롬프트' },
  { icon: 'tool', label: '도구' },
  { icon: 'users', label: '멤버' },
  { icon: 'layers', label: '지식 소스' },
  { icon: 'zap', label: '빠른 작업' },
  { icon: 'doc', label: '문서 첨부' },
  { icon: 'attach', label: '파일 첨부' },
]

function send(text) {
  const t = (text ?? input.value).trim()
  if (!t || busy.value) return
  if (!conv.value) newConversation()   // 선택된 대화가 없으면 새 대화 생성 후 전송
  sendMessage(t)
  input.value = ''
}

// 설계서(7p)의 토큰/비용 사용량 표시. 실제 연동 전에는 응답 길이로 근사한 목값을 사용.
function usage(text) {
  const out = Math.max(20, Math.round((text || '').length / 3))
  const inp = Math.round(out * 1.2)
  const cost = ((inp + out) * 0.0000012).toFixed(4)
  return `↓ ${out} · ↑ ${inp} · $${cost}`
}

// 새 메시지 시 스크롤 하단 고정
watch(() => msgs.value.map(m => m.text).join('|'), async () => {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
})
</script>

<template>
  <div v-if="agent">
    <div class="run-head">
      <button class="run-back" @click="go('agents')" aria-label="Agent 카탈로그로 돌아가기"><Icon name="back" :size="17" /></button>
      <div class="run-crumb">{{ agent.perm === 'owner' ? 'My Agent' : 'Agent 대화' }}</div>
      <span style="flex:1"></span>
      <StatusPill :perm="agent.perm === 'owner' ? 'owner' : agent.perm" />
      <button class="btn btn-ghost btn-sm run-report-btn" @click="showReport = true" title="신고 · 개선 요청">
        <Icon name="flag" :size="14" /> 신고하기
      </button>
      <button class="btn btn-ghost btn-sm run-insight-toggle" @click="showInsight = !showInsight"
        :aria-pressed="showInsight" :title="showInsight ? '상세 정보 숨기기' : '상세 정보 보기'">
        <Icon name="doc" :size="14" /> {{ showInsight ? '상세 숨기기' : '상세 보기' }}
      </button>
    </div>

    <div class="run-layout" :class="{ 'no-insight': !showInsight }">
      <!-- ① 채팅 목록 -->
      <aside class="chat-side">
        <!-- 새 채팅 (설계서 3) -->
        <div class="cs-head">
          <button class="btn btn-primary btn-sm cs-new" @click="startNewChat"><Icon name="plus" :size="15" /> 새 채팅</button>
        </div>

        <!-- 검색 + 목록 (설계서 7: 이 영역이 스크롤) -->
        <div class="cs-scroll">
          <div class="search cs-search"><Icon name="search" :size="15" /><input v-model="chatQ" placeholder="채팅 검색" aria-label="채팅 검색" /></div>

          <div class="cs-list" v-if="filteredHistory.length">
            <div v-for="c in filteredHistory" :key="c.id" class="cs-item"
              :class="{ on: c.id === store.currentConvId }" @click="selectConversation(c.id)">
              <div class="cs-item-body">
                <div class="cs-title">{{ c.title }}</div>
                <div class="cs-when">{{ c.when }}</div>
              </div>
              <button class="cs-kebab" @click.stop="toggleMenu(c.id)" aria-label="대화 메뉴" title="대화 메뉴"><Icon name="dots" :size="16" /></button>
              <div class="cs-menu" v-if="menuFor === c.id" @click.stop>
                <button @click="renameChat(c)"><Icon name="edit" :size="13" /> 이름 변경</button>
                <button class="danger" @click="removeChat(c)"><Icon name="trash" :size="13" /> 삭제</button>
              </div>
            </div>
          </div>

          <!-- 빈 상태 (설계서 6) -->
          <div class="cs-empty" v-else>
            <div class="cs-empty-ic"><Icon name="chat" :size="26" /></div>
            <b>채팅이 없거나 조회되지 않습니다</b>
            <span>새로운 채팅을 시작하시거나<br>알맞은 검색어를 입력하세요</span>
          </div>
        </div>

        <!-- 항목 메뉴 바깥 클릭 닫기 -->
        <div v-if="menuFor" class="cs-menu-scrim" @click="menuFor = null"></div>
      </aside>

      <!-- ② 대화창 -->
      <div class="card chat-card">
        <!-- 에이전트 헤더 (설계서): 이름·설명·태그 + 수정 -->
        <div class="chat-header">
          <div class="sq sq-navy sq-sm">{{ agent.name.slice(0, 1) }}</div>
          <div class="ch-info">
            <div class="ch-name">{{ agent.name }}</div>
            <div class="ch-desc">{{ agent.desc }}</div>
            <div class="ch-tags"><span v-for="t in (agent.tools || []).slice(0, 5)" :key="t" class="ax-tag">{{ t }}</span></div>
          </div>
          <button class="btn btn-primary btn-sm ch-edit" v-if="agent.perm === 'owner'"><Icon name="edit" :size="13" /> 수정</button>
        </div>

        <!-- 대화 있음: 메시지 -->
        <div class="chat-scroll" ref="scrollEl" v-if="conv">
          <div v-for="(m, i) in msgs" :key="i" class="msg" :class="m.role">
            <div v-if="m.role === 'agent'" class="sq sq-navy sq-sm">{{ agent.name.slice(0, 1) }}</div>
            <div class="msg-col">
              <div class="bubble">
                <span v-if="m.typing" class="typing" aria-label="응답 생성 중"><i></i><i></i><i></i></span>
                <template v-else>{{ m.text }}</template>
              </div>
              <div v-if="m.role === 'agent' && !m.typing" class="msg-usage">
                <span class="msg-copy"><Icon name="doc" :size="12" /> 복사</span>
                <span>{{ usage(m.text) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 대화 없음: 디폴트 안내 (설계서 8) -->
        <div class="chat-scroll chat-welcome" v-else>
          <div class="sq sq-navy sq-lg cw-ic">{{ agent.name.slice(0, 1) }}</div>
          <div class="cw-title">{{ agent.name }}</div>
          <div class="cw-desc">{{ agent.desc }}</div>
          <div class="cw-hint">새로운 채팅을 시작해 보세요. 아래 추천 질문으로 바로 시작할 수 있어요.</div>
          <div class="cw-chips">
            <button v-for="s in suggestions" :key="s" class="chip" @click="send(s)">{{ s }}</button>
          </div>
        </div>

        <!-- 추천 질문 (첫 대화) -->
        <div class="chips" v-if="conv && msgs.length <= 1">
          <button v-for="s in suggestions" :key="s" class="chip" @click="send(s)">{{ s }}</button>
        </div>

        <!-- 입력 + 하단 툴바 -->
        <div class="chat-input">
          <input v-model="input" :placeholder="`${agent.name}에게 요청하세요`" aria-label="메시지 입력"
            @keydown.enter="send()" :disabled="busy" />
          <button class="send-btn" :disabled="busy || !input.trim()" @click="send()" aria-label="전송">
            <Icon name="send" :size="17" />
          </button>
        </div>
        <div class="ci-tools">
          <button v-for="t in inputTools" :key="t.icon" class="ci-tool" :title="t.label" :aria-label="t.label"><Icon :name="t.icon" :size="16" /></button>
          <span style="flex:1"></span>
          <button class="ci-quick" title="문서·컨텍스트 추가"><Icon name="doc" :size="15" /></button>
          <button class="ci-quick" title="에이전트 전환"><Icon name="bot" :size="15" /></button>
        </div>
      </div>

      <!-- ③ 인사이트 패널 (접기 가능) -->
      <aside class="insight" v-if="showInsight">
        <div class="card insight-card">
          <div class="insight-title">AGENT 정보</div>
          <div class="insight-row"><span class="k">소유</span><span class="v">{{ agent.owner }}</span></div>
          <div class="insight-row"><span class="k">권한 모델</span><span class="v">ABAC</span></div>
          <div class="insight-row"><span class="k">내 권한</span><StatusPill :perm="agent.perm === 'owner' ? 'owner' : agent.perm" small /></div>
        </div>

        <div class="card insight-card">
          <div class="insight-title">사용 인사이트</div>
          <div class="insight-stat">
            <div class="stat-box"><div class="n">{{ agent.runs.toLocaleString() }}</div><div class="l">누적 실행</div></div>
            <div class="stat-box"><div class="n">{{ msgs.filter(m => m.role === 'user').length }}</div><div class="l">이번 세션 질문</div></div>
          </div>
        </div>

        <div class="card insight-card">
          <div class="insight-title">연결 지식 (RAG)</div>
          <div v-for="k in linkedKnowledge" :key="k.id" class="insight-kn">
            <div class="sq sq-green sq-sm" style="width:28px;height:28px;font-size:11px">{{ k.name.slice(0, 1) }}</div>
            <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ k.name }}</span>
            <span style="font-size:11px;color:var(--gray-lt)">{{ k.docs.toLocaleString() }}건</span>
          </div>
        </div>

        <div class="card insight-card" v-if="relatedPosts.length">
          <div class="insight-title">관련 가이드 · 사례</div>
          <div v-for="(p, i) in relatedPosts" :key="i" class="insight-post">
            <span class="ic"><Icon name="doc" :size="14" /></span>
            <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ p.title }}</span>
          </div>
        </div>
      </aside>
    </div>

    <!-- 신고 · 개선 요청 팝업 -->
    <ReportModal v-if="showReport" :agent="agent" :messages="msgs" @close="showReport = false" />
  </div>

  <div v-else class="card empty">
    <b>실행할 Agent가 선택되지 않았습니다</b>
    <button class="btn btn-primary btn-sm" style="margin-top:10px" @click="go('agents')">Agent 카탈로그로 이동</button>
  </div>
</template>
