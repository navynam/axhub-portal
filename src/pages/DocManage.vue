<script setup>
/**
 * 문서 관리 — 상위 모드로 '문서 등록'과 '문서 삭제'를 분리.
 *  · 등록: 문서 담당자 등록 요청 → 상위 승인자 승인 (승인 완료 = 지식화 대기)
 *  · 삭제: 내가 올린 문서를 검색 → 소속 컬렉션 선택 → 삭제(지식 사용중지) 요청 → 문서 승인 담당자 승인
 */
import { ref, computed } from 'vue'
import { store, go, submitDocument, approveDocument, rejectDocument, docStatusLabel, docStatusCls,
  requestDocDeletion, approveDocDeletion, rejectDocDeletion, docCollections, collectionName, delStatusLabel, delStatusCls } from '../store.js'
import Icon from '../components/Icon.vue'
import BaseModal from '../components/BaseModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

// ── 상위 모드: 문서 등록 | 문서 삭제 ──
const mode = ref('add')

/* ═══════════ 등록 모드 ═══════════ */
const addTabs = [
  { key: 'all', label: '전체' },
  { key: 'doc-review', label: '승인 대기' },
  { key: 'approved', label: '지식화 대기' },
  { key: 'registered', label: '등록 완료' },
]
const addTab = ref('all')
const addView = ref('card') // card | list
const liveDocs = computed(() => store.documents.filter(d => d.status !== 'del-req' && d.status !== 'suspended'))
// 문서 등록 조회: 문서명 + 등록 요청일(기간)
const aQ = ref(''), aFrom = ref(''), aTo = ref('')
const addList = computed(() => liveDocs.value
  .filter(d => addTab.value === 'all' ? true : d.status === addTab.value)
  .filter(d => !aQ.value.trim() || d.name.toLowerCase().includes(aQ.value.trim().toLowerCase()))
  .filter(d => (!aFrom.value || d.createdAt >= aFrom.value) && (!aTo.value || d.createdAt <= aTo.value)))
const addCount = k => (k === 'all' ? liveDocs.value.length : liveDocs.value.filter(d => d.status === k).length)
function resetAdd() { aQ.value = ''; aFrom.value = ''; aTo.value = '' }

const newModal = ref(false)
const form = ref({ name: '', desc: '', docApprover: '', files: [] })
function openNew() { form.value = { name: '', desc: '', docApprover: '', files: [] }; newModal.value = true }
function onFiles(e) { form.value.files = [...form.value.files, ...Array.from(e.target.files || []).map(f => ({ name: f.name, size: f.size }))]; e.target.value = '' }
function removeFile(i) { form.value.files.splice(i, 1) }
function fmtSize(b) { return b >= 1e6 ? (b / 1e6).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB' }
function submitNew() { if (submitDocument(form.value)) newModal.value = false }

/* ═══════════ 삭제 모드 ═══════════ */
const delTabs = [
  { key: 'request', label: '삭제 요청' },
  { key: 'approve', label: '삭제 승인' },
  { key: 'history', label: '삭제 이력' },
]
const delTab = ref('request')

// 삭제 요청: 내가 관리하는(컬렉션에 등록된) 문서를 문서명·등록기간으로 검색 → 소속 컬렉션 선택
const q = ref(''), dFrom = ref(''), dTo = ref('')
const managedDocs = computed(() => store.documents.filter(d => (d.status === 'registered' || d.status === 'del-req') && docCollections(d.id).length))
const searched = computed(() => managedDocs.value
  .filter(d => !q.value.trim() || d.name.toLowerCase().includes(q.value.trim().toLowerCase()))
  .filter(d => (!dFrom.value || d.createdAt >= dFrom.value) && (!dTo.value || d.createdAt <= dTo.value)))
function resetDel() { q.value = ''; dFrom.value = ''; dTo.value = '' }
// 문서별 선택 컬렉션 (미지정이면 소속 전체를 기본 선택으로 간주)
const selCols = ref({})
const colsOf = d => (selCols.value[d.id] !== undefined ? selCols.value[d.id] : docCollections(d.id))
function toggleCol(d, cid) {
  if (selCols.value[d.id] === undefined) selCols.value[d.id] = [...docCollections(d.id)]
  const a = selCols.value[d.id]; const i = a.indexOf(cid); if (i >= 0) a.splice(i, 1); else a.push(cid)
}
const confirmDel = ref(null)
function reqDelete(d) {
  const cols = colsOf(d)
  if (!cols.length) return
  confirmDel.value = { doc: d, cols, message: `문서 ‘${d.name}’을(를)\n선택한 지식 컬렉션 ${cols.length}곳에서 삭제(사용중지) 요청하시겠습니까?` }
}
function doReqDelete() {
  const { doc, cols } = confirmDel.value
  if (requestDocDeletion(doc, cols)) delete selCols.value[doc.id]
  confirmDel.value = null
}

// 삭제 승인 (문서 승인 담당자)
const delReviews = computed(() => store.docDeletions.filter(x => x.status === 'del-review'))

// 삭제 이력 (기간·문서명 조회)
const hFrom = ref(''), hTo = ref(''), hQ = ref('')
const delHistory = computed(() => store.docDeletions.filter(x => {
  if (hQ.value.trim() && !x.docName.toLowerCase().includes(hQ.value.trim().toLowerCase())) return false
  if (hFrom.value && x.createdAt < hFrom.value) return false
  if (hTo.value && x.createdAt > hTo.value) return false
  return true
}))
function resetHist() { hFrom.value = ''; hTo.value = ''; hQ.value = '' }
</script>

<template>
  <div>
    <!-- 상위 모드 -->
    <div class="seg-tabs" role="tablist">
      <button role="tab" :class="{ on: mode === 'add' }" @click="mode = 'add'"><Icon name="plus" :size="14" /> 문서 등록</button>
      <button role="tab" :class="{ on: mode === 'del' }" @click="mode = 'del'"><Icon name="trash" :size="14" /> 문서 삭제</button>
    </div>

    <!-- ════════ 등록 모드 ════════ -->
    <template v-if="mode === 'add'">
      <div class="sub-tabs">
        <button v-for="t in addTabs" :key="t.key" :class="{ on: addTab === t.key }" @click="addTab = t.key">{{ t.label }}<span class="sn">{{ addCount(t.key) }}</span></button>
        <span class="grow"></span>
        <button class="btn btn-primary btn-sm" @click="openNew"><Icon name="plus" :size="14" /> 문서 등록 요청</button>
      </div>
      <p class="dm-lead">문서 담당자가 문서를 등록 요청하면 상위 승인자가 승인합니다. 승인된 문서는 <b>지식 관리</b>에서 지식 담당자가 컬렉션에 등록합니다.</p>

      <div class="hist-filter">
        <label class="hf-item grow"><span class="hf-label">문서명</span><input v-model="aQ" class="hf-in wide" placeholder="문서명 검색" /></label>
        <label class="hf-item"><span class="hf-label">등록 요청일</span><input type="date" v-model="aFrom" class="hf-in" /> <span class="hf-tilde">~</span> <input type="date" v-model="aTo" class="hf-in" /></label>
        <button class="btn btn-ghost btn-sm" @click="resetAdd">초기화</button>
      </div>

      <div v-if="addList.length" class="dm-list">
        <div v-for="d in addList" :key="d.id" class="card dm-card">
          <div class="dm-top">
            <div class="sq sq-navy sq-sm">{{ d.name.slice(0, 1) }}</div>
            <div class="dm-info">
              <div class="dm-name">{{ d.name }} <span class="pill" :class="docStatusCls[d.status]">{{ docStatusLabel[d.status] }}</span></div>
              <div class="dm-desc">{{ d.desc }}</div>
              <div class="dm-files" v-if="d.files && d.files.length">
                <span v-for="(f, i) in d.files" :key="i" class="dm-file"><Icon name="attach" :size="11" /> {{ f.name }}</span>
              </div>
            </div>
          </div>
          <div class="dm-steps two">
            <div class="dm-step done"><span class="dm-dot">✓</span><span class="dm-slabel">문서 등록</span></div>
            <div class="dm-step" :class="{ done: d.status !== 'doc-review' && d.status !== 'rejected', active: d.status === 'doc-review', rejected: d.status === 'rejected' }">
              <span class="dm-dot">{{ d.status !== 'doc-review' && d.status !== 'rejected' ? '✓' : '2' }}</span><span class="dm-slabel">문서 승인</span>
            </div>
          </div>
          <div class="dm-chain">
            <span><b>문서 담당</b> {{ d.docOwner }}</span><Icon name="arrow" :size="12" /><span><b>상위 승인</b> {{ d.docApprover }}</span>
          </div>
          <div class="dm-act">
            <span class="dm-date">요청 {{ d.createdAt }}</span><span class="grow"></span>
            <template v-if="d.status === 'doc-review'">
              <span class="dm-role">상위 승인자</span>
              <button class="btn btn-green btn-sm" @click="approveDocument(d)">문서 승인</button>
              <button class="btn btn-danger btn-sm" @click="rejectDocument(d)">반려</button>
            </template>
            <template v-else-if="d.status === 'approved'">
              <span class="dm-role ok"><Icon name="check" :size="13" /> 지식화 대기</span>
              <button class="btn btn-ghost btn-sm" @click="go('knreg')">지식 관리로</button>
            </template>
            <template v-else-if="d.status === 'in-reg'"><span class="dm-role">지식 등록 진행중</span></template>
            <template v-else-if="d.status === 'registered'">
              <span class="dm-role ok"><Icon name="check" :size="13" /> 지식 등록 완료</span>
              <button class="btn btn-ghost btn-sm" @click="go('knowledge')">지식 검색으로</button>
            </template>
            <template v-else><span class="dm-role rej">반려됨</span></template>
          </div>
        </div>
      </div>
      <div v-else class="card empty"><b>해당 상태의 문서가 없습니다</b>다른 탭을 선택하거나 문서 등록을 요청해 보세요.</div>
    </template>

    <!-- ════════ 삭제 모드 ════════ -->
    <template v-else>
      <div class="sub-tabs">
        <button v-for="t in delTabs" :key="t.key" :class="{ on: delTab === t.key }" @click="delTab = t.key">{{ t.label }}
          <span class="sn" v-if="t.key === 'approve'">{{ delReviews.length }}</span>
        </button>
      </div>

      <!-- ① 삭제 요청: 내 문서 검색 → 컬렉션 선택 → 요청 -->
      <template v-if="delTab === 'request'">
        <p class="dm-lead">내가 <b>관리하는 문서</b>(컬렉션에 등록된 문서)를 <b>문서명·등록기간</b>으로 검색하고, 이 문서가 등록된 <b>지식 컬렉션</b>을 선택해 삭제(지식 사용중지)를 요청합니다.</p>
        <div class="hist-filter">
          <label class="hf-item grow"><span class="hf-label">문서명</span><input v-model="q" class="hf-in wide" placeholder="관리 문서명 검색 (예: 캠페인, 회계, 준법)" /></label>
          <label class="hf-item"><span class="hf-label">등록기간</span><input type="date" v-model="dFrom" class="hf-in" /> <span class="hf-tilde">~</span> <input type="date" v-model="dTo" class="hf-in" /></label>
          <span class="hf-count">{{ searched.length }}건</span>
          <button class="btn btn-ghost btn-sm" @click="resetDel">초기화</button>
        </div>

        <div v-if="searched.length" class="dm-list">
          <div v-for="d in searched" :key="d.id" class="card del-doc">
            <div class="dm-top">
              <div class="sq sq-navy sq-sm">{{ d.name.slice(0, 1) }}</div>
              <div class="dm-info">
                <div class="dm-name">{{ d.name }}
                  <span v-if="d.status === 'del-req'" class="pill pill-pending">삭제 진행중</span>
                  <span v-else class="pill pill-active">등록 완료</span>
                </div>
                <div class="dm-desc">{{ d.desc }}</div>
                <div class="dm-meta2">문서 담당 <b>{{ d.docOwner }}</b><span v-if="d.docOwner !== store.user.name" class="tag-other">타담당</span> · 등록된 컬렉션 {{ docCollections(d.id).length }}곳 · 요청 {{ d.createdAt }}</div>
              </div>
            </div>

            <template v-if="d.status === 'del-req'">
              <div class="del-note"><Icon name="clock" :size="13" /> 이미 삭제 요청이 진행 중입니다.</div>
            </template>
            <template v-else>
              <div class="del-collbox">
                <div class="del-collhd">삭제할 지식 컬렉션 선택</div>
                <div class="del-collpick">
                  <label v-for="cid in docCollections(d.id)" :key="cid" class="del-collchip" :class="{ on: colsOf(d).includes(cid) }">
                    <input type="checkbox" :checked="colsOf(d).includes(cid)" @change="toggleCol(d, cid)" />
                    <span class="del-check"><Icon v-if="colsOf(d).includes(cid)" name="check" :size="11" /></span>
                    <Icon name="book" :size="12" /> {{ collectionName(cid) }}
                  </label>
                </div>
              </div>
              <div class="dm-act">
                <span class="grow"></span>
                <span class="del-sel">{{ colsOf(d).length }}곳 선택</span>
                <button class="btn btn-danger btn-sm" :disabled="!colsOf(d).length" @click="reqDelete(d)"><Icon name="trash" :size="13" /> 삭제 요청</button>
              </div>
            </template>
          </div>
        </div>
        <div v-else class="card empty"><b>검색 결과가 없습니다</b>컬렉션에 등록된 관리 문서를 문서명·등록기간으로 검색해 보세요.</div>
      </template>

      <!-- ② 삭제 승인 (문서 승인 담당자) -->
      <template v-else-if="delTab === 'approve'">
        <p class="dm-lead">문서 담당자가 요청한 <b>문서 삭제</b>를 승인합니다. 승인되면 지식 담당자에게 <b>지식 사용중지</b> 요청이 배정됩니다.</p>
        <div v-if="delReviews.length" class="dm-list">
          <div v-for="del in delReviews" :key="del.id" class="card dm-card">
            <div class="dm-top">
              <div class="sq sq-red sq-sm"><Icon name="trash" :size="15" /></div>
              <div class="dm-info">
                <div class="dm-name">{{ del.docName }} <span class="pill" :class="delStatusCls[del.status]">{{ delStatusLabel[del.status] }}</span></div>
                <div class="dm-desc">지식 컬렉션 {{ del.collectionIds.length }}곳에서 사용중지 대상 · 삭제 요청 {{ del.createdAt }}</div>
                <div class="dm-files">
                  <span v-for="cid in del.collectionIds" :key="cid" class="dm-file"><Icon name="book" :size="11" /> {{ collectionName(cid) }}</span>
                </div>
              </div>
            </div>
            <div class="dm-chain">
              <span><b>문서 담당</b> {{ del.docOwner }}</span><Icon name="arrow" :size="12" /><span><b>문서 승인</b> {{ del.docApprover }}</span><Icon name="arrow" :size="12" /><span><b>지식 담당</b> {{ del.knOwner }}</span>
            </div>
            <div class="dm-act">
              <span class="dm-date">삭제 요청 {{ del.createdAt }}</span><span class="grow"></span>
              <span class="dm-role">문서 승인 담당자</span>
              <button class="btn btn-green btn-sm" @click="approveDocDeletion(del)">삭제 승인</button>
              <button class="btn btn-danger btn-sm" @click="rejectDocDeletion(del)">반려</button>
            </div>
          </div>
        </div>
        <div v-else class="card empty"><b>삭제 승인 대기 건이 없습니다</b>삭제 요청이 등록되면 이곳에 표시됩니다.</div>
      </template>

      <!-- ③ 삭제 이력 (기간·문서 조회) -->
      <template v-else>
        <div class="hist-filter">
          <label class="hf-item"><span class="hf-label">기간</span>
            <input type="date" v-model="hFrom" class="hf-in" /> <span class="hf-tilde">~</span> <input type="date" v-model="hTo" class="hf-in" />
          </label>
          <label class="hf-item grow"><span class="hf-label">문서</span>
            <input v-model="hQ" class="hf-in wide" placeholder="문서명 검색" />
          </label>
          <button class="btn btn-ghost btn-sm" @click="resetHist">초기화</button>
        </div>
        <div v-if="delHistory.length" class="dm-list">
          <div v-for="del in delHistory" :key="del.id" class="card hist-row">
            <div class="sq sq-red sq-sm"><Icon name="trash" :size="14" /></div>
            <div class="hist-body">
              <div class="dm-name">{{ del.docName }} <span class="pill" :class="delStatusCls[del.status]">{{ delStatusLabel[del.status] }}</span></div>
              <div class="dm-desc">컬렉션 {{ del.collectionIds.length }}곳 · 문서 담당 {{ del.docOwner }} · 지식 담당 {{ del.knOwner }}</div>
            </div>
            <span class="hist-date">{{ del.createdAt }}</span>
          </div>
        </div>
        <div v-else class="card empty"><b>조회된 삭제 이력이 없습니다</b>기간·문서명 조건을 조정해 보세요.</div>
      </template>
    </template>

    <!-- 문서 등록 요청 모달 (공통 팝업) -->
    <BaseModal v-if="newModal" title="문서 등록 요청" icon="doc"
      sub="문서를 등록하면 상위 승인자 승인 후 지식화 대기 목록에 추가됩니다." @close="newModal = false">
      <label class="krm-field"><span class="krm-label">문서명 <em>*</em></span><input v-model="form.name" class="krm-input" placeholder="예: 2026 캠페인 성과 리포트" /></label>
      <label class="krm-field"><span class="krm-label">설명</span><input v-model="form.desc" class="krm-input" placeholder="문서 내용 요약" /></label>
      <label class="krm-field"><span class="krm-label">상위 승인자</span><input v-model="form.docApprover" class="krm-input" placeholder="예: 김영업 (팀장)" /></label>
      <div class="krm-field">
        <span class="krm-label">파일 첨부</span>
        <label class="krm-file"><Icon name="attach" :size="14" /> 파일 선택<input type="file" multiple @change="onFiles" hidden /></label>
        <div class="krm-files" v-if="form.files.length">
          <div v-for="(f, i) in form.files" :key="i" class="krm-file-item">
            <Icon name="doc" :size="12" /><span class="kfi-name">{{ f.name }}</span>
            <span class="kfi-size">{{ fmtSize(f.size) }}</span>
            <button class="kfi-x" @click="removeFile(i)" aria-label="제거"><Icon name="x" :size="11" /></button>
          </div>
        </div>
      </div>
      <template #actions>
        <button class="btn btn-ghost" @click="newModal = false">취소</button>
        <button class="btn btn-primary" @click="submitNew"><Icon name="send" :size="14" /> 등록 요청</button>
      </template>
    </BaseModal>

    <!-- 문서 삭제 요청 확인 (공통 팝업) -->
    <ConfirmDialog v-if="confirmDel" title="문서 삭제 요청" icon="trash" :message="confirmDel.message"
      confirm-text="삭제 요청" tone="danger" @confirm="doReqDelete" @close="confirmDel = null" />
  </div>
</template>

<style scoped>
/* 서브 탭 (상태/단계 필터) */
.sub-tabs { display: flex; align-items: center; gap: 4px; margin: 16px 0 14px; border-bottom: 1px solid var(--line); }
.sub-tabs button { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer;
  padding: 8px 12px; font-size: 13px; font-weight: 700; color: var(--gray-lt); border-bottom: 2px solid transparent; margin-bottom: -1px; }
.sub-tabs button:hover { color: var(--ink); }
.sub-tabs button.on { color: var(--navy); border-bottom-color: var(--navy); }
.sub-tabs .sn { font-size: 11px; font-weight: 800; color: var(--gray-lt); background: var(--canvas); border-radius: 20px; padding: 1px 7px; }
.sub-tabs button.on .sn { color: var(--navy); background: var(--navy-soft); }
.grow { flex: 1; }

.dm-lead { font-size: 13px; color: var(--gray); max-width: 78ch; line-height: 1.55; margin: 0 0 16px; }
.dm-lead b { color: var(--ink); font-weight: 700; }
.dm-list { display: flex; flex-direction: column; gap: 12px; }
.dm-card { display: flex; flex-direction: column; gap: 14px; padding: 16px 18px; }
.dm-top { display: flex; gap: 12px; align-items: flex-start; }
.dm-info { flex: 1; min-width: 0; }
.dm-name { font-size: 15px; font-weight: 800; color: var(--ink); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dm-desc { font-size: 12.5px; color: var(--gray); margin-top: 3px; }
.dm-files { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.dm-file { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: var(--gray);
  background: var(--canvas); border: 1px solid var(--line); border-radius: 6px; padding: 2px 8px; }
.dm-file svg { color: var(--navy-lt); }

.dm-steps { display: flex; align-items: center; background: var(--canvas); border: 1px solid var(--line); border-radius: 10px; padding: 12px 16px; max-width: 380px; }
.dm-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; }
.dm-step + .dm-step::before { content: ''; position: absolute; left: -50%; top: 12px; width: 100%; height: 2px; background: var(--line-strong); z-index: 0; }
.dm-step.done + .dm-step::before, .dm-step.done::before { background: var(--green); }
.dm-dot { position: relative; z-index: 1; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--card); border: 2px solid var(--line-strong); color: var(--gray-lt); font-size: 11px; font-weight: 800; }
.dm-step.done .dm-dot { background: var(--green); border-color: var(--green); color: #fff; }
.dm-step.active .dm-dot { border-color: var(--navy); color: var(--navy); box-shadow: 0 0 0 4px var(--navy-soft); }
.dm-step.rejected .dm-dot { border-color: var(--red); color: var(--red); }
.dm-slabel { font-size: 11px; font-weight: 700; color: var(--gray-lt); white-space: nowrap; }
.dm-step.done .dm-slabel, .dm-step.active .dm-slabel { color: var(--ink); }

.dm-chain { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--gray); }
.dm-chain b { color: var(--gray-lt); font-weight: 700; margin-right: 4px; font-size: 10.5px; }
.dm-chain svg { color: var(--line-strong); }
.dm-act { display: flex; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid var(--line); }
.dm-date { font-size: 11.5px; color: var(--gray-lt); }
.dm-role { font-size: 11.5px; font-weight: 700; color: var(--gray-lt); }
.dm-role.ok { color: var(--green); display: inline-flex; align-items: center; gap: 4px; }
.dm-role.rej { color: var(--red); }

/* 삭제 검색 결과 */
.hf-count { font-size: 12px; font-weight: 700; color: var(--gray-lt); }
.dm-meta2 { font-size: 11.5px; color: var(--gray-lt); margin-top: 5px; }
.dm-meta2 b { color: var(--gray); font-weight: 700; }
.tag-other { display: inline-block; margin-left: 5px; font-size: 10px; font-weight: 700; color: var(--navy);
  background: var(--navy-soft); border-radius: 4px; padding: 1px 5px; vertical-align: middle; }

.del-doc { display: flex; flex-direction: column; gap: 12px; padding: 16px 18px; }
.del-note { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--amber, #B7791F); }
.del-collbox { background: var(--canvas); border: 1px solid var(--line); border-radius: var(--r-md); padding: 12px 14px; }
.del-collhd { font-size: 11.5px; font-weight: 700; color: var(--gray); margin-bottom: 8px; }
.del-collpick { display: flex; flex-wrap: wrap; gap: 6px; }
.del-collchip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--gray);
  background: var(--card); border: 1.5px solid var(--line-strong); border-radius: 8px; padding: 6px 10px; cursor: pointer; }
.del-collchip input { display: none; }
.del-collchip svg { color: var(--navy); }
.del-collchip.on { border-color: var(--red); background: #FBE9E8; color: var(--red); }
.del-collchip.on svg { color: var(--red); }
.del-check { width: 16px; height: 16px; border-radius: 5px; border: 1.5px solid var(--line-strong); display: grid; place-items: center; color: #fff; background: var(--card); }
.del-collchip.on .del-check { border-color: var(--red); background: var(--red); }
.del-sel { font-size: 11.5px; font-weight: 700; color: var(--red); }

/* 이력 조회 필터 */
.hist-filter { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 14px; background: var(--card);
  border: 1px solid var(--line); border-radius: var(--r-md); margin-bottom: 14px; }
.hf-item { display: inline-flex; align-items: center; gap: 8px; }
.hf-label { font-size: 11.5px; font-weight: 700; color: var(--gray); }
.hf-in { border: 1px solid var(--line-strong); border-radius: 8px; padding: 6px 9px; font-size: 12.5px; color: var(--ink); background: var(--card); outline: none; }
.hf-in.wide { flex: 1; min-width: 160px; }
.hf-in:focus { border-color: var(--navy); }
.hf-tilde { color: var(--gray-lt); }

.hist-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; }
.hist-body { flex: 1; min-width: 0; }
.hist-date { font-size: 11.5px; color: var(--gray-lt); }
</style>
