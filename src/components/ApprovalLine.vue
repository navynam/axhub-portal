<script setup>
/**
 * 결재선(승인 라인) 스텝퍼 — 재사용 공통 컴포넌트
 * -----------------------------------------------------------------------------
 * 신청자 → 1차/2차/…/최종 승인 순서를 세로 스텝으로 보여주고,
 * 결재자 추가/삭제를 지원한다. 여러 화면에서 재사용할 수 있다.
 *
 * 사용 예)
 *   <ApprovalLine v-model="line" :applicant="user" :candidates="APPROVER_CANDIDATES" />
 *   - v-model(line) : 결재자 배열. 추가/삭제 시 부모의 배열이 갱신된다.
 *   - applicant     : 신청자 { name, dept }
 *   - candidates    : 추가 가능한 결재자 후보 목록
 */
import { ref } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  // v-model 로 연결되는 결재자 배열. 각 항목: { id, name, dept, title }
  modelValue: { type: Array, default: () => [] },
  // 신청자 정보 (맨 위 고정 표시)
  applicant: { type: Object, required: true },
  // '결재자 추가' 드롭다운에 나올 후보 목록
  candidates: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

// 드롭다운에서 고른 결재자 후보 id
const pickId = ref('')

/** 단계 라벨: 마지막 단계는 '최종 승인', 그 외는 'N차 승인' */
function stepLabel(index) {
  const isLast = index === props.modelValue.length - 1
  return isLast ? '최종 승인' : `${index + 1}차 승인`
}

/** 결재자 추가 (이미 포함된 사람은 중복 추가하지 않음) */
function addApprover() {
  const person = props.candidates.find(c => c.id === pickId.value)
  const alreadyIn = props.modelValue.some(l => l.id === pickId.value)
  if (person && !alreadyIn) {
    // 원본 배열을 직접 바꾸지 않고, 새 배열을 만들어 부모에 알린다(단방향 데이터 흐름).
    emit('update:modelValue', [...props.modelValue, person])
  }
  pickId.value = ''
}

/** index 번째 결재자 삭제 */
function removeApprover(index) {
  const next = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="line-stepper">
    <!-- 신청자 (고정) -->
    <div class="line-step applicant">
      <span class="ls-dot"></span>
      <div class="ls-body">
        <div class="ls-role">신청자</div>
        <div class="ls-who">{{ applicant.name }} · {{ applicant.dept }}</div>
      </div>
    </div>

    <!-- 결재 단계들 -->
    <div v-for="(approver, i) in modelValue" :key="approver.id" class="line-step">
      <span class="ls-dot"></span>
      <div class="ls-body">
        <div class="ls-role">{{ stepLabel(i) }}</div>
        <div class="ls-who">{{ approver.name }} · {{ approver.dept }} {{ approver.title }}</div>
      </div>
      <button class="ls-btn" @click="removeApprover(i)" title="결재자 삭제" aria-label="결재자 삭제">
        <Icon name="x" :size="13" />
      </button>
    </div>
  </div>

  <!-- 결재자 추가 -->
  <div class="line-add">
    <select class="select" v-model="pickId" style="flex:1" aria-label="결재자 선택">
      <option value="" disabled>결재자 추가…</option>
      <option v-for="c in candidates" :key="c.id" :value="c.id">{{ c.name }} · {{ c.dept }} {{ c.title }}</option>
    </select>
    <button class="btn btn-ghost btn-sm" @click="addApprover"><Icon name="plus" :size="13" /> 추가</button>
  </div>
</template>
