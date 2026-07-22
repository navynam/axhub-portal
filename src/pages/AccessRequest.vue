<script setup>
/**
 * Agent 사용 권한 신청 · 결재선 지정 화면 (샘플)
 * -----------------------------------------------------------------------------
 * 초급 개발자용 정리 포인트:
 *  - 데이터/제출 로직은 accessService 로 분리 (여기는 화면 상태 + UI 만)
 *  - 결재선 스텝퍼는 재사용 컴포넌트 ApprovalLine 으로 분리
 *  - 화면은 크게 3단계로 구성:  ① Agent 선택  ② 신청 정보  ③ 결재선 지정
 */
import { ref, computed } from 'vue'
import { store, toast, go } from '../store.js'
import Icon from '../components/Icon.vue'
import ApprovalLine from '../components/ApprovalLine.vue'
import {
  APPROVER_CANDIDATES,
  PERIOD_OPTIONS,
  defaultApprovalLine,
  submitAccessRequest,
} from '../features/access/services/accessService'

/* ── ① 신청 Agent 선택 ─────────────────────────────── */
const keyword = ref('')                 // 검색어
const selectedIds = ref([])             // 선택한 Agent id 목록

// 검색어로 걸러낸 Agent 목록
const filteredAgents = computed(() => {
  const word = keyword.value.trim()
  if (!word) return store.agents
  return store.agents.filter(a => (a.name + a.owner).includes(word))
})

const isSelected = (id) => selectedIds.value.includes(id)

// 체크박스 토글 (선택/해제)
function toggleAgent(id) {
  const index = selectedIds.value.indexOf(id)
  if (index >= 0) selectedIds.value.splice(index, 1)
  else selectedIds.value.push(id)
}

const selectedCount = computed(() => selectedIds.value.length)

/* ── ② 신청 정보 ───────────────────────────────────── */
const reason = ref('')
const period = ref(PERIOD_OPTIONS[1])   // 기본값: '~2026-12-31'

/* ── ③ 결재선(승인 라인) ───────────────────────────── */
const approvalLine = ref(defaultApprovalLine())

/* ── 버튼 동작 ─────────────────────────────────────── */

// 입력값 초기화
function reset() {
  keyword.value = ''
  selectedIds.value = []
  reason.value = ''
  approvalLine.value = defaultApprovalLine()
}

// 신청 제출 (검증 → 서비스 호출 → 안내)
async function submit() {
  if (selectedCount.value === 0) { toast('신청할 Agent를 선택하세요.', 'warn'); return }
  if (!reason.value.trim()) { toast('사용 사유를 입력하세요.', 'warn'); return }
  if (approvalLine.value.length === 0) { toast('결재선을 1명 이상 지정하세요.', 'warn'); return }

  await submitAccessRequest({
    agentIds: selectedIds.value,
    reason: reason.value.trim(),
    period: period.value,
    line: approvalLine.value,
  })

  toast(`Agent ${selectedCount.value}건 사용 권한을 신청했습니다. 결재선 ${approvalLine.value.length}단계로 순차 승인됩니다.`, 'ok')
  go('perms') // 데모: 내 요청함으로 이동
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <div class="page-title">Agent 사용 권한 신청</div>
        <div class="page-desc">사용할 Agent를 선택하고 결재선을 지정해 권한을 신청합니다. 지정한 결재선에 따라 순차 승인됩니다.</div>
      </div>
      <button class="btn btn-ghost" @click="reset"><Icon name="collapse" :size="14" /> 초기화</button>
    </div>

    <div class="acc-grid">
      <div class="acc-main">
        <!-- ① 신청 Agent -->
        <div class="acc-card">
          <div class="acc-card-title">① 신청 Agent <span class="count">{{ selectedCount }}개 선택</span></div>
          <div class="search" style="margin-bottom:12px">
            <Icon name="search" :size="16" />
            <input v-model="keyword" placeholder="Agent 검색" aria-label="Agent 검색" />
          </div>
          <div class="acc-agent-list">
            <label v-for="a in filteredAgents" :key="a.id" class="acc-agent" :class="{ on: isSelected(a.id) }">
              <input type="checkbox" :checked="isSelected(a.id)" @change="toggleAgent(a.id)" />
              <div class="sq sq-navy sq-sm">{{ a.name.slice(0, 1) }}</div>
              <div class="acc-agent-body">
                <div class="acc-agent-name">{{ a.name }}</div>
                <div class="acc-agent-sub">{{ a.owner }} · 도구 {{ a.tools?.length || 0 }}개</div>
              </div>
              <span class="acc-check"><Icon name="check" :size="13" /></span>
            </label>
            <div v-if="!filteredAgents.length" class="empty" style="padding:24px"><b>검색 결과가 없습니다</b></div>
          </div>
        </div>

        <!-- ② 신청 정보 -->
        <div class="acc-card">
          <div class="acc-card-title">② 신청 정보</div>
          <div class="field">
            <label>사용 사유 <span class="req">*</span></label>
            <textarea v-model="reason" placeholder="업무 목적을 구체적으로 입력하세요. 결재자 검토에 사용됩니다."></textarea>
          </div>
          <div class="field">
            <label>사용 기간</label>
            <select class="select" v-model="period" style="width:100%">
              <option v-for="opt in PERIOD_OPTIONS" :key="opt">{{ opt }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ③ 결재선 -->
      <aside class="acc-side">
        <div class="acc-card">
          <div class="acc-card-title">③ 결재선 지정 <span class="count">{{ approvalLine.length }}단계</span></div>
          <ApprovalLine v-model="approvalLine" :applicant="store.user" :candidates="APPROVER_CANDIDATES" />
          <p class="line-hint">결재선 순서대로 승인되어야 최종 권한이 부여됩니다. 순서는 추가한 순으로 정렬됩니다.</p>
        </div>
      </aside>
    </div>

    <div class="acc-footer">
      <button class="btn btn-ghost" @click="go('home')">취소</button>
      <button class="btn btn-primary" @click="submit"><Icon name="check" :size="14" /> 신청 제출</button>
    </div>
  </div>
</template>
