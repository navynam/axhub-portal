<script setup>
import { ref } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  node: Object,          // { id, name, count, children? }
  selectedId: String,
  depth: { type: Number, default: 0 },
})
const emit = defineEmits(['select'])

const open = ref(props.depth === 0)
const hasChildren = () => !!(props.node.children && props.node.children.length)
function toggle() { if (hasChildren()) open.value = !open.value }
</script>

<template>
  <div class="tree-node">
    <div class="tree-row" :class="{ on: node.id === selectedId }"
      :style="{ paddingLeft: (8 + depth * 15) + 'px' }" @click="emit('select', node.id)">
      <button v-if="hasChildren()" class="tree-caret" :class="{ open }" @click.stop="toggle" aria-label="펼치기/접기">
        <Icon name="chevron" :size="12" />
      </button>
      <span v-else class="tree-caret ghost"></span>
      <Icon :name="hasChildren() ? 'folder' : 'doc'" :size="14" class="tree-ic" />
      <span class="tree-name">{{ node.name }}</span>
      <span class="tree-count">{{ node.count }}</span>
    </div>

    <div v-if="hasChildren() && open" class="tree-children">
      <KnowledgeTreeNode v-for="c in node.children" :key="c.id"
        :node="c" :selected-id="selectedId" :depth="depth + 1" @select="emit('select', $event)" />
    </div>
  </div>
</template>
