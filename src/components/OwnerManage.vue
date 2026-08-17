<script setup>
/**
 * 담당자(오너) 관리 — 에이전트/지식 공용 · [담당: 공통 개발자]
 * 각 항목의 담당자(오너)를 변경한다. 담당자 퇴사·부서 이동 시 신규 담당자 배정.
 *   <OwnerManage kind="agent" />  |  <OwnerManage kind="knowledge" />
 */
import { ref, computed } from 'vue'
import { store, changeAgentOwner, changeKnowledgeOwner } from '../store.js'
import Icon from './Icon.vue'
import OrgStaffPickerModal from './OrgStaffPickerModal.vue'

const props = defineProps({ kind: { type: String, default: 'agent' } })
const isAgent = computed(() => props.kind === 'agent')
const items = computed(() => (isAgent.value ? store.agents : store.knowledge))

const q = ref('')
const list = computed(() => items.value.filter(x => !q.value.trim() || x.name.toLowerCase().includes(q.value.trim().toLowerCase())))

const editing = ref(null)
function openEdit(it) { editing.value = it }
function onSelect(staff) {
  const fn = isAgent.value ? changeAgentOwner : changeKnowledgeOwner
  fn(editing.value, staff.name, staff.dept)
  editing.value = null
}
</script>

<template>
  <div>
    <div class="del-search">
      <Icon name="search" :size="16" />
      <input v-model="q" class="del-search-in" :placeholder="(isAgent ? '에이전트' : '지식') + '명 검색'" />
      <span class="del-search-n">{{ list.length }}건</span>
    </div>

    <div class="card om-table">
      <div class="om-row om-head">
        <span class="om-c-name">{{ isAgent ? '에이전트' : '지식 컬렉션' }}</span>
        <span class="om-c-owner">소속(조직)</span>
        <span class="om-c-mgr">담당자</span>
        <span class="om-c-act"></span>
      </div>
      <div v-for="it in list" :key="it.id" class="om-row">
        <span class="om-c-name">
          <span class="om-sq" :class="isAgent ? 'sq-navy' : 'sq-green'">{{ it.name.slice(0, 1) }}</span>
          <span class="om-name">{{ it.name }}</span>
        </span>
        <span class="om-c-owner">{{ it.owner }}</span>
        <span class="om-c-mgr"><Icon name="user" :size="13" /> {{ it.manager }}<span class="om-dept" v-if="it.managerDept">· {{ it.managerDept }}</span></span>
        <span class="om-c-act"><button class="btn btn-ghost btn-sm" @click="openEdit(it)"><Icon name="edit" :size="13" /> 담당자 변경</button></span>
      </div>
    </div>

    <!-- 담당자 변경 — 조직별 담당자 조회 공통 팝업 -->
    <OrgStaffPickerModal v-if="editing" :title="(isAgent ? '에이전트' : '지식') + ' 담당자 변경'"
      :current="`${editing.name} — ${editing.manager}${editing.managerDept ? ' · ' + editing.managerDept : ''}`"
      @select="onSelect" @close="editing = null" />
  </div>
</template>

<style scoped>
.del-search { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--card);
  border: 1px solid var(--line-strong); border-radius: var(--r-md); margin: 16px 0 14px; }
.del-search svg { color: var(--gray-lt); }
.del-search-in { flex: 1; border: none; background: none; font-size: 14px; color: var(--ink); outline: none; }
.del-search-n { font-size: 12px; font-weight: 700; color: var(--gray-lt); }

.om-table { padding: 4px 0; }
.om-row { display: grid; grid-template-columns: 1fr 150px 200px 150px; align-items: center; gap: 12px; padding: 11px 18px; }
.om-row + .om-row { border-top: 1px solid var(--line); }
.om-head { font-size: 11.5px; font-weight: 700; color: var(--gray-lt); padding-top: 12px; padding-bottom: 12px; }
.om-head .om-c-name { padding-left: 40px; }
.om-c-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
.om-sq { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
.om-name { font-size: 13.5px; font-weight: 700; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.om-c-owner { font-size: 12.5px; color: var(--gray); }
.om-c-mgr { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; color: var(--ink); }
.om-c-mgr svg { color: var(--navy); }
.om-dept { font-weight: 500; color: var(--gray-lt); margin-left: 2px; }
.om-c-act { text-align: right; }

.om-cur { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--gray);
  background: var(--canvas); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; }
.om-cur svg { color: var(--gray-lt); }
.om-cands { display: flex; flex-wrap: wrap; gap: 6px; }
.om-cand { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--gray);
  background: var(--canvas); border: 1.5px solid var(--line-strong); border-radius: 8px; padding: 6px 10px; cursor: pointer; }
.om-cand small { color: var(--gray-lt); font-weight: 500; }
.om-cand.on { border-color: var(--navy); background: var(--navy-soft); color: var(--navy); }
.om-cand.on small { color: var(--navy); }
.dm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 720px) { .om-row { grid-template-columns: 1fr auto; } .om-c-owner, .om-head .om-c-mgr { display: none; } }
</style>
