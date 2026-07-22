<script setup>
import { ref } from 'vue'
import { store, confirmDeny } from '../store.js'

const reason = ref('')
function close() { store.denyModal = null }
</script>

<template>
  <div class="overlay" @click.self="close">
    <div class="modal" role="dialog" aria-modal="true" aria-label="요청 반려">
      <h3>요청 반려</h3>
      <p class="target">{{ store.denyModal.requester }} · {{ store.denyModal.dept }} — {{ store.denyModal.targetName }}</p>

      <div class="field">
        <label>반려 사유 <span class="req">*</span></label>
        <textarea v-model="reason" placeholder="요청자에게 그대로 전달됩니다. 보완 방법을 함께 안내하세요."></textarea>
      </div>

      <div class="modal-actions">
        <button class="btn btn-ghost" @click="close">취소</button>
        <button class="btn btn-danger" @click="confirmDeny(reason)">반려 확정</button>
      </div>
    </div>
  </div>
</template>
