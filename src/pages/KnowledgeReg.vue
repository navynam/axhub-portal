<script setup>
/**
 * 지식 관리 — 상위 모드로 '지식 등록'과 '지식 사용중지'를 분리.
 *  · 등록: 지식 담당자가 승인된 문서(복수)를 컬렉션(단일/복수)에 등록 요청 → 최종 승인 시 지식으로 등록
 *  · 사용중지: 문서 삭제 승인 건을 지식 담당자가 사용중지 요청 → 컬렉션 승인자 승인 시 사용중지
 */
import { ref, computed } from 'vue'
import { store, go, submitKnowledgeReg, approveKnowledgeReg, rejectKnowledgeReg, collectionName, docName,
  requestKnowledgeSuspend, requestKnowledgeSuspendDirect, approveKnowledgeSuspend, rejectKnowledgeSuspend, delStatusLabel, delStatusCls } from '../store.js'
import Icon from '../components/Icon.vue'
import BaseModal from '../components/BaseModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const scopeLabel = { personal: '개인', team: '팀', dept: '부서', company: '전사' }

// ── 상위 모드: 지식 등록 | 지식 사용중지 ──
const mode = ref('add')

/* ═══════════ 등록 모드 ═══════════ */
const addTabs = [
  { key: 'docs', label: '지식화 대기 문서' },
  { key: 'review', label: '승인 대기' },
  { key: 'done', label: '완료' },
]
const addTab = ref('docs')
const approvedDocs = computed(() => store.documents.filter(d => d.status === 'approved'))
const pendingRegs = computed(() => store.knowledgeRegs.filter(r => r.status === 'kn-review'))
const doneRegs = computed(() => store.knowledgeRegs.filter(r => r.status !== 'kn-review'))
const addCount = k => (k === 'docs' ? approvedDocs.value.length : k === 'review' ? pendingRegs.value.length : doneRegs.value.length)

// 문서 선택 + 등록 요청 모달
const sel = ref([])
function toggleDoc(id) { const i = sel.value.indexOf(id); if (i >= 0) sel.value.splice(i, 1); else sel.value.push(id) }
const regModal = ref(false)
const form = ref({ collectionIds: [], version: 'v1.0', scope: 'team', tagsText: '', summary: '', knApprover: '' })
function openReg() {
  if (!sel.value.length) return
  form.value = { collectionIds: [], version: 'v1.0', scope: 'team', tagsText: '', summary: '', knApprover: '이지식 (파트장)' }
  regModal.value = true
}
function toggleColl(id) { const a = form.value.collectionIds; const i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id) }
function submitReg() {
  const tags = form.value.tagsText.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
  const ok = submitKnowledgeReg({ docIds: sel.value, collectionIds: form.value.collectionIds, version: form.value.version, scope: form.value.scope, tags, summary: form.value.summary, knApprover: form.value.knApprover })
  if (ok) { regModal.value = false; sel.value = [] }
}

/* ═══════════ 사용중지 모드 ═══════════ */
const delTabs = [
  { key: 'todo', label: '사용중지 요청' },
  { key: 'review', label: '승인 대기' },
  { key: 'done', label: '완료' },
]
const delTab = ref('todo')
const suspendTodo = computed(() => store.docDeletions.filter(d => d.status === 'del-approved'))
const suspendReview = computed(() => store.docDeletions.filter(d => d.status === 'suspend-review'))
const suspendDone = computed(() => store.docDeletions.filter(d => d.status === 'suspended'))
const delCount = k => (k === 'todo' ? suspendTodo.value.length : k === 'review' ? suspendReview.value.length : suspendDone.value.length)

// 사용중지 직접 요청: 컬렉션별 지식 선택 (지식명 + 기간 검색)
const kQ = ref(''), kFrom = ref(''), kTo = ref('')
const activeKnowledge = computed(() => {
  const rows = []
  store.knowledge.forEach(k => (k.addedDocs || []).forEach(ad => {
    if (ad.suspended) return
    rows.push({ key: k.id + '|' + ad.docName, cid: k.id, cname: k.name, name: ad.docName, registeredAt: ad.registeredAt || '', version: ad.version || '', registrant: ad.registrant || '' })
  }))
  return rows
})
const knSearched = computed(() => activeKnowledge.value
  .filter(r => !kQ.value.trim() || r.name.toLowerCase().includes(kQ.value.trim().toLowerCase()))
  .filter(r => (!kFrom.value || r.registeredAt >= kFrom.value) && (!kTo.value || r.registeredAt <= kTo.value)))
const knByCollection = computed(() => {
  const map = {}
  knSearched.value.forEach(r => { (map[r.cid] = map[r.cid] || { cid: r.cid, cname: r.cname, items: [] }).items.push(r) })
  return Object.values(map)
})
const knSel = ref([])
function toggleKn(key) { const i = knSel.value.indexOf(key); if (i >= 0) knSel.value.splice(i, 1); else knSel.value.push(key) }
function resetKn() { kQ.value = ''; kFrom.value = ''; kTo.value = '' }
const confirmSuspend = ref(false)
function submitDirectSuspend() {
  if (!knSel.value.length) return
  confirmSuspend.value = true
}
function doDirectSuspend() {
  const chosen = activeKnowledge.value.filter(r => knSel.value.includes(r.key))
  if (requestKnowledgeSuspendDirect(chosen)) knSel.value = []
  confirmSuspend.value = false
}

/* ═══════════ 이력 조회 (기간·문서) — 등록/사용중지 '완료' 공용 ═══════════ */
const hFrom = ref(''), hTo = ref(''), hQ = ref('')
function resetHist() { hFrom.value = ''; hTo.value = ''; hQ.value = '' }
function inRange(date) { return (!hFrom.value || date >= hFrom.value) && (!hTo.value || date <= hTo.value) }
function matchQ(text) { return !hQ.value.trim() || text.toLowerCase().includes(hQ.value.trim().toLowerCase()) }
const doneRegsF = computed(() => doneRegs.value.filter(r => inRange(r.createdAt) && matchQ(r.docIds.map(docName).join(' '))))
const suspendDoneF = computed(() => suspendDone.value.filter(d => inRange(d.createdAt) && matchQ(d.docName)))
</script>

<template>
  <div>
    <!-- 상위 모드 -->
    <div class="seg-tabs" role="tablist">
      <button role="tab" :class="{ on: mode === 'add' }" @click="mode = 'add'"><Icon name="book" :size="14" /> 지식 등록</button>
      <button role="tab" :class="{ on: mode === 'del' }" @click="mode = 'del'"><Icon name="lock" :size="14" /> 지식 사용중지</button>
    </div>

    <!-- ════════ 등록 모드 ════════ -->
    <template v-if="mode === 'add'">
      <div class="sub-tabs">
        <button v-for="t in addTabs" :key="t.key" :class="{ on: addTab === t.key }" @click="addTab = t.key">{{ t.label }}<span class="sn">{{ addCount(t.key) }}</span></button>
      </div>
      <p class="kr-lead">승인된 문서를 선택해 <b>지식 컬렉션(1개 또는 여러 개)</b>에 등록 요청하면, 지식 최종 승인자 승인 시 각 컬렉션의 지식으로 등록됩니다.</p>

      <!-- ① 지식화 대기 문서 -->
      <template v-if="addTab === 'docs'">
        <div v-if="approvedDocs.length" class="kr-doclist">
          <label v-for="d in approvedDocs" :key="d.id" class="kr-doc" :class="{ on: sel.includes(d.id) }">
            <input type="checkbox" :checked="sel.includes(d.id)" @change="toggleDoc(d.id)" />
            <span class="kr-check"><Icon v-if="sel.includes(d.id)" name="check" :size="13" /></span>
            <div class="kr-doc-body">
              <div class="kr-doc-name">{{ d.name }}</div>
              <div class="kr-doc-meta">문서 담당 {{ d.docOwner }} · 승인 {{ d.docApprover }} · {{ d.createdAt }}</div>
            </div>
            <span class="kr-doc-desc">{{ d.desc }}</span>
          </label>
        </div>
        <div v-else class="card empty"><b>지식화 대기 문서가 없습니다</b>문서 관리에서 문서가 승인되면 여기에 표시됩니다.</div>
        <div class="kr-selbar" v-if="sel.length">
          <span><b>{{ sel.length }}</b>건 선택됨</span><span class="grow"></span>
          <button class="btn btn-ghost btn-sm" @click="sel = []">선택 해제</button>
          <button class="btn btn-primary btn-sm" @click="openReg"><Icon name="book" :size="14" /> 지식 등록 요청</button>
        </div>
      </template>

      <!-- ②③ 승인 대기 / 완료 -->
      <template v-else>
        <div v-if="addTab === 'done'" class="hist-filter">
          <label class="hf-item"><span class="hf-label">기간</span><input type="date" v-model="hFrom" class="hf-in" /> <span class="hf-tilde">~</span> <input type="date" v-model="hTo" class="hf-in" /></label>
          <label class="hf-item grow"><span class="hf-label">문서</span><input v-model="hQ" class="hf-in wide" placeholder="문서명 검색" /></label>
          <button class="btn btn-ghost btn-sm" @click="resetHist">초기화</button>
        </div>
        <div v-if="(addTab === 'review' ? pendingRegs : doneRegsF).length" class="kr-reglist">
          <div v-for="r in (addTab === 'review' ? pendingRegs : doneRegsF)" :key="r.id" class="card kr-reg">
            <div class="kr-reg-top">
              <div class="kr-reg-title">지식 등록 요청 · {{ r.version }}
                <span class="pill" :class="r.status === 'kn-review' ? 'pill-pending' : r.status === 'registered' ? 'pill-active' : 'pill-denied'">
                  {{ r.status === 'kn-review' ? '지식 승인 대기' : r.status === 'registered' ? '등록 완료' : '반려' }}
                </span>
              </div>
              <div class="kr-reg-meta">지식 담당 {{ r.knOwner }} · 최종 승인 {{ r.knApprover }} · {{ r.createdAt }}</div>
            </div>
            <div class="kr-reg-row"><span class="kr-k">문서 {{ r.docIds.length }}</span><div class="kr-tags"><span v-for="id in r.docIds" :key="id" class="kr-chip doc">{{ docName(id) }}</span></div></div>
            <div class="kr-reg-row"><span class="kr-k">컬렉션 {{ r.collectionIds.length }}</span><div class="kr-tags"><span v-for="cid in r.collectionIds" :key="cid" class="kr-chip coll"><Icon name="book" :size="11" /> {{ collectionName(cid) }}</span></div></div>
            <div class="kr-reg-row"><span class="kr-k">메타</span><div class="kr-tags"><span class="kr-chip">공개 {{ scopeLabel[r.scope] || r.scope }}</span><span v-for="t in r.tags" :key="t" class="kr-chip">#{{ t }}</span></div></div>
            <div class="kr-sum" v-if="r.summary">{{ r.summary }}</div>
            <div class="kr-reg-act">
              <span class="grow"></span>
              <template v-if="r.status === 'kn-review'">
                <span class="kr-role">지식 최종 승인자</span>
                <button class="btn btn-green btn-sm" @click="approveKnowledgeReg(r)">최종 승인 · 등록</button>
                <button class="btn btn-danger btn-sm" @click="rejectKnowledgeReg(r)">반려</button>
              </template>
              <template v-else-if="r.status === 'registered'">
                <span class="kr-role ok"><Icon name="check" :size="13" /> 컬렉션 등록 완료</span>
                <button class="btn btn-ghost btn-sm" @click="go('knowledge')">지식 검색으로</button>
              </template>
              <template v-else><span class="kr-role rej">반려됨</span></template>
            </div>
          </div>
        </div>
        <div v-else class="card empty"><b>{{ addTab === 'review' ? '승인 대기 중인 지식 등록 요청이 없습니다' : '조회된 등록 이력이 없습니다' }}</b>지식화 대기 문서를 선택해 등록 요청해 보세요.</div>
      </template>
    </template>

    <!-- ════════ 사용중지 모드 ════════ -->
    <template v-else>
      <div class="sub-tabs">
        <button v-for="t in delTabs" :key="t.key" :class="{ on: delTab === t.key }" @click="delTab = t.key">{{ t.label }}<span class="sn">{{ delCount(t.key) }}</span></button>
      </div>
      <p class="kr-lead">지식 담당자가 <b>컬렉션별로 지식을 선택</b>해 사용중지 요청하거나, 문서 삭제 승인 건을 사용중지 요청합니다. <b>컬렉션 승인자</b>가 승인하면 지식이 사용중지됩니다.</p>

      <!-- ① 사용중지 요청 -->
      <template v-if="delTab === 'todo'">
        <!-- 지식 직접 선택 (지식명 + 기간 검색) -->
        <div class="hist-filter">
          <label class="hf-item grow"><span class="hf-label">지식명</span><input v-model="kQ" class="hf-in wide" placeholder="지식명 검색" /></label>
          <label class="hf-item"><span class="hf-label">등록기간</span><input type="date" v-model="kFrom" class="hf-in" /> <span class="hf-tilde">~</span> <input type="date" v-model="kTo" class="hf-in" /></label>
          <span class="hf-count">{{ knSearched.length }}건</span>
          <button class="btn btn-ghost btn-sm" @click="resetKn">초기화</button>
        </div>

        <div v-if="knByCollection.length" class="kn-colgroups">
          <div v-for="g in knByCollection" :key="g.cid" class="card kn-colgroup">
            <div class="kcg-head"><Icon name="book" :size="14" /> {{ g.cname }} <span class="kcg-n">{{ g.items.length }}</span></div>
            <label v-for="it in g.items" :key="it.key" class="kcg-item" :class="{ on: knSel.includes(it.key) }">
              <input type="checkbox" :checked="knSel.includes(it.key)" @change="toggleKn(it.key)" />
              <span class="kcg-check"><Icon v-if="knSel.includes(it.key)" name="check" :size="11" /></span>
              <span class="kcg-name">{{ it.name }}</span>
              <span class="kcg-meta">{{ it.registeredAt }} · {{ it.registrant }}</span>
            </label>
          </div>
        </div>
        <div v-else class="card empty"><b>사용중지할 지식이 없습니다</b>지식명·등록기간 조건을 조정해 보세요.</div>

        <!-- 문서 삭제 연계 요청 (del-approved) -->
        <template v-if="suspendTodo.length">
          <div class="kr-sec">문서 삭제 연계 요청</div>
          <div class="kr-reglist">
            <div v-for="del in suspendTodo" :key="del.id" class="card kr-reg">
              <div class="kr-reg-top">
                <div class="kr-reg-title">지식 사용중지 · {{ del.docName }} <span class="pill" :class="delStatusCls[del.status]">{{ delStatusLabel[del.status] }}</span></div>
                <div class="kr-reg-meta">문서 담당 {{ del.docOwner }} · 지식 담당 {{ del.knOwner }} · 삭제 요청 {{ del.createdAt }}</div>
              </div>
              <div class="kr-reg-row"><span class="kr-k">대상 컬렉션 {{ del.collectionIds.length }}</span><div class="kr-tags"><span v-for="cid in del.collectionIds" :key="cid" class="kr-chip coll"><Icon name="book" :size="11" /> {{ collectionName(cid) }}</span></div></div>
              <div class="kr-reg-act"><span class="grow"></span><span class="kr-role">지식 담당자</span>
                <button class="btn btn-primary btn-sm" @click="requestKnowledgeSuspend(del)"><Icon name="lock" :size="13" /> 사용중지 요청</button>
              </div>
            </div>
          </div>
        </template>

        <!-- 선택 바 -->
        <div class="kr-selbar" v-if="knSel.length">
          <span><b>{{ knSel.length }}</b>건 선택됨</span><span class="grow"></span>
          <button class="btn btn-ghost btn-sm" @click="knSel = []">선택 해제</button>
          <button class="btn btn-danger btn-sm" @click="submitDirectSuspend"><Icon name="lock" :size="14" /> 사용중지 요청</button>
        </div>
      </template>

      <!-- ②③ 승인 대기 / 완료 -->
      <template v-else>
        <div v-if="delTab === 'done'" class="hist-filter">
          <label class="hf-item"><span class="hf-label">기간</span><input type="date" v-model="hFrom" class="hf-in" /> <span class="hf-tilde">~</span> <input type="date" v-model="hTo" class="hf-in" /></label>
          <label class="hf-item grow"><span class="hf-label">지식명</span><input v-model="hQ" class="hf-in wide" placeholder="지식명 검색" /></label>
          <button class="btn btn-ghost btn-sm" @click="resetHist">초기화</button>
        </div>
        <div v-if="(delTab === 'review' ? suspendReview : suspendDoneF).length" class="kr-reglist">
          <div v-for="del in (delTab === 'review' ? suspendReview : suspendDoneF)" :key="del.id" class="card kr-reg">
            <div class="kr-reg-top">
              <div class="kr-reg-title">지식 사용중지 · {{ del.docName }} <span class="pill" :class="delStatusCls[del.status]">{{ delStatusLabel[del.status] }}</span></div>
              <div class="kr-reg-meta">
                <template v-if="del.origin === 'direct'">지식 담당자 직접 요청 · {{ del.knOwner }} · {{ del.createdAt }}</template>
                <template v-else>문서 담당 {{ del.docOwner }} · 지식 담당 {{ del.knOwner }} · 삭제 요청 {{ del.createdAt }}</template>
              </div>
            </div>
            <div class="kr-reg-row"><span class="kr-k">대상 컬렉션 {{ del.collectionIds.length }}</span><div class="kr-tags"><span v-for="cid in del.collectionIds" :key="cid" class="kr-chip coll"><Icon name="book" :size="11" /> {{ collectionName(cid) }}</span></div></div>
            <div class="kr-reg-act">
              <span class="grow"></span>
              <template v-if="del.status === 'suspend-review'">
                <span class="kr-role">컬렉션 승인자</span>
                <button class="btn btn-green btn-sm" @click="approveKnowledgeSuspend(del)">사용중지 승인</button>
                <button class="btn btn-danger btn-sm" @click="rejectKnowledgeSuspend(del)">반려</button>
              </template>
              <template v-else>
                <span class="kr-role rej"><Icon name="lock" :size="13" /> 사용중지 완료</span>
                <button class="btn btn-ghost btn-sm" @click="go('knowledge')">지식 검색으로</button>
              </template>
            </div>
          </div>
        </div>
        <div v-else class="card empty"><b>{{ delTab === 'review' ? '승인 대기 중인 사용중지 요청이 없습니다' : '조회된 사용중지 이력이 없습니다' }}</b>사용중지 요청 탭에서 지식을 선택해 요청해 보세요.</div>
      </template>
    </template>

    <!-- 지식 등록 요청 모달 (공통 팝업) -->
    <BaseModal v-if="regModal" title="지식 등록 요청" icon="book"
      :sub="`선택 문서 ${sel.length}건을 아래 컬렉션에 등록 요청합니다. 최종 승인 시 지식으로 등록됩니다.`" @close="regModal = false">
      <div class="krm-field">
        <span class="krm-label">대상 지식 컬렉션 <em>*</em> <small style="font-weight:600;color:var(--gray-lt)">(복수 선택)</small></span>
        <div class="kr-collpick">
          <label v-for="k in store.knowledge" :key="k.id" class="kr-collchip" :class="{ on: form.collectionIds.includes(k.id) }">
            <input type="checkbox" :checked="form.collectionIds.includes(k.id)" @change="toggleColl(k.id)" />
            <Icon v-if="form.collectionIds.includes(k.id)" name="check" :size="12" />{{ k.name }}
          </label>
        </div>
      </div>
      <div class="dm-form-grid">
        <label class="krm-field"><span class="krm-label">버전 <em>*</em></span><input v-model="form.version" class="krm-input" placeholder="예: v1.0" /></label>
        <label class="krm-field"><span class="krm-label">공개 범위</span>
          <select v-model="form.scope" class="select krm-select"><option value="personal">개인</option><option value="team">팀</option><option value="dept">부서</option><option value="company">전사</option></select></label>
      </div>
      <label class="krm-field"><span class="krm-label">태그 <small style="font-weight:600;color:var(--gray-lt)">(쉼표 구분)</small></span><input v-model="form.tagsText" class="krm-input" placeholder="예: 약관, 개정, 지급기준" /></label>
      <label class="krm-field"><span class="krm-label">요약 (지식 메타)</span><textarea v-model="form.summary" class="krm-textarea" placeholder="이 지식이 다루는 내용을 요약해 주세요."></textarea></label>
      <label class="krm-field"><span class="krm-label">지식 최종 승인자</span><input v-model="form.knApprover" class="krm-input" placeholder="예: 이지식 (파트장)" /></label>
      <template #actions>
        <button class="btn btn-ghost" @click="regModal = false">취소</button>
        <button class="btn btn-primary" @click="submitReg"><Icon name="send" :size="14" /> 등록 요청</button>
      </template>
    </BaseModal>

    <!-- 지식 사용중지 요청 확인 (공통 팝업) -->
    <ConfirmDialog v-if="confirmSuspend" title="지식 사용중지 요청" icon="lock"
      :message="`선택한 지식 ${knSel.length}건을 사용중지 요청하시겠습니까?\n컬렉션 승인자 승인 후 사용중지됩니다.`"
      confirm-text="사용중지 요청" tone="danger" @confirm="doDirectSuspend" @close="confirmSuspend = false" />
  </div>
</template>

<style scoped>
/* 서브 탭 */
.sub-tabs { display: flex; align-items: center; gap: 4px; margin: 16px 0 14px; border-bottom: 1px solid var(--line); }
.sub-tabs button { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer;
  padding: 8px 12px; font-size: 13px; font-weight: 700; color: var(--gray-lt); border-bottom: 2px solid transparent; margin-bottom: -1px; }
.sub-tabs button:hover { color: var(--ink); }
.sub-tabs button.on { color: var(--navy); border-bottom-color: var(--navy); }
.sub-tabs .sn { font-size: 11px; font-weight: 800; color: var(--gray-lt); background: var(--canvas); border-radius: 20px; padding: 1px 7px; }
.sub-tabs button.on .sn { color: var(--navy); background: var(--navy-soft); }

.kr-lead { font-size: 13px; color: var(--gray); line-height: 1.55; max-width: 78ch; margin: 0 0 16px; }
.kr-lead b { color: var(--ink); font-weight: 700; }

/* 이력 조회 필터 */
.hist-filter { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 14px; background: var(--card);
  border: 1px solid var(--line); border-radius: var(--r-md); margin-bottom: 14px; }
.hf-item { display: inline-flex; align-items: center; gap: 8px; }
.hf-label { font-size: 11.5px; font-weight: 700; color: var(--gray); }
.hf-in { border: 1px solid var(--line-strong); border-radius: 8px; padding: 6px 9px; font-size: 12.5px; color: var(--ink); background: var(--card); outline: none; }
.hf-in.wide { flex: 1; min-width: 160px; }
.hf-in:focus { border-color: var(--navy); }
.hf-tilde { color: var(--gray-lt); }

/* 문서 선택 목록 */
.kr-doclist { display: flex; flex-direction: column; gap: 8px; margin-bottom: 70px; }
.kr-doc { display: grid; grid-template-columns: 22px 1fr auto; align-items: center; gap: 12px; padding: 14px 16px;
  background: var(--card); border: 1px solid var(--line); border-radius: var(--r-md); cursor: pointer; transition: border-color .12s, background .12s; }
.kr-doc:hover { border-color: var(--line-strong); }
.kr-doc.on { border-color: var(--navy); background: var(--navy-soft); }
.kr-doc input { display: none; }
.kr-check { width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid var(--line-strong); display: grid; place-items: center; color: var(--navy); background: var(--card); }
.kr-doc.on .kr-check { border-color: var(--navy); background: var(--navy-soft); }
.kr-doc-body { min-width: 0; }
.kr-doc-name { font-size: 14px; font-weight: 750; color: var(--ink); }
.kr-doc-meta { font-size: 11.5px; color: var(--gray-lt); margin-top: 3px; }
.kr-doc-desc { font-size: 12px; color: var(--gray); max-width: 260px; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 선택 바 (하단 고정) */
.kr-selbar { position: fixed; left: calc(var(--sidebar-w) + 32px); right: 282px; bottom: 20px; z-index: 30;
  display: flex; align-items: center; gap: 10px; padding: 12px 18px; background: var(--card);
  border: 1px solid var(--line-strong); border-radius: 12px; box-shadow: var(--shadow-hover); font-size: 13px; color: var(--gray); }
.kr-selbar b { color: var(--navy); font-weight: 800; }
.grow { flex: 1; }

/* 요청 카드 */
.kr-reglist { display: flex; flex-direction: column; gap: 12px; }
.kr-reg { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; }
.kr-reg-title { font-size: 15px; font-weight: 800; color: var(--ink); display: flex; align-items: center; gap: 8px; }
.kr-reg-meta { font-size: 11.5px; color: var(--gray-lt); margin-top: 3px; }
.kr-reg-row { display: flex; align-items: flex-start; gap: 10px; }
.kr-k { flex-shrink: 0; width: 90px; font-size: 11.5px; font-weight: 700; color: var(--gray); padding-top: 3px; }
.kr-tags { display: flex; flex-wrap: wrap; gap: 5px; min-width: 0; }
.kr-chip { font-size: 11.5px; font-weight: 600; color: var(--gray); background: var(--canvas); border: 1px solid var(--line); border-radius: 6px; padding: 2px 8px; }
.kr-chip.doc { color: var(--ink); }
.kr-chip.coll { color: var(--navy); background: var(--navy-soft); border-color: transparent; display: inline-flex; align-items: center; gap: 4px; }
.kr-sum { font-size: 12.5px; color: var(--gray); padding: 8px 0 2px; border-top: 1px dashed var(--line); }
.kr-reg-act { display: flex; align-items: center; gap: 8px; padding-top: 10px; border-top: 1px solid var(--line); }
.kr-role { font-size: 11.5px; font-weight: 700; color: var(--gray-lt); }
.kr-role.ok { color: var(--green); display: inline-flex; align-items: center; gap: 4px; }
.kr-role.rej { color: var(--red); display: inline-flex; align-items: center; gap: 4px; }

/* 컬렉션 다중 선택 */
.kr-collpick { display: flex; flex-wrap: wrap; gap: 6px; max-height: 160px; overflow-y: auto; }
.kr-collchip { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--gray);
  background: var(--canvas); border: 1.5px solid var(--line-strong); border-radius: 8px; padding: 6px 10px; cursor: pointer; }
.kr-collchip input { display: none; }
.kr-collchip.on { border-color: var(--navy); background: var(--navy-soft); color: var(--navy); }

.dm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 560px) { .dm-form-grid { grid-template-columns: 1fr; } .kr-selbar { left: 16px; right: 16px; } }

/* 이력/검색 필터 개수 */
.hf-count { font-size: 12px; font-weight: 700; color: var(--gray-lt); }

/* 컬렉션별 지식 선택 (사용중지 직접 요청) */
.kn-colgroups { display: flex; flex-direction: column; gap: 12px; margin-bottom: 74px; }
.kn-colgroup { padding: 12px 14px 8px; }
.kcg-head { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 800; color: var(--ink); padding-bottom: 8px; border-bottom: 1px solid var(--line); margin-bottom: 4px; }
.kcg-head svg { color: var(--navy); }
.kcg-n { font-size: 11px; font-weight: 800; color: var(--gray-lt); background: var(--canvas); border-radius: 20px; padding: 1px 7px; }
.kcg-item { display: flex; align-items: center; gap: 10px; padding: 9px 6px; border-radius: 8px; cursor: pointer; }
.kcg-item:hover { background: var(--canvas); }
.kcg-item.on { background: #FBE9E8; }
.kcg-item input { display: none; }
.kcg-check { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid var(--line-strong); display: grid; place-items: center; color: #fff; background: var(--card); flex-shrink: 0; }
.kcg-item.on .kcg-check { border-color: var(--red); background: var(--red); }
.kcg-name { font-size: 13px; font-weight: 650; color: var(--ink); flex: 1; min-width: 0; }
.kcg-item.on .kcg-name { color: var(--red); }
.kcg-meta { font-size: 11.5px; color: var(--gray-lt); }

/* 섹션 구분 라벨 */
.kr-sec { font-size: 12px; font-weight: 800; color: var(--gray); margin: 18px 0 10px; padding-left: 2px; }
</style>
