<script setup>
/**
 * 폴더 이동 팝업 — 에이전트를 폴더에 넣는(그룹화) 방법
 * -----------------------------------------------------------------------------
 * 폴더 목록에서 선택하면 해당 에이전트를 그 폴더로 이동한다.
 * '새 폴더 만들어 이동'은 공통 PromptDialog 로 폴더를 만든 뒤 바로 이동한다.
 */
import { ref, computed } from 'vue'
import { store, moveAgentToMyFolder, addMyFolder } from '../store.js'
import Icon from './Icon.vue'
import PromptDialog from './PromptDialog.vue'

const props = defineProps({ agent: Object })
const emit = defineEmits(['close'])

const showCreate = ref(false)

// 이동 가능한 개인 폴더 = 사용자 생성 폴더 + 에이전트에 존재하는 폴더
const folders = computed(() => {
  const set = new Set(store.myFolders)
  store.agents.forEach(a => { if (a.myFolder) set.add(a.myFolder) })
  return [...set]
})

function pick(f) {
  if (f !== props.agent.myFolder) moveAgentToMyFolder(props.agent, f)
  emit('close')
}
function onCreate(name) {
  const f = addMyFolder(name)
  showCreate.value = false
  if (f) pick(f)
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-folder" role="dialog" aria-modal="true" aria-label="폴더로 이동">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>
      <div class="prompt-title">폴더로 이동</div>
      <p class="fp-sub"><b>{{ agent.name }}</b> 을(를) 넣을 폴더를 선택하세요.</p>

      <div class="fp-list">
        <button v-for="f in folders" :key="f" class="fp-item" :class="{ on: agent.myFolder === f }" @click="pick(f)">
          <Icon name="folder" :size="15" class="fp-ic" />
          <span class="fp-name">{{ f }}</span>
          <Icon v-if="agent.myFolder === f" name="check" :size="15" class="fp-check" />
        </button>
      </div>

      <button class="btn btn-ghost btn-block fp-new" @click="showCreate = true"><Icon name="plus" :size="14" /> 새 폴더 만들어 이동</button>
    </div>
  </div>

  <!-- 공통 입력 팝업으로 새 폴더 생성 -->
  <PromptDialog v-if="showCreate" title="새 폴더" label="폴더 이름" placeholder="예: 마케팅 봇" confirm-text="만들기"
    @confirm="onCreate" @close="showCreate = false" />
</template>
