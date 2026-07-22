<script setup>
import { permMeta } from '../store.js'
const props = defineProps({ perm: String, small: Boolean })
</script>

<template>
  <span class="pill" :class="[permMeta[perm]?.cls, { 'pill-sm': small }]">{{ permMeta[perm]?.label }}</span>
</template>
