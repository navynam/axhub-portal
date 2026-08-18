<script setup>
/**
 * 지식관리 — 에이전트 카탈로그식 재구성.
 * -----------------------------------------------------------------------------
 * 좌측 트리 제거 → 탭(사용가능 지식 / 전체 지식) + 폴더 바(+새 폴더·폴더 이동) + 카드 그리드.
 * 지식 검색·상세 보기·지식 채팅. (지식 등록/요청은 문서 관리 → 지식 등록 파이프라인에서 처리)
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { store, openRequest, cancelRequest } from '../store.js'
import StatusPill from '../components/StatusPill.vue'
import Icon from '../components/Icon.vue'
import KnowledgeChat from '../components/KnowledgeChat.vue'
import DetailModal from '../components/DetailModal.vue'

const q = ref('')
const tab = ref('usable')        // usable(사용가능) | all(전체)
const view = ref('grid')         // grid | list
const mode = ref('explore')      // explore | chat
const folderFilter = ref('all')
const chatPreselect = ref([])

const scopeLabel = { personal: '개인', team: '팀', dept: '부서', company: '전사' }

// 그룹 = 전사 지식 그룹(권한 관리 › 그룹 관리에서 생성·관리)
const groupOf = k => k.group || '미분류'
const folderList = computed(() => {
  const set = new Set(store.knGroups)
  store.knowledge.forEach(k => { if (k.group) set.add(k.group) })
  return [{ id: 'all', name: '전체' }, ...[...set].map(g => ({ id: g, name: g }))]
})
const folderName = k => groupOf(k)

// 탭 기준 목록
const isUsable = k => k.perm === 'owner' || k.perm === 'granted'
const base = computed(() => tab.value === 'usable' ? store.knowledge.filter(isUsable) : store.knowledge)
const tabCount = t => (t === 'usable' ? store.knowledge.filter(isUsable).length : store.knowledge.length)
function folderCount(fid) { return fid === 'all' ? base.value.length : base.value.filter(k => groupOf(k) === fid).length }

const list = computed(() => base.value
  .filter(k => folderFilter.value === 'all' || groupOf(k) === folderFilter.value)
  .filter(k => !q.value.trim() || (k.name + k.desc + k.owner).includes(q.value.trim())))

// 지식 채팅 대상 = 사용가능(보유/소유) 지식
const myKnowledge = computed(() => list.value.filter(isUsable))
const collectionName = computed(() => folderFilter.value === 'all'
  ? (tab.value === 'usable' ? '사용가능 지식' : '전체 지식')
  : (folderList.value.find(f => f.id === folderFilter.value) || {}).name || '지식')

function enterChat() { chatPreselect.value = []; mode.value = 'chat' }
function chatWith(k) { chatPreselect.value = [k.id]; mode.value = 'chat' }
function goExplore() { mode.value = 'explore' }

// 지식 채팅 모드: 바깥 스크롤 없이 채우기(App 의 content-scroll 제어)
watch(mode, m => { store.knChatOpen = m === 'chat' })
onBeforeUnmount(() => { store.knChatOpen = false })


function cancelFor(k) {
  const req = store.requests.find(r => r.mine && r.status === 'pending' && r.targetId === k.id)
  if (req) cancelRequest(req)
}

// 상세 보기 (문서 목록)
const docDetail = ref(null)
const KN_REGISTRANTS = ['김지훈', '이서연', '박민수', '최유진', '정우성', '한소희', '오지원', '강태석']
const KN_DESCRIPTORS = ['개요', '상세 규정', '개정 이력', '적용 지침', 'FAQ', '예외 사항', '용어 정의', '참조 표', '체크리스트', '변경 이력', '요약본', '부록']
function openDetail(k) {
  const added = (k.addedDocs || []).map(d => [`${d.docName}  ${d.suspended ? '⛔ 사용중지' : '🆕'}`, d.registeredAt, d.version, d.registrant, d.dept])
  const genN = Math.max(0, Math.min(12 - added.length, (k.docs || 0) - added.length))
  const gen = []
  for (let i = 0; i < genN; i++) {
    const mm = String(Math.max(1, 7 - Math.floor(i / 4))).padStart(2, '0')
    const dd = String(28 - (i % 4) * 6).padStart(2, '0')
    gen.push([`${k.name} · ${KN_DESCRIPTORS[i % KN_DESCRIPTORS.length]}`, `2026-${mm}-${dd}`, `v1.${i % 6}`, KN_REGISTRANTS[i % KN_REGISTRANTS.length], k.owner])
  }
  docDetail.value = {
    title: k.name,
    sub: `${scopeLabel[k.scope]} 공개 · 소유 ${k.owner} · 문서 ${k.docs.toLocaleString()}건${added.length ? ` · 신규 ${added.length}건` : ''}`,
    cols: ['지식명', '등록 일자', '버전', '등록자', '등록 부서'],
    rows: [...added, ...gen],
  }
}
</script>

<template>
  <div :class="{ 'kn-fill': mode === 'chat' }">
    <!-- 상단 툴바 (에이전트·도구와 공통) -->
    <div class="ptb">
      <div class="ptb-tabs" role="tablist">
        <button role="tab" :class="{ on: tab === 'usable' && mode === 'explore' }" @click="tab = 'usable'; mode = 'explore'">사용가능 지식<span class="ptb-tn">{{ tabCount('usable') }}</span></button>
        <button role="tab" :class="{ on: tab === 'all' && mode === 'explore' }" @click="tab = 'all'; mode = 'explore'">전체 지식<span class="ptb-tn">{{ tabCount('all') }}</span></button>
      </div>

      <div class="ptb-filters">
        <label class="ptb-search">
          <Icon name="search" :size="16" />
          <input v-model="q" placeholder="지식 검색 (이름·설명·소유)" aria-label="지식 검색" />
          <button v-if="q" class="ptb-x" @click="q = ''" aria-label="검색어 지우기"><Icon name="x" :size="13" /></button>
        </label>
        <div class="ptb-view" role="group" aria-label="보기 방식" v-if="mode === 'explore'">
          <button :class="{ on: view === 'grid' }" @click="view = 'grid'" aria-label="카드 보기" title="카드 보기"><Icon name="grid" :size="16" /></button>
          <button :class="{ on: view === 'list' }" @click="view = 'list'" aria-label="리스트 보기" title="리스트 보기"><Icon name="list" :size="16" /></button>
        </div>
        <span style="flex:1"></span>
        <button class="btn btn-primary kn-chatcta" @click="mode === 'chat' ? goExplore() : enterChat()">
          <Icon name="chat" :size="18" /> {{ mode === 'chat' ? '탐색으로 돌아가기' : '전체 지식으로 채팅' }}
        </button>
      </div>

      <div class="ptb-chipbar" role="group" aria-label="그룹" v-if="mode === 'explore'">
        <button v-for="f in folderList" :key="f.id" class="ptb-chip" :class="{ on: folderFilter === f.id }" @click="folderFilter = f.id">
          <Icon :name="f.id === 'all' ? 'grid' : 'folder'" :size="13" />{{ f.name }}<span class="ptb-fn">{{ folderCount(f.id) }}</span>
        </button>
      </div>
    </div>

    <!-- 지식 채팅 -->
    <template v-if="mode === 'chat'">
      <div class="kn-crumb" style="margin:14px 0 12px">
        <button class="btn btn-ghost btn-sm" @click="goExplore"><Icon name="back" :size="14" /> 목록</button>
        <span style="margin-left:10px">지식 채팅 · 대상 {{ myKnowledge.length }}건 ({{ collectionName }})</span>
      </div>
      <KnowledgeChat :items="myKnowledge" :collection="collectionName" :preselect="chatPreselect" />
    </template>

    <!-- 탐색: 카드/리스트 -->
    <template v-else>
      <div class="kn-count">{{ collectionName }} <span>{{ list.length }}건</span></div>

      <div v-if="view === 'grid' && list.length" class="kn-cards">
        <div v-for="k in list" :key="k.id" class="card kn-card">
          <div class="kn-card-top">
            <div class="sq sq-green">{{ k.name.slice(0, 1) }}</div>
            <div style="flex:1;min-width:0">
              <div class="kn-card-name">{{ k.name }} <span class="scope-tag">{{ scopeLabel[k.scope] }}</span></div>
              <div class="kn-card-owner">{{ k.owner }}</div>
            </div>
            <div class="kn-fwrap">
              <span class="kn-fbtn static" :title="`그룹: ${folderName(k)}`">
                <Icon name="folder" :size="12" /><span>{{ folderName(k) }}</span>
              </span>
            </div>
          </div>
          <div class="kn-card-desc">{{ k.desc }}</div>
          <div class="kn-card-meta">
            <span><Icon name="doc" :size="12" /> 문서 {{ k.docs.toLocaleString() }}</span>
            <span>연결 Agent {{ k.linked }}</span>
            <span>최신화 {{ k.updated }}</span>
          </div>
          <div class="kn-card-actions">
            <StatusPill :perm="k.perm" small />
            <div class="kn-card-btns">
              <button class="btn btn-ghost btn-sm" @click="openDetail(k)">상세 보기</button>
              <button v-if="k.perm === 'granted' || k.perm === 'owner'" class="btn btn-primary btn-sm" @click="chatWith(k)"><Icon name="chat" :size="12" /> 지식 채팅</button>
              <button v-else-if="k.perm === 'pending'" class="btn btn-ghost btn-sm" @click="cancelFor(k)">요청 취소</button>
              <button v-else class="btn btn-gray btn-sm" @click="openRequest('knowledge', k)">{{ k.perm === 'denied' ? '재요청' : '권한 요청' }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 리스트 -->
      <div v-else-if="view === 'list' && list.length" class="card">
        <div v-for="k in list" :key="k.id" class="kn-row">
          <div class="sq sq-green">{{ k.name.slice(0, 1) }}</div>
          <div class="kn-body">
            <div class="kn-name">{{ k.name }} <span class="scope-tag">{{ scopeLabel[k.scope] }}</span></div>
            <div class="kn-meta">{{ k.desc }} · 소유 {{ k.owner }} · 📁 {{ folderName(k) }}</div>
            <div class="kn-meta">문서 {{ k.docs.toLocaleString() }}건 · 연결 Agent {{ k.linked }} · 최신화 {{ k.updated }}</div>
          </div>
          <StatusPill :perm="k.perm" />
          <button class="btn btn-ghost btn-sm" @click="openDetail(k)">상세 보기</button>
          <button v-if="k.perm === 'granted' || k.perm === 'owner'" class="btn btn-primary btn-sm" @click="chatWith(k)"><Icon name="chat" :size="12" /> 지식 채팅</button>
          <button v-else-if="k.perm === 'pending'" class="btn btn-ghost btn-sm" @click="cancelFor(k)">요청 취소</button>
          <button v-else class="btn btn-gray btn-sm" @click="openRequest('knowledge', k)">{{ k.perm === 'denied' ? '재요청' : '권한 요청' }}</button>
        </div>
      </div>

      <div v-else class="card empty">
        <b>{{ tab === 'usable' ? '사용가능한 지식이 없습니다' : '조건에 맞는 지식이 없습니다' }}</b>
        {{ folderFilter !== 'all' || q ? '다른 그룹·검색어를 선택해 보세요.' : '전체 지식 탭에서 권한을 신청해 보세요.' }}
      </div>
    </template>

    <DetailModal v-if="docDetail" :detail="docDetail" @close="docDetail = null" />
  </div>
</template>
