<script setup>
import { ref, computed } from 'vue'
import { store, openRequest, cancelRequest, toast } from '../store.js'
import { knowledgeTree } from '../data.js'
import StatusPill from '../components/StatusPill.vue'
import Icon from '../components/Icon.vue'
import KnowledgeTreeNode from '../components/KnowledgeTreeNode.vue'
import KnowledgeChat from '../components/KnowledgeChat.vue'
import DetailModal from '../components/DetailModal.vue'

const q = ref('')
const selected = ref('all')
const view = ref('grid')   // grid(카드) | list
const mode = ref('explore')  // explore(탐색) | chat(지식 채팅)
const chatPreselect = ref([])  // 카드에서 '지식 채팅' 진입 시 미리 선택할 지식 id

// 모드 토글로 채팅 진입(빈 선택으로 시작)
function enterChat() { chatPreselect.value = []; mode.value = 'chat' }
// 카드에서 특정 지식만 선택해 채팅 진입
function chatWith(k) { selected.value = k.category; chatPreselect.value = [k.id]; mode.value = 'chat' }

const scopeLabel = { personal: '개인', team: '팀', dept: '부서', company: '전사' }

// leaf id -> [상위 ... 자신] 경로 (하위 포함 필터링용)
const ancestorMap = {}
function buildAncestors(nodes, trail) {
  for (const n of nodes) {
    const path = [...trail, n.id]
    ancestorMap[n.id] = path
    if (n.children) buildAncestors(n.children, path)
  }
}
buildAncestors(knowledgeTree, [])

const nameMap = {}
function buildNames(nodes) {
  for (const n of nodes) { nameMap[n.id] = n.name; if (n.children) buildNames(n.children) }
}
buildNames(knowledgeTree)

const countLeaf = id => store.knowledge.filter(k => k.category === id).length

// 카운트를 포함한 트리 (하위 카운트 합산)
function augment(nodes) {
  return nodes.map(n => {
    const children = n.children ? augment(n.children) : null
    const count = children ? children.reduce((s, c) => s + c.count, 0) : countLeaf(n.id)
    return { id: n.id, name: n.name, children, count }
  })
}
const tree = computed(() => augment(knowledgeTree))
const totalCount = computed(() => store.knowledge.length)

const inCategory = k => selected.value === 'all' || (ancestorMap[k.category] || []).includes(selected.value)
const list = computed(() =>
  store.knowledge
    .filter(inCategory)
    .filter(k => !q.value.trim() || (k.name + k.desc + k.owner).includes(q.value.trim()))
)
const selectedName = computed(() => selected.value === 'all' ? '전체 지식' : (nameMap[selected.value] || '지식'))

// 지식 채팅 대상 = 선택 컬렉션의 '내 지식'(보유/소유)
const myKnowledge = computed(() => list.value.filter(k => k.perm === 'owner' || k.perm === 'granted'))

// 상세 보기 → 이 지식 컬렉션의 문서 목록 팝업 (지식명·등록일자·버전·등록자·등록부서)
const docDetail = ref(null)
const KN_REGISTRANTS = ['김지훈', '이서연', '박민수', '최유진', '정우성', '한소희', '오지원', '강태석']
const KN_DESCRIPTORS = ['개요', '상세 규정', '개정 이력', '적용 지침', 'FAQ', '예외 사항', '용어 정의', '참조 표', '체크리스트', '변경 이력', '요약본', '부록']
function openDetail(k) {
  const n = Math.min(k.docs, 12)
  const rows = []
  for (let i = 0; i < n; i++) {
    const mm = String(Math.max(1, 7 - Math.floor(i / 4))).padStart(2, '0')
    const dd = String(28 - (i % 4) * 6).padStart(2, '0')
    rows.push([
      `${k.name} · ${KN_DESCRIPTORS[i % KN_DESCRIPTORS.length]}`,
      `2026-${mm}-${dd}`,
      `v1.${i % 6}`,
      KN_REGISTRANTS[i % KN_REGISTRANTS.length],
      k.owner,
    ])
  }
  docDetail.value = {
    title: k.name,
    sub: `${scopeLabel[k.scope]} 공개 · 소유 ${k.owner} · 문서 ${k.docs.toLocaleString()}건 (최근 ${n}건)`,
    cols: ['지식명', '등록 일자', '버전', '등록자', '등록 부서'],
    rows,
  }
}
function cancelFor(k) {
  const req = store.requests.find(r => r.mine && r.status === 'pending' && r.targetId === k.id)
  if (req) cancelRequest(req)
}
</script>

<template>
  <div>
    <!-- 통합 검색 + 모드(탐색/지식 채팅) -->
    <div class="kn-topbar">
      <div class="search"><Icon name="search" :size="16" /><input v-model="q" placeholder="지식 검색" aria-label="지식 검색" /></div>
      <div class="kn-mode" role="group" aria-label="모드">
        <button :class="{ on: mode === 'explore' }" @click="mode = 'explore'"><Icon name="grid" :size="14" /> 탐색</button>
        <button :class="{ on: mode === 'chat' }" @click="enterChat"><Icon name="chat" :size="14" /> 지식 채팅</button>
      </div>
    </div>

    <div class="kn-layout">
      <!-- 컬렉션 트리 -->
      <aside class="kn-tree">
        <div class="tree-label">컬렉션</div>
        <div class="tree-scroll">
          <div class="tree-row root" :class="{ on: selected === 'all' }" @click="selected = 'all'">
            <span class="tree-caret ghost"></span>
            <Icon name="book" :size="14" class="tree-ic" />
            <span class="tree-name">전체 지식</span>
            <span class="tree-count">{{ totalCount }}</span>
          </div>
          <KnowledgeTreeNode v-for="n in tree" :key="n.id" :node="n" :selected-id="selected" @select="selected = $event" />
        </div>
      </aside>

      <!-- 지식 목록 -->
      <div class="kn-main">
        <div class="kn-toolbar">
          <div class="kn-crumb">{{ selectedName }}
            <span class="count" v-if="mode === 'explore'">{{ list.length }}건</span>
            <span class="count" v-else>지식 채팅 · 내 지식 {{ myKnowledge.length }}건</span>
          </div>
          <div class="view-toggle" role="group" aria-label="보기 방식" v-if="mode === 'explore'">
            <button :class="{ on: view === 'grid' }" @click="view = 'grid'" aria-label="카드 보기" title="카드 보기"><Icon name="grid" :size="16" /></button>
            <button :class="{ on: view === 'list' }" @click="view = 'list'" aria-label="리스트 보기" title="리스트 보기"><Icon name="list" :size="16" /></button>
          </div>
        </div>

        <!-- 지식 채팅 모드 -->
        <KnowledgeChat v-if="mode === 'chat'" :items="myKnowledge" :collection="selectedName" :preselect="chatPreselect" />

        <!-- 탐색: 카드/리스트 -->
        <template v-if="mode === 'explore'">
        <div v-if="view === 'grid' && list.length" class="kn-cards">
          <div v-for="k in list" :key="k.id" class="card kn-card">
            <div class="kn-card-top">
              <div class="sq sq-green">{{ k.name.slice(0, 1) }}</div>
              <div style="flex:1;min-width:0">
                <div class="kn-card-name">{{ k.name }} <span class="scope-tag">{{ scopeLabel[k.scope] }}</span></div>
                <div class="kn-card-owner">{{ k.owner }}</div>
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
              <span class="grow"></span>
              <template v-if="k.perm === 'granted' || k.perm === 'owner'">
                <button class="btn btn-ghost btn-sm" @click="openDetail(k)">상세 보기</button>
                <button class="btn btn-primary btn-sm" @click="chatWith(k)"><Icon name="chat" :size="12" /> 지식 채팅</button>
              </template>
              <button v-else-if="k.perm === 'pending'" class="btn btn-ghost btn-sm" @click="cancelFor(k)">요청 취소</button>
              <button v-else class="btn btn-gray btn-sm" @click="openRequest('knowledge', k)">{{ k.perm === 'denied' ? '재요청' : '권한 요청' }}</button>
            </div>
          </div>
        </div>

        <!-- 리스트 보기 -->
        <div v-else-if="view === 'list' && list.length" class="card">
          <div v-for="k in list" :key="k.id" class="kn-row">
            <div class="sq sq-green">{{ k.name.slice(0, 1) }}</div>
            <div class="kn-body">
              <div class="kn-name">{{ k.name }} <span class="scope-tag">{{ scopeLabel[k.scope] }}</span></div>
              <div class="kn-meta">{{ k.desc }} · 소유 {{ k.owner }}</div>
              <div class="kn-meta">문서 {{ k.docs.toLocaleString() }}건 · 연결 Agent {{ k.linked }} · 최신화 {{ k.updated }}</div>
            </div>
            <StatusPill :perm="k.perm" />
            <template v-if="k.perm === 'granted' || k.perm === 'owner'">
              <button class="btn btn-ghost btn-sm" @click="openDetail(k)">상세 보기</button>
              <button class="btn btn-primary btn-sm" @click="chatWith(k)"><Icon name="chat" :size="12" /> 지식 채팅</button>
            </template>
            <template v-else-if="k.perm === 'pending'">
              <button class="btn btn-ghost btn-sm" @click="cancelFor(k)">요청 취소</button>
            </template>
            <template v-else>
              <button class="btn btn-gray btn-sm" @click="openRequest('knowledge', k)">
                {{ k.perm === 'denied' ? '재요청' : '권한 요청' }}
              </button>
            </template>
          </div>
        </div>

        <div v-else class="card empty"><b>이 컬렉션에 지식이 없습니다</b>다른 컬렉션을 선택하거나 검색어를 조정해 보세요.</div>
        </template>
      </div>
    </div>

    <!-- 상세 보기: 문서 목록 팝업 -->
    <DetailModal v-if="docDetail" :detail="docDetail" @close="docDetail = null" />
  </div>
</template>
