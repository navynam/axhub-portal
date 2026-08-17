<script setup>
/**
 * 조직별 담당자 조회 공통 팝업 — [담당: 공통 개발자]
 * 왼쪽에 조직 목록, 오른쪽에 해당 조직의 담당자 목록을 표시하고 한 명을 선택한다.
 * 에이전트/지식 담당자 변경 등에서 재사용.
 *   <OrgStaffPickerModal title="담당자 변경" :current="..." @select="onSelect" @close="..." />
 */
import { ref, computed } from 'vue'
import Icon from './Icon.vue'
import { orgDirectory } from '../data.js'

const props = defineProps({
  title: { type: String, default: '담당자 선택' },
  current: { type: String, default: '' },
})
const emit = defineEmits(['select', 'close'])

const activeOrg = ref(orgDirectory[0].org)
const staff = computed(() => (orgDirectory.find(o => o.org === activeOrg.value) || { staff: [] }).staff)
const picked = ref(null)
function choose(s) { picked.value = { name: s.name, dept: activeOrg.value, title: s.title } }
function confirm() { if (picked.value) emit('select', picked.value) }
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal osp" role="dialog" aria-modal="true" :aria-label="title">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>
      <div class="osp-head">
        <div class="osp-title"><Icon name="users" :size="18" /> {{ title }}</div>
        <div class="osp-sub" v-if="current">현재 담당자 · <b>{{ current }}</b></div>
      </div>

      <div class="osp-body">
        <div class="osp-orgs">
          <div class="osp-colh">조직</div>
          <div class="osp-orglist">
            <button v-for="o in orgDirectory" :key="o.org" class="osp-org" :class="{ on: activeOrg === o.org }" @click="activeOrg = o.org; picked = null">
              <Icon name="folder" :size="13" /><span class="osp-orgn">{{ o.org }}</span><span class="osp-cn">{{ o.staff.length }}</span>
            </button>
          </div>
        </div>
        <div class="osp-staff">
          <div class="osp-colh">담당자 · {{ activeOrg }}</div>
          <div class="osp-stafflist">
            <button v-for="s in staff" :key="s.name" class="osp-person" :class="{ on: picked && picked.name === s.name }" @click="choose(s)">
              <span class="osp-av">{{ s.name.slice(0, 1) }}</span>
              <div class="osp-pbody"><div class="osp-pname">{{ s.name }}</div><div class="osp-pmeta">{{ activeOrg }} · {{ s.title }}</div></div>
              <Icon v-if="picked && picked.name === s.name" name="check" :size="16" class="osp-chk" />
            </button>
          </div>
        </div>
      </div>

      <div class="osp-actions">
        <span class="osp-pick" v-if="picked">선택 · <b>{{ picked.name }}</b> ({{ picked.dept }} {{ picked.title }})</span>
        <span class="grow"></span>
        <button class="btn btn-ghost" @click="emit('close')">취소</button>
        <button class="btn btn-primary" :disabled="!picked" @click="confirm"><Icon name="check" :size="14" /> 담당자 선택</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal.osp { width: min(680px, 100%); max-height: 88vh; padding: 24px 24px 20px; position: relative; display: flex; flex-direction: column; }
.osp-head { margin-bottom: 14px; }
.osp-title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 850; color: var(--ink); letter-spacing: -.3px; }
.osp-title svg { color: var(--navy); }
.osp-sub { margin-top: 6px; font-size: 12px; color: var(--gray); }
.osp-sub b { color: var(--ink); }

.osp-body { display: grid; grid-template-columns: 220px 1fr; gap: 12px; min-height: 300px; }
.osp-orgs, .osp-staff { display: flex; flex-direction: column; min-height: 0; }
.osp-colh { font-size: 11.5px; font-weight: 800; color: var(--gray-lt); padding: 4px 4px 8px; }
.osp-orglist, .osp-stafflist { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; max-height: 340px;
  background: var(--canvas); border: 1px solid var(--line); border-radius: var(--r-md); padding: 6px; }
.osp-org { display: flex; align-items: center; gap: 7px; padding: 9px 10px; border-radius: 8px; font-size: 13px; font-weight: 700; color: var(--gray); cursor: pointer; }
.osp-org:hover { background: var(--card); color: var(--ink); }
.osp-org.on { background: var(--navy-soft); color: var(--navy); }
.osp-orgn { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.osp-org svg { color: var(--navy); }
.osp-cn { font-size: 11px; font-weight: 800; color: var(--gray-lt); background: var(--card); border-radius: 20px; padding: 1px 7px; }
.osp-org.on .osp-cn { color: var(--navy); background: #fff; }

.osp-person { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 10px; background: var(--card); border: 1px solid transparent; cursor: pointer; }
.osp-person:hover { border-color: var(--line-strong); }
.osp-person.on { border-color: var(--navy); background: var(--navy-soft); }
.osp-av { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #E4ECFF, #CFDDFF); color: var(--navy);
  display: grid; place-items: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
.osp-pbody { flex: 1; min-width: 0; text-align: left; }
.osp-pname { font-size: 13.5px; font-weight: 750; color: var(--ink); }
.osp-pmeta { font-size: 11.5px; color: var(--gray-lt); margin-top: 2px; }
.osp-chk { color: var(--navy); }

.osp-actions { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); }
.osp-pick { font-size: 12px; color: var(--gray); }
.osp-pick b { color: var(--navy); font-weight: 800; }
.grow { flex: 1; }
@media (max-width: 560px) { .osp-body { grid-template-columns: 1fr; } }
</style>
