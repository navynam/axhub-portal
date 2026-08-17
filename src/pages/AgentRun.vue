<script setup>
/**
 * 에이전트 채팅(실행) — 기획/ax-portal-vue 피그마 구현본 디자인 반영.
 * -----------------------------------------------------------------------------
 * 좌: 대화 히스토리(검색 → 새 채팅 → 목록)  ┃  중: 채팅(헤더 + 메시지 + 컴포저)
 * 우측 현황은 앱 공통 HubRail. 기능은 우리 스토어 기준.
 */
import { ref, computed, nextTick, watch } from 'vue'
import {
  store, go, sendMessage, currentConv, newConversation, selectConversation,
  deleteConversation, renameConversation, toast,
} from '../store.js'
import Icon from '../components/Icon.vue'
import ReportModal from '../components/ReportModal.vue'

const agent = computed(() => store.currentAgent)
const conv = computed(() => currentConv())
const msgs = computed(() => conv.value?.msgs || [])
const input = ref('')
const scrollEl = ref(null)
const showReport = ref(false)
const moreOpen = ref(false)

// 좌측 히스토리
const chatQ = ref('')
const menuFor = ref(null)
const history = computed(() => agent.value ? store.conversations.filter(c => c.agentId === agent.value.id) : [])
const filteredHistory = computed(() => {
  const q = chatQ.value.trim()
  return q ? history.value.filter(c => c.title.includes(q)) : history.value
})
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
const suggestions = computed(() => agent.value ? [
  `${agent.value.name.replace(' Agent', '')} 최근 현황 요약해줘`,
  '핵심 지표 3가지만 알려줘',
  '결과를 보고서 초안으로 정리해줘',
] : [])

function send(text) {
  const t = (text ?? input.value).trim()
  if (!t || busy.value) return
  if (!conv.value) newConversation()
  sendMessage(t)
  input.value = ''
}

function meta(text) {
  const out = Math.max(20, Math.round((text || '').length / 3))
  const inp = Math.round(out * 1.2)
  const cost = ((inp + out) * 0.0000012).toFixed(4)
  return { inp, out, cost }
}
function copyMsg(text) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('메시지를 복사했습니다.', 'ok'))
  else toast('복사를 지원하지 않는 환경입니다.', 'warn')
}
function openReport() { moreOpen.value = false; showReport.value = true }

watch(() => msgs.value.map(m => m.text).join('|'), async () => {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
})
</script>

<template>
  <div class="run2" v-if="agent">
    <div class="run2-layout">
      <!-- ① 히스토리 -->
      <aside class="clist">
        <div class="clist-top">
          <label class="clist-search"><Icon name="search" :size="18" /><input v-model="chatQ" placeholder="채팅 검색" aria-label="채팅 검색" /></label>
          <button class="clist-new" @click="startNewChat"><Icon name="plus" :size="16" /> 새 채팅</button>
        </div>
        <div class="clist-items">
          <button v-for="c in filteredHistory" :key="c.id" class="clist-item" :class="{ active: c.id === store.currentConvId }"
            @click="selectConversation(c.id)">
            <span class="clist-txt">
              <span class="clist-title">{{ c.title }}</span>
              <span class="clist-date">{{ c.when }}</span>
            </span>
            <span v-if="c.id === store.currentConvId" class="clist-kebab" @click.stop="toggleMenu(c.id)"><Icon name="dots" :size="16" /></span>
            <div class="clist-menu" v-if="menuFor === c.id" @click.stop>
              <button @click="renameChat(c)"><Icon name="edit" :size="13" /> 이름 변경</button>
              <button class="danger" @click="removeChat(c)"><Icon name="trash" :size="13" /> 삭제</button>
            </div>
          </button>
          <div v-if="!filteredHistory.length" class="clist-empty">
            <b>채팅이 없습니다</b><span>새 채팅을 시작하거나<br>검색어를 입력해 보세요.</span>
          </div>
        </div>
        <div v-if="menuFor" class="clist-scrim" @click="menuFor = null"></div>
      </aside>

      <!-- ② 채팅 -->
      <section class="chat">
        <!-- 헤더 -->
        <div class="chat-head">
          <div class="chat-head-info">
            <h1 class="chat-title">{{ agent.name }}</h1>
            <p class="chat-desc">{{ agent.desc }}</p>
          </div>
          <div class="chat-more-wrap">
            <button class="chat-more" @click="moreOpen = !moreOpen" title="더보기" aria-label="더보기"><Icon name="dots" :size="20" /></button>
            <div v-if="moreOpen" class="chat-more-menu" @click.stop>
              <button @click="openReport"><Icon name="flag" :size="14" /> 오류/개선요청</button>
              <button v-if="agent.perm === 'owner'" @click="moreOpen = false"><Icon name="edit" :size="14" /> 수정</button>
            </div>
            <div v-if="moreOpen" class="chat-more-scrim" @click="moreOpen = false"></div>
          </div>
        </div>

        <!-- 메시지 -->
        <div class="chat-msgs" ref="scrollEl" v-if="conv">
          <template v-for="(m, i) in msgs" :key="i">
            <!-- 사용자 -->
            <div v-if="m.role === 'user'" class="msg-me"><div class="msg-me-bubble">{{ m.text }}</div></div>
            <!-- 에이전트 -->
            <div v-else class="msg-agent">
              <div class="msg-agent-body">
                <span v-if="m.typing" class="typing" aria-label="응답 생성 중"><i></i><i></i><i></i></span>
                <template v-else>{{ m.text }}</template>
              </div>
              <div v-if="!m.typing" class="msg-agent-act">
                <button class="mact" @click="copyMsg(m.text)"><Icon name="copy" :size="16" />복사</button>
                <span class="mact"><Icon name="download" :size="16" />{{ meta(m.text).inp }}</span>
                <span class="mact"><Icon name="upload" :size="16" />{{ meta(m.text).out }}</span>
                <span class="mact"><Icon name="dollar" :size="16" />{{ meta(m.text).cost }}</span>
              </div>
            </div>
          </template>
          <div v-if="msgs.length <= 1" class="chat-sugg">
            <button v-for="s in suggestions" :key="s" @click="send(s)">{{ s }}</button>
          </div>
        </div>

        <!-- 대화 없음 -->
        <div class="chat-msgs chat-welcome" v-else>
          <div class="chat-welcome-ic">{{ agent.name.slice(0, 1) }}</div>
          <div class="chat-welcome-t">{{ agent.name }}</div>
          <div class="chat-welcome-d">{{ agent.desc }}</div>
          <div class="chat-sugg center">
            <button v-for="s in suggestions" :key="s" @click="send(s)">{{ s }}</button>
          </div>
        </div>

        <!-- 컴포저 -->
        <div class="composer">
          <div class="composer-inner">
            <input v-model="input" placeholder="메세지를 입력하세요" aria-label="메시지 입력" @keydown.enter="send()" :disabled="busy" />
            <button class="c-attach" title="파일 첨부"><Icon name="attach" :size="18" /> 파일첨부</button>
            <button class="c-send" :disabled="busy || !input.trim()" @click="send()" aria-label="전송"><Icon name="send" :size="18" /></button>
          </div>
        </div>
      </section>
    </div>

    <ReportModal v-if="showReport" :agent="agent" :messages="msgs" @close="showReport = false" />
  </div>

  <div class="run2 run2-noagent" v-else>
    <div class="chat-welcome-ic">A</div>
    <div class="chat-welcome-t">실행할 에이전트가 선택되지 않았습니다</div>
    <button class="c-send-wide" @click="go('agents')">에이전트 카탈로그로 이동</button>
  </div>
</template>

<style scoped>
/* 기획 피그마 토큰 (라이트) */
.run2{
  --brand:#1a4bf5; --p1:#edf2fa; --p4:#7292e8; --p5:#567eed; --p6:#305ef5;
  --cg2:#afb3b9; --cg3:#889099; --cg4:#6d7580; --cg5:#49515e; --cg6:#393f49; --cg7:#22252b;
  --n1:#f9f9fa; --n2:#f4f5f6; --n3:#edeef0; --n4:#dedfe2; --n6:#babdc0; --c-white:#ffffff;
  --me-bg:#22252b; --me-fg:#ffffff;
  --sans:"Pretendard","Pretendard Variable",-apple-system,"Apple SD Gothic Neo","Malgun Gothic","Segoe UI",system-ui,sans-serif;
  font-family:var(--sans); color:var(--cg7); letter-spacing:-.02em;
  flex:1; min-height:0; display:flex; flex-direction:column;
}
:root[data-theme="dark"] .run2{
  --brand:#5B87FF; --p1:#1B2740; --p4:#4a5f8f; --p5:#5B87FF; --p6:#6AA0FF;
  --cg2:#5A626E; --cg3:#7F8A99; --cg4:#8A93A0; --cg5:#A2ABBA; --cg6:#C7CBD2; --cg7:#EAEDF2;
  --n1:#0F1319; --n2:#1B2129; --n3:#1F2630; --n4:#2A313C; --n6:#3A4353; --c-white:#171C24;
  --me-bg:#E4E7EC; --me-fg:#171C24;
}
.run2 *{box-sizing:border-box}

.run2-layout{display:grid;grid-template-columns:300px 1fr;gap:0;flex:1;min-height:0;
  background:var(--c-white);overflow:hidden}

/* ── 히스토리 ── */
.clist{display:flex;flex-direction:column;gap:24px;padding:24px;background:var(--c-white);border-right:1px solid var(--n4);overflow:hidden;min-height:0}
.clist-top{display:flex;flex-direction:column}
.clist-search{display:flex;align-items:center;gap:8px;height:36px;padding:0 14px;background:var(--c-white);border:1px solid var(--n6);border-radius:8px}
.clist-search svg{color:var(--cg3)}
.clist-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--cg7);font:inherit;font-size:14px}
.clist-search input::placeholder{color:var(--cg3)}
.clist-new{display:flex;align-items:center;justify-content:center;gap:8px;height:36px;margin-top:12px;border:1px solid var(--cg7);border-radius:8px;
  background:transparent;color:var(--cg7);font:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:background .12s}
.clist-new:hover{background:var(--n1)}
.clist-items{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px}
.clist-item{position:relative;display:flex;align-items:flex-start;gap:8px;padding:14px 12px;border-radius:16px;background:transparent;border:0;cursor:pointer;text-align:left;transition:background .12s}
.clist-item:hover{background:var(--n2)}
.clist-item.active{background:var(--p1)}
.clist-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.clist-title{font-size:14px;font-weight:600;line-height:1.4;color:var(--cg7);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.clist-date{font-size:12px;color:var(--cg2)}
.clist-kebab{flex-shrink:0;color:var(--cg4);cursor:pointer;display:grid;place-items:center;width:22px;height:22px;border-radius:5px}
.clist-kebab:hover{background:rgba(0,0,0,.05)}
.clist-menu{position:absolute;right:10px;top:40px;z-index:6;background:var(--c-white);border:1px solid var(--n4);border-radius:8px;
  box-shadow:0 8px 24px rgba(18,28,54,.14);padding:4px;min-width:128px;display:flex;flex-direction:column}
.clist-menu button{display:flex;align-items:center;gap:7px;padding:8px 9px;border:0;background:transparent;color:var(--cg7);font:inherit;font-size:13px;cursor:pointer;border-radius:5px;text-align:left}
.clist-menu button:hover{background:var(--n2)}
.clist-menu button.danger{color:#C8352E}
.clist-scrim{position:fixed;inset:0;z-index:5}
.clist-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:5px;padding:40px 12px;color:var(--cg3)}
.clist-empty b{font-size:13px;color:var(--cg7)}
.clist-empty span{font-size:12px;line-height:1.5}

/* ── 채팅 ── */
.chat{min-width:0;min-height:0;display:flex;flex-direction:column;background:var(--c-white)}
.chat-head{display:flex;align-items:flex-start;gap:24px;padding:24px;border-bottom:1px solid var(--n3)}
.chat-head-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.chat-title{margin:0;font-size:22px;font-weight:700;color:var(--p6);line-height:1.4}
.chat-desc{margin:0;font-size:13px;color:var(--cg3);line-height:1.5}
.chat-more-wrap{position:relative;flex-shrink:0}
.chat-more{color:var(--cg5);background:transparent;border:0;cursor:pointer;padding:2px;display:grid;place-items:center}
.chat-more-menu{position:absolute;right:0;top:32px;z-index:16;background:var(--c-white);border:1px solid var(--n4);border-radius:10px;
  box-shadow:0 10px 28px rgba(18,28,54,.16);padding:5px;min-width:160px;display:flex;flex-direction:column}
.chat-more-menu button{display:flex;align-items:center;gap:8px;padding:9px 10px;border:0;background:transparent;color:var(--cg7);font:inherit;font-size:13px;font-weight:600;cursor:pointer;border-radius:6px;text-align:left}
.chat-more-menu button:hover{background:var(--n2)}
.chat-more-scrim{position:fixed;inset:0;z-index:15}

.chat-msgs{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;justify-content:flex-start;gap:40px;padding:40px 28px 28px;background:var(--n1)}
.msg-me{display:flex;justify-content:flex-end;padding-left:100px}
.msg-me-bubble{background:var(--me-bg);color:var(--me-fg);font-size:15px;font-weight:700;line-height:1.5;padding:10px 20px;border-radius:16px 16px 0 16px;white-space:pre-wrap;word-break:break-word}
.msg-agent{display:flex;flex-direction:column;gap:10px;padding:0 80px 0 20px}
.msg-agent-body{font-size:15px;line-height:1.5;color:var(--cg7);white-space:pre-wrap;word-break:break-word}
.msg-agent-act{display:flex;align-items:center;gap:12px}
.mact{display:inline-flex;align-items:center;gap:3px;font-size:14px;color:var(--cg4);background:transparent;border:0;cursor:default;padding:0}
.mact svg{color:var(--cg4)}
button.mact{cursor:pointer}
button.mact:hover{color:var(--cg6)}
.typing{display:inline-flex;gap:4px;padding:2px 0}
.typing i{width:6px;height:6px;border-radius:50%;background:var(--cg3);animation:blink 1.2s infinite}
.typing i:nth-child(2){animation-delay:.2s} .typing i:nth-child(3){animation-delay:.4s}
@keyframes blink{0%,60%,100%{opacity:.3}30%{opacity:1}}

.chat-sugg{display:flex;flex-wrap:wrap;gap:8px}
.chat-sugg.center{justify-content:center}
.chat-sugg button{border:1px solid var(--n4);background:var(--c-white);color:var(--cg5);font:inherit;font-size:12.5px;font-weight:500;padding:8px 14px;border-radius:999px;cursor:pointer;transition:.12s}
.chat-sugg button:hover{border-color:var(--p5);color:var(--p6)}

.chat-welcome{align-items:center;justify-content:center;text-align:center;gap:8px}
.chat-welcome-ic{width:56px;height:56px;border-radius:12px;background:var(--p1);color:var(--p6);display:grid;place-items:center;font-weight:800;font-size:22px}
.chat-welcome-t{font-size:18px;font-weight:700;color:var(--cg7);margin-top:4px}
.chat-welcome-d{font-size:13px;color:var(--cg3);max-width:52ch}

.composer{padding:0 28px 28px;background:var(--n1);border-bottom:1px solid var(--n3)}
.composer-inner{display:flex;align-items:center;gap:12px;height:56px;padding:0 8px 0 20px;background:var(--c-white);
  border:1px solid var(--p5);border-radius:12px;box-shadow:0 4px 4px rgba(54,92,195,.10)}
.composer-inner input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:15px;color:var(--cg7)}
.composer-inner input::placeholder{color:var(--p5)}
.c-attach{display:flex;align-items:center;gap:4px;height:36px;padding:0 12px;border:1px solid var(--n4);border-radius:96px;
  background:transparent;color:var(--cg4);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.c-send{width:36px;height:36px;flex-shrink:0;border:0;border-radius:100px;background:var(--p6);color:#fff;display:grid;place-items:center;cursor:pointer}
.c-send:hover{background:#2650d6}
.c-send:disabled{opacity:.45;cursor:not-allowed}

/* 에이전트 미선택 */
.run2-noagent{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;
  padding:64px 24px;background:var(--c-white);border:1px solid var(--n4);border-radius:12px}
.c-send-wide{border:0;background:var(--p6);color:#fff;font:inherit;font-size:14px;font-weight:600;padding:10px 18px;border-radius:8px;cursor:pointer}

@media (max-width:920px){ .run2-layout{grid-template-columns:1fr;height:auto} .clist{border-right:0;border-bottom:1px solid var(--n4);max-height:280px} }
@media (prefers-reduced-motion:reduce){ .typing i{animation:none} }
</style>
