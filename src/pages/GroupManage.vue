<script setup>
/**
 * 그룹 관리 (권한 관리 하위) — 전사 에이전트/지식 그룹을 관리자가 관리.
 * 3분할: [그룹 리스트] → [선택 그룹의 멤버] → [전체 목록]
 *  · 전체 목록에서 카드를 드래그(또는 + 추가)해 선택 그룹에 담고, 멤버에서 ×로 제외.
 *  · 여기서 만든 그룹이 에이전트/지식 화면의 그룹(폴더) 필터가 된다.
 */
import { ref, computed } from 'vue'
import { store, addAgentGroup, moveAgentToFolder, removeAgentFromGroup, addKnGroup, moveKnowledgeToFolder, removeKnowledgeFromGroup } from '../store.js'
import Icon from '../components/Icon.vue'
import PromptDialog from '../components/PromptDialog.vue'

const tab = ref('agent') // agent | knowledge

const groups = computed(() => (tab.value === 'agent' ? store.agentGroups : store.knGroups))
const allItems = computed(() => (tab.value === 'agent' ? store.agents : store.knowledge))
const memberField = it => (tab.value === 'agent' ? it.folder : it.group)
const membersOf = g => allItems.value.filter(it => memberField(it) === g)
const groupCount = g => membersOf(g).length

const selected = ref('')
const selValid = computed(() => selected.value && groups.value.includes(selected.value))
// 탭 전환/그룹 생성 시 유효 그룹 자동 선택
function ensureSelected() { if (!selValid.value) selected.value = groups.value[0] || '' }

function switchTab(t) { tab.value = t; selected.value = groups.value[0] || '' }

function assign(it) {
  if (!selValid.value) return
  if (tab.value === 'agent') moveAgentToFolder(it, selected.value)
  else moveKnowledgeToFolder(it, selected.value)
}
function remove(it) {
  if (tab.value === 'agent') removeAgentFromGroup(it)
  else removeKnowledgeFromGroup(it)
}
const inSelected = it => selValid.value && memberField(it) === selected.value

// 드래그: 전체 목록 → 선택 그룹 멤버 영역
const dragId = ref(null)
const overDrop = ref(false)
function onDragStart(id, e) { dragId.value = id; e.dataTransfer.effectAllowed = 'move' }
function onDropToGroup() {
  overDrop.value = false
  const it = allItems.value.find(x => x.id === dragId.value); dragId.value = null
  if (it) assign(it)
}

// 새 그룹
const showNew = ref(false)
function createGroup(name) {
  const g = tab.value === 'agent' ? addAgentGroup(name) : addKnGroup(name)
  showNew.value = false
  if (g) selected.value = g
}

ensureSelected()
</script>

<template>
  <div>
    <div class="seg-tabs" role="tablist">
      <button role="tab" :class="{ on: tab === 'agent' }" @click="switchTab('agent')"><Icon name="agent" :size="14" /> 에이전트 그룹</button>
      <button role="tab" :class="{ on: tab === 'knowledge' }" @click="switchTab('knowledge')"><Icon name="book" :size="14" /> 지식 그룹</button>
    </div>

    <p class="gm-lead">전사 {{ tab === 'agent' ? '에이전트' : '지식' }} 그룹을 관리합니다. 그룹을 선택하고 <b>전체 목록</b>에서 카드를 드래그하거나 <b>+ 추가</b>해 그룹에 담으세요. 여기서 만든 그룹이 {{ tab === 'agent' ? '에이전트' : '지식' }} 화면의 그룹 필터가 됩니다.</p>

    <div class="gm3">
      <!-- ① 그룹 리스트 -->
      <div class="gm-col">
        <div class="gm-colh"><span>그룹</span><button class="btn btn-primary btn-xs" @click="showNew = true"><Icon name="plus" :size="12" /> 새 그룹</button></div>
        <div class="gm-list">
          <button v-for="g in groups" :key="g" class="gm-gitem" :class="{ on: selected === g }" @click="selected = g">
            <Icon name="folder" :size="14" /><span class="gm-gname">{{ g }}</span><span class="gm-n">{{ groupCount(g) }}</span>
          </button>
          <div v-if="!groups.length" class="gm-empty">그룹이 없습니다. ‘새 그룹’으로 만들어 보세요.</div>
        </div>
      </div>

      <!-- ② 선택 그룹의 멤버 -->
      <div class="gm-col">
        <div class="gm-colh"><span>{{ selValid ? selected : '그룹 선택' }} <em v-if="selValid">· {{ membersOf(selected).length }}</em></span></div>
        <div class="gm-drop" :class="{ over: overDrop }"
          @dragover.prevent="overDrop = selValid" @dragleave="overDrop = false" @drop="onDropToGroup">
          <template v-if="selValid">
            <div v-for="it in membersOf(selected)" :key="it.id" class="gm-chip">
              <span class="gm-sq" :class="tab === 'agent' ? 'sq-navy' : 'sq-green'">{{ it.name.slice(0, 1) }}</span>
              <div class="gm-chip-body"><div class="gm-chip-name">{{ it.name }}</div><div class="gm-chip-sub">{{ it.owner }} · 담당 {{ it.manager }}</div></div>
              <button class="gm-x" @click="remove(it)" title="그룹에서 제외"><Icon name="x" :size="13" /></button>
            </div>
            <div v-if="!membersOf(selected).length" class="gm-empty drop">여기로 드래그하거나 오른쪽에서 <b>+ 추가</b></div>
          </template>
          <div v-else class="gm-empty">왼쪽에서 그룹을 선택하세요.</div>
        </div>
      </div>

      <!-- ③ 전체 목록 -->
      <div class="gm-col">
        <div class="gm-colh"><span>전체 {{ tab === 'agent' ? '에이전트' : '지식' }} · {{ allItems.length }}</span></div>
        <div class="gm-list scroll">
          <div v-for="it in allItems" :key="it.id" class="gm-chip" :class="{ dim: inSelected(it) }" draggable="true" @dragstart="onDragStart(it.id, $event)">
            <span class="gm-sq" :class="tab === 'agent' ? 'sq-navy' : 'sq-green'">{{ it.name.slice(0, 1) }}</span>
            <div class="gm-chip-body">
              <div class="gm-chip-name">{{ it.name }}</div>
              <div class="gm-chip-sub"><span class="gm-tag" v-if="memberField(it) && memberField(it) !== '미분류'">{{ memberField(it) }}</span><span v-else class="gm-tag none">미분류</span></div>
            </div>
            <button v-if="inSelected(it)" class="gm-added" disabled><Icon name="check" :size="13" /> 담김</button>
            <button v-else class="gm-add" :disabled="!selValid" @click="assign(it)" title="선택 그룹에 추가"><Icon name="plus" :size="13" /> 추가</button>
          </div>
        </div>
      </div>
    </div>

    <PromptDialog v-if="showNew" title="새 그룹 만들기" label="그룹 이름"
      :placeholder="tab === 'agent' ? '예: 재무·심사 봇' : '예: 규정·컴플라이언스'" confirm-text="그룹 생성"
      @confirm="createGroup" @close="showNew = false" />
  </div>
</template>

<style scoped>
.gm-lead { font-size: 13px; color: var(--gray); line-height: 1.55; margin: 16px 0 16px; max-width: 96ch; }
.gm-lead b { color: var(--navy); font-weight: 700; }

.gm3 { display: grid; grid-template-columns: 260px 1fr 1fr; gap: 14px; align-items: start; }
.gm-col { display: flex; flex-direction: column; min-width: 0; }
.gm-colh { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12.5px; font-weight: 800; color: var(--ink); padding: 2px 4px 10px; }
.gm-colh em { font-style: normal; color: var(--gray-lt); font-weight: 700; }

.gm-list, .gm-drop { background: var(--canvas); border: 1px solid var(--line); border-radius: var(--r-md); padding: 8px; display: flex; flex-direction: column; gap: 8px; min-height: 360px; }
.gm-list.scroll, .gm-drop { max-height: 620px; overflow-y: auto; }
.gm-drop { border-style: dashed; border-color: var(--line-strong); }
.gm-drop.over { border-color: var(--navy); background: var(--navy-soft); border-style: solid; }

.gm-gitem { display: flex; align-items: center; gap: 8px; padding: 10px 11px; border-radius: 9px; background: var(--card); border: 1px solid var(--line); cursor: pointer; font-size: 13px; font-weight: 700; color: var(--gray); }
.gm-gitem:hover { border-color: var(--line-strong); color: var(--ink); }
.gm-gitem.on { border-color: var(--navy); background: var(--navy-soft); color: var(--navy); }
.gm-gitem svg { color: var(--navy); }
.gm-gname { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gm-n { font-size: 11px; font-weight: 800; color: var(--gray-lt); background: var(--canvas); border: 1px solid var(--line); border-radius: 20px; padding: 1px 7px; }
.gm-gitem.on .gm-n { color: var(--navy); background: #fff; border-color: transparent; }

.gm-chip { display: flex; align-items: center; gap: 10px; padding: 9px 10px; background: var(--card); border: 1px solid var(--line); border-radius: 10px; }
.gm-list.scroll .gm-chip { cursor: grab; }
.gm-list.scroll .gm-chip:active { cursor: grabbing; }
.gm-chip:hover { border-color: var(--line-strong); }
.gm-chip.dim { opacity: .55; }
.gm-sq { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.gm-chip-body { flex: 1; min-width: 0; }
.gm-chip-name { font-size: 13px; font-weight: 750; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gm-chip-sub { font-size: 11px; color: var(--gray-lt); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gm-tag { display: inline-block; font-size: 10.5px; font-weight: 700; color: var(--navy); background: var(--navy-soft); border-radius: 4px; padding: 1px 6px; }
.gm-tag.none { color: var(--gray-lt); background: var(--canvas); border: 1px solid var(--line); }

.gm-x { width: 24px; height: 24px; border-radius: 7px; display: grid; place-items: center; color: var(--gray-lt); flex-shrink: 0; }
.gm-x:hover { background: #FBE9E8; color: var(--red); }
.gm-add, .gm-added { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; border-radius: 7px; padding: 5px 9px; flex-shrink: 0; }
.gm-add { color: var(--navy); border: 1px solid var(--navy-soft); background: var(--navy-soft); }
.gm-add:hover:not(:disabled) { background: var(--navy); color: #fff; }
.gm-add:disabled { opacity: .4; cursor: not-allowed; }
.gm-added { color: var(--green); background: transparent; cursor: default; }

.gm-empty { font-size: 12px; color: var(--gray-lt); text-align: center; padding: 20px 8px; }
.gm-empty.drop { border: 1px dashed var(--line-strong); border-radius: 8px; }
.gm-empty b { color: var(--navy); }

.btn-xs { height: 26px; padding: 0 9px; font-size: 11.5px; }
@media (max-width: 900px) { .gm3 { grid-template-columns: 1fr; } }
</style>
