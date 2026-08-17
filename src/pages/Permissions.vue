<script setup>
import { ref, computed } from 'vue'
import {
  store, approve, openDeny, approveAll, cancelRequest,
  startReportProgress, replyReport, resolveReport, cancelReport,
  reportCatLabel, reportStatusLabel, reportStatusCls,
  knReqStatusLabel, knReqStatusCls, docReqStatusLabel, docReqStatusCls,
  setKnowledgeRequestStatus, cancelKnowledgeRequest, approveDocRegistration, rejectDocRegistration,
  approveGlossaryTerm, rejectGlossaryTerm, cancelGlossaryTerm,
} from '../store.js'
import Steps from '../components/Steps.vue'
import Icon from '../components/Icon.vue'

const tab = ref('perm')      // perm(권한) | knowledge(지식 요청) | report(신고함)
const filter = ref('all')
const q = ref('')            // 검색어
const from = ref('')         // 기간 시작(YYYY-MM-DD)
const to = ref('')           // 기간 종료
const listView = ref('list') // list | grid(카드)

const isAdmin = computed(() => store.role === 'admin')

// 화면(내 요청함/승인함)은 사이드바 메뉴가 결정(store.permsView). 사용자는 항상 내 요청함.
const activeView = computed(() => (isAdmin.value ? store.permsView : 'mine'))
const reviewing = computed(() => activeView.value === 'approve') // 승인 검토 모드

// ── 권한 요청 ──────────────────────────────
const scoped = computed(() =>
  reviewing.value
    ? store.requests.filter(r => !r.mine || r.targetType === 'resource')
    : store.requests.filter(r => r.mine)
)
const rows = computed(() => {
  let base = scoped.value
  if (filter.value !== 'all') base = base.filter(r => r.status === filter.value)
  const term = q.value.trim()
  if (term) base = base.filter(r => (r.targetName + r.requester + r.dept + r.reason + r.permType).includes(term))
  if (from.value) base = base.filter(r => r.createdAt >= from.value)
  if (to.value) base = base.filter(r => r.createdAt <= to.value)
  return base
})
function resetPeriod() { from.value = ''; to.value = '' }
const pendingCount = computed(() => scoped.value.filter(r => r.status === 'pending').length)
const doneCount = computed(() => scoped.value.filter(r => r.status !== 'pending').length)
const statusLabel = { pending: '요청중', approved: '승인', denied: '반려' }
const statusCls = { pending: 'pill-pending', approved: 'pill-active', denied: 'pill-denied' }

// ── 신고함 ────────────────────────────────
const rq = ref('')  // 신고 검색어
const reportScoped = computed(() =>
  reviewing.value ? store.reports : store.reports.filter(r => r.requester === store.user.name)
)
const reportRows = computed(() => {
  const term = rq.value.trim()
  return term
    ? reportScoped.value.filter(r => (r.agentName + r.reason + (r.adminReply || '') + (reportCatLabel[r.category] || '')).includes(term))
    : reportScoped.value
})
const reportOpen = computed(() => reportScoped.value.filter(r => r.status !== 'resolved').length)

// ── 지식 요청 / 문서 등록 (구분 등록·승인) ──
const knItems = computed(() => {
  const reqs = store.knowledgeRequests.map(r => ({
    kind: 'req', typeLabel: '지식 요청', id: r.id, title: r.title,
    sub: `대상 ${r.targetName || '신규 · 미지정'}`, reason: r.content,
    requester: r.requester, dept: r.dept, createdAt: r.createdAt,
    status: r.status, statusLabel: knReqStatusLabel[r.status], statusCls: knReqStatusCls[r.status],
    files: r.files, raw: r,
  }))
  const docs = store.docRequests.map(d => ({
    kind: 'doc', typeLabel: '문서 등록', id: d.id, title: `${d.docName} ${d.version}`,
    sub: `컬렉션 ${d.knowledgeName}`, reason: d.reason || '',
    requester: d.requester, dept: d.dept, createdAt: d.createdAt,
    status: d.status, statusLabel: docReqStatusLabel[d.status], statusCls: docReqStatusCls[d.status],
    files: d.files, raw: d,
  }))
  let all = [...reqs, ...docs]
  if (!reviewing.value) all = all.filter(x => x.requester === store.user.name)
  return all.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
})
const knPending = computed(() => knItems.value.filter(x => x.status === 'pending' || x.status === 'progress').length)
function knApprove(x) { if (x.kind === 'doc') approveDocRegistration(x.raw); else setKnowledgeRequestStatus(x.raw, 'approved') }
function knReject(x) { if (x.kind === 'doc') rejectDocRegistration(x.raw); else setKnowledgeRequestStatus(x.raw, 'rejected') }
function knCancel(x) { if (x.kind === 'req') cancelKnowledgeRequest(x.raw) }

// ── 용어 등록 (승인함) ──────────────────────
const glItems = computed(() => {
  let all = store.glossaryRequests.map(g => ({ ...g, raw: g }))
  if (!reviewing.value) all = all.filter(x => x.requester === store.user.name)
  return all.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
})
const glPending = computed(() => glItems.value.filter(x => x.status === 'pending').length)
function glApprove(x) { approveGlossaryTerm(x.raw) }
function glReject(x) { rejectGlossaryTerm(x.raw) }
function glCancel(x) { cancelGlossaryTerm(x.raw) }

const expandedId = ref(null)
function toggleScript(id) { expandedId.value = expandedId.value === id ? null : id }
const replyingId = ref(null)
const replyText = ref('')
function startReply(r) { replyingId.value = r.id; replyText.value = r.adminReply || '' }
function submitReply(r) { if (replyReport(r, replyText.value)) { replyingId.value = null; replyText.value = '' } }
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <div class="page-title">{{ reviewing ? '승인함' : '내 요청함' }}</div>
        <div class="page-desc">
          {{ reviewing
            ? '관리자·권한자 전용 화면입니다. 권한 요청을 검토하고, 신고(개선요청)를 처리하세요.'
            : '내 권한 요청과 신고(개선요청)의 처리 상태를 추적합니다.' }}
        </div>
      </div>
      <button v-if="tab === 'perm' && reviewing" class="btn btn-primary" :disabled="!pendingCount" @click="approveAll">
        대기 {{ pendingCount }}건 일괄 승인
      </button>
    </div>

    <!-- 탭: 권한 / 신고함 -->
    <div class="tabs" role="tablist" style="margin-bottom:2px">
      <button role="tab" :class="{ on: tab === 'perm' }" @click="tab = 'perm'">
        {{ reviewing ? '권한 승인' : '권한 요청' }}<span class="n">{{ pendingCount + doneCount }}</span>
      </button>
      <button role="tab" :class="{ on: tab === 'report' }" @click="tab = 'report'">
        <Icon name="flag" :size="13" class="tab-ic" />{{ reviewing ? '신고 처리' : '신고함' }}<span class="n">{{ reportScoped.length }}</span>
      </button>
    </div>

    <!-- ══════════ 권한 탭 ══════════ -->
    <template v-if="tab === 'perm'">
      <div class="filters" style="margin-top:16px">
        <div class="search"><Icon name="search" :size="16" /><input v-model="q" placeholder="요청 검색 (대상·요청자·사유)" aria-label="요청 검색" /></div>
        <select class="select" v-model="filter" aria-label="상태 필터">
          <option value="all">전체 ({{ pendingCount + doneCount }})</option>
          <option value="pending">요청중 ({{ pendingCount }})</option>
          <option value="approved">승인</option>
          <option value="denied">반려</option>
        </select>
        <div class="date-range" role="group" aria-label="기간 조회">
          <Icon name="clock" :size="14" />
          <input type="date" v-model="from" aria-label="시작일" />
          <span class="tilde">~</span>
          <input type="date" v-model="to" aria-label="종료일" />
          <button v-if="from || to" class="date-clear" @click="resetPeriod" title="기간 초기화"><Icon name="x" :size="14" /></button>
        </div>
        <div class="view-toggle" role="group" aria-label="보기 방식">
          <button :class="{ on: listView === 'grid' }" @click="listView = 'grid'" aria-label="카드 보기" title="카드 보기"><Icon name="grid" :size="16" /></button>
          <button :class="{ on: listView === 'list' }" @click="listView = 'list'" aria-label="리스트 보기" title="리스트 보기"><Icon name="list" :size="16" /></button>
        </div>
      </div>

      <div class="card" v-if="listView === 'list' && rows.length">
        <div v-for="r in rows" :key="r.id" class="req-row">
          <div class="sq" :class="r.targetType === 'knowledge' ? 'sq-green' : r.targetType === 'resource' ? 'sq-amber' : 'sq-navy'">{{ r.targetName.slice(0, 1) }}</div>
          <div class="req-body">
            <div class="req-title">
              <span v-if="r.targetType === 'resource'" class="type-tag">도구</span>
              <template v-if="reviewing">{{ r.requester }} · {{ r.dept }}</template>
              <template v-else>{{ r.targetName }}</template>
            </div>
            <div class="req-sub"><template v-if="reviewing">{{ r.targetName }} — </template>{{ r.permType }} · {{ r.period }} · {{ r.createdAt }}</div>
            <div class="req-reason">사유: {{ r.reason }}</div>
            <Steps :status="r.status" />
            <div v-if="r.status === 'denied' && r.denyReason" class="deny-note" style="margin-top:8px">반려 사유: {{ r.denyReason }}</div>
          </div>
          <div class="req-side">
            <span class="pill" :class="statusCls[r.status]">{{ statusLabel[r.status] }}</span>
            <span v-if="r.status === 'pending'" class="sla">SLA {{ r.sla }}</span>
            <div v-if="reviewing && r.status === 'pending'" class="req-actions">
              <button class="btn btn-green btn-sm" @click="approve(r)">승인</button>
              <button class="btn btn-danger btn-sm" @click="openDeny(r)">반려</button>
            </div>
            <div v-if="!reviewing && r.status === 'pending'" class="req-actions">
              <button class="btn btn-ghost btn-sm" @click="cancelRequest(r)">요청 취소</button>
            </div>
          </div>
        </div>
      </div>

      <div class="req-cards" v-else-if="listView === 'grid' && rows.length">
        <div v-for="r in rows" :key="r.id" class="card req-card">
          <div class="req-card-top">
            <div class="sq sq-sm" :class="r.targetType === 'knowledge' ? 'sq-green' : r.targetType === 'resource' ? 'sq-amber' : 'sq-navy'">{{ r.targetName.slice(0, 1) }}</div>
            <div class="req-card-head">
              <div class="req-card-title">
                <span v-if="r.targetType === 'resource'" class="type-tag">도구</span>
                <template v-if="reviewing">{{ r.requester }} · {{ r.dept }}</template>
                <template v-else>{{ r.targetName }}</template>
              </div>
              <div class="req-card-sub"><template v-if="reviewing">{{ r.targetName }} · </template>{{ r.permType }} · {{ r.period }}</div>
            </div>
            <span class="pill pill-sm" :class="statusCls[r.status]">{{ statusLabel[r.status] }}</span>
          </div>
          <div class="req-card-reason">{{ r.reason }}</div>
          <Steps :status="r.status" />
          <div v-if="r.status === 'denied' && r.denyReason" class="deny-note">반려 사유: {{ r.denyReason }}</div>
          <div class="req-card-foot">
            <span class="req-card-date"><Icon name="clock" :size="12" /> {{ r.createdAt }}<template v-if="r.status === 'pending'"> · SLA {{ r.sla }}</template></span>
            <div v-if="reviewing && r.status === 'pending'" class="req-card-actions">
              <button class="btn btn-danger btn-sm" @click="openDeny(r)">반려</button>
              <button class="btn btn-green btn-sm" @click="approve(r)">승인</button>
            </div>
            <button v-else-if="!reviewing && r.status === 'pending'" class="btn btn-ghost btn-sm" @click="cancelRequest(r)">요청 취소</button>
          </div>
        </div>
      </div>

      <div v-else class="card empty">
        <b>{{ reviewing ? '표시할 요청이 없습니다' : '요청 내역이 없습니다' }}</b>
        {{ q || from || to ? '검색어·기간·상태 조건을 조정해 보세요.' : (reviewing ? '새 요청이 접수되면 알림과 함께 여기에 표시됩니다.' : 'Agent·지식 카탈로그에서 권한을 요청해 보세요.') }}
      </div>
    </template>

    <!-- ══════════ 신고함 탭 ══════════ -->
    <template v-else>
      <div class="filters" style="margin-top:16px">
        <div class="search"><Icon name="search" :size="16" /><input v-model="rq" placeholder="신고 검색 (Agent·유형·요청 내용)" aria-label="신고 검색" /></div>
        <span class="rep-count-hint">진행중 {{ reportOpen }}건</span>
      </div>

      <div class="rep-list" v-if="reportRows.length">
        <div v-for="r in reportRows" :key="r.id" class="card rep-row">
          <div class="rep-row-main">
            <div class="rep-row-head">
              <div class="sq sq-navy sq-sm">{{ r.agentName.slice(0, 1) }}</div>
              <div class="rep-row-title">
                <div class="rep-name">{{ r.agentName }} <span class="type-tag">{{ reportCatLabel[r.category] }}</span></div>
                <div class="rep-meta"><template v-if="reviewing">{{ r.requester }} · {{ r.dept }} · </template>신고 {{ r.createdAt }}</div>
              </div>
              <span class="pill" :class="reportStatusCls[r.status]">{{ reportStatusLabel[r.status] }}</span>
            </div>

            <div class="rep-tags" v-if="r.items.length"><span v-for="it in r.items" :key="it" class="ax-tag">{{ it }}</span></div>
            <div class="rep-reason">{{ r.reason }}</div>

            <button class="rep-attach" @click="toggleScript(r.id)">
              <Icon name="doc" :size="12" /> 첨부 대화 {{ r.script.length }}건 · {{ r.scriptAt }}
              <span class="rep-attach-x">{{ expandedId === r.id ? '접기' : '보기' }}</span>
            </button>
            <div class="rep-script" v-if="expandedId === r.id">
              <div v-for="(m, i) in r.script" :key="i" class="rep-msg" :class="m.role"><b>{{ m.role === 'user' ? '사용자' : 'Agent' }}</b><span>{{ m.text }}</span></div>
              <div v-if="!r.script.length" class="rep-msg-empty">첨부된 대화가 없습니다.</div>
            </div>

            <div class="rep-reply-box" v-if="r.adminReply">
              <div class="rep-reply-label"><Icon name="check" :size="12" /> 담당자 답변</div>{{ r.adminReply }}
            </div>

            <div class="rep-reply-edit" v-if="reviewing && replyingId === r.id">
              <textarea v-model="replyText" placeholder="개선 방향·답변을 작성하세요. 요청자에게 전달됩니다."></textarea>
              <div class="rep-reply-actions">
                <button class="btn btn-ghost btn-sm" @click="replyingId = null">취소</button>
                <button class="btn btn-primary btn-sm" @click="submitReply(r)">답변 등록</button>
              </div>
            </div>
          </div>

          <div class="rep-row-side">
            <template v-if="reviewing">
              <button v-if="r.status === 'received'" class="btn btn-ghost btn-sm" @click="startReportProgress(r)">진행 시작</button>
              <button v-if="r.status !== 'resolved' && replyingId !== r.id" class="btn btn-primary btn-sm" @click="startReply(r)">{{ r.adminReply ? '답변 수정' : '답변' }}</button>
              <button v-if="r.status !== 'resolved'" class="btn btn-green btn-sm" @click="resolveReport(r)">개선 완료</button>
            </template>
            <template v-else>
              <button v-if="r.status === 'received'" class="btn btn-ghost btn-sm" @click="cancelReport(r)">신고 취소</button>
              <span v-else class="rep-side-hint">담당자 처리중</span>
            </template>
          </div>
        </div>
      </div>

      <div v-else class="card empty">
        <b>{{ reviewing ? '접수된 신고가 없습니다' : '신고 내역이 없습니다' }}</b>
        {{ reviewing ? '사용자가 개선요청을 접수하면 여기에서 처리할 수 있습니다.' : '에이전트 대화창의 “신고하기”로 개선을 요청해 보세요.' }}
      </div>
    </template>

    <p style="margin-top:12px;font-size:12px;color:var(--gray)">
      권한 승인은 ABAC 정책에 자동 반영됩니다. 신고(개선요청)는 담당 관리자가 검토 후 답변·개선 완료 처리하며, 모든 이력은 감사 로그에 기록됩니다.
    </p>
  </div>
</template>
