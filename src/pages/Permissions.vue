<script setup>
import { ref, computed } from 'vue'
import { store, approve, openDeny, approveAll, cancelRequest } from '../store.js'
import Steps from '../components/Steps.vue'
import Icon from '../components/Icon.vue'

const filter = ref('all')
const q = ref('')            // 검색어
const from = ref('')         // 기간 시작(YYYY-MM-DD)
const to = ref('')           // 기간 종료
const listView = ref('list') // list | grid(카드)

const isAdmin = computed(() => store.role === 'admin')

// 화면(내 요청함/승인함)은 사이드바 메뉴가 결정(store.permsView). 사용자는 항상 내 요청함.
const activeView = computed(() => (isAdmin.value ? store.permsView : 'mine'))
const reviewing = computed(() => activeView.value === 'approve') // 승인 검토 모드

// 뷰별 대상 요청: 승인함=타인 요청, 내 요청함=내 요청
const scoped = computed(() =>
  reviewing.value
    ? store.requests.filter(r => !r.mine || r.targetType === 'resource')   // 리소스(도구) 요청은 운영 관리자가 승인
    : store.requests.filter(r => r.mine)
)

const rows = computed(() => {
  let base = scoped.value
  if (filter.value !== 'all') base = base.filter(r => r.status === filter.value)
  const term = q.value.trim()
  if (term) base = base.filter(r => (r.targetName + r.requester + r.dept + r.reason + r.permType).includes(term))
  if (from.value) base = base.filter(r => r.createdAt >= from.value)   // YYYY-MM-DD 문자열 비교 = 날짜순
  if (to.value) base = base.filter(r => r.createdAt <= to.value)
  return base
})

function resetPeriod() { from.value = ''; to.value = '' }

const pendingCount = computed(() => scoped.value.filter(r => r.status === 'pending').length)
const doneCount = computed(() => scoped.value.filter(r => r.status !== 'pending').length)

const statusLabel = { pending: '요청중', approved: '승인', denied: '반려' }
const statusCls = { pending: 'pill-pending', approved: 'pill-active', denied: 'pill-denied' }

</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <div class="page-title">{{ reviewing ? '승인함' : '내 요청함' }}</div>
        <div class="page-desc">
          {{ reviewing
            ? '관리자·권한자 전용 화면입니다. 요청을 검토하고 승인 또는 반려하세요. 반려 시 사유 입력이 필수입니다.'
            : '내 권한 요청의 처리 상태를 추적합니다. 반려된 요청은 사유 확인 후 재요청할 수 있습니다.' }}
        </div>
      </div>
      <button v-if="reviewing" class="btn btn-primary" :disabled="!pendingCount" @click="approveAll">
        대기 {{ pendingCount }}건 일괄 승인
      </button>
    </div>

    <div class="filters">
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

    <!-- 리스트 보기 -->
    <div class="card" v-if="listView === 'list' && rows.length">
      <div v-for="r in rows" :key="r.id" class="req-row">
        <div class="sq" :class="r.targetType === 'knowledge' ? 'sq-green' : r.targetType === 'resource' ? 'sq-amber' : 'sq-navy'">{{ r.targetName.slice(0, 1) }}</div>
        <div class="req-body">
          <div class="req-title">
            <span v-if="r.targetType === 'resource'" class="type-tag">도구</span>
            <template v-if="reviewing">{{ r.requester }} · {{ r.dept }}</template>
            <template v-else>{{ r.targetName }}</template>
          </div>
          <div class="req-sub">
            <template v-if="reviewing">{{ r.targetName }} — </template>{{ r.permType }} · {{ r.period }} · {{ r.createdAt }}
          </div>
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

    <!-- 카드 보기 -->
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

    <p style="margin-top:12px;font-size:12px;color:var(--gray)">
      승인 시 ABAC 정책에 자동 반영되며, 기간 만료 시 권한이 자동 회수됩니다. 모든 처리 이력은 감사 로그에 기록됩니다.
    </p>
  </div>
</template>
