<script setup>
/** 지식 담당자 관리 (권한 관리 하위) — 각 지식 컬렉션의 담당자(오너) 변경 */
import OwnerManage from '../components/OwnerManage.vue'
</script>

<template>
  <div>
    <p class="ao-lead">지식 컬렉션별 <b>담당자(오너)</b>를 관리합니다. 담당자가 퇴사하거나 부서를 이동하면 신규 담당자를 배정하세요.</p>
    <OwnerManage kind="knowledge" />
  </div>
</template>

<style scoped>
.ao-lead { font-size: 13px; color: var(--gray); line-height: 1.55; margin: 4px 0 0; }
.ao-lead b { color: var(--ink); font-weight: 700; }
</style>
