<script setup>
import { ref, computed } from 'vue'
import { store, openRequest, cancelRequest, toast } from '../store.js'
import { knowledgeTree } from '../data.js'
import StatusPill from '../components/StatusPill.vue'
import Icon from '../components/Icon.vue'
import KnowledgeTreeNode from '../components/KnowledgeTreeNode.vue'

const q = ref('')
const selected = ref('all')
const view = ref('grid')   // grid(카드) | list

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

function detail(k) { toast(`'${k.name}' 상세(연결 Agent ${k.linked}개)로 이동합니다. (데모)`, 'ok') }
function cancelFor(k) {
  const req = store.requests.find(r => r.mine && r.status === 'pending' && r.targetId === k.id)
  if (req) cancelRequest(req)
}
</script>

<template>
  <div>
    <!-- 통합 검색 (에이전트 카탈로그와 동일하게 상단 고정) -->
    <div class="kn-topbar">
      <div class="search"><Icon name="search" :size="16" /><input v-model="q" placeholder="지식 검색" aria-label="지식 검색" /></div>
    </div>

    <div class="kn-layout">
      <!-- 카테고리 트리 -->
      <aside class="kn-tree">
        <div class="tree-label">카테고리</div>
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
          <div class="kn-crumb">{{ selectedName }} <span class="count">{{ list.length }}건</span></div>
          <div class="view-toggle" role="group" aria-label="보기 방식">
            <button :class="{ on: view === 'grid' }" @click="view = 'grid'" aria-label="카드 보기" title="카드 보기"><Icon name="grid" :size="16" /></button>
            <button :class="{ on: view === 'list' }" @click="view = 'list'" aria-label="리스트 보기" title="리스트 보기"><Icon name="list" :size="16" /></button>
          </div>
        </div>

        <!-- 카드 보기 -->
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
              <button v-if="k.perm === 'granted' || k.perm === 'owner'" class="btn btn-primary btn-sm" @click="detail(k)">상세 보기</button>
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
              <button class="btn btn-primary btn-sm" @click="detail(k)">상세 보기</button>
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

        <div v-else class="card empty"><b>이 카테고리에 지식이 없습니다</b>다른 카테고리를 선택하거나 검색어를 조정해 보세요.</div>
      </div>
    </div>
  </div>
</template>
