<script setup>
/**
 * 툴 상세 팝업 — 툴 관리 카드 클릭 시 표시 · [담당: 개발자 C]
 * -----------------------------------------------------------------------------
 * 리소스(도구·미들웨어·스킬·MCP)의 설명·LLM 프롬프트·파라미터·필요 환경변수를 보여준다.
 * 파라미터/환경변수/프롬프트/버전은 유형별 스펙(TOOL_SPECS)에서 생성(목데이터).
 */
import { computed } from 'vue'
import { store, requestResource, cancelRequest } from '../store.js'
import Icon from './Icon.vue'

const props = defineProps({ tool: { type: Object, required: true } })
const emit = defineEmits(['close'])

const TYPE_LABEL = { tool: '도구', mcp: 'MCP', middleware: '미들웨어', skill: '스킬' }

// 유형별 스펙 (버전·프롬프트·파라미터·환경변수). {SLUG}=도구명 영문 슬러그로 치환.
const TOOL_SPECS = {
  tool: {
    version: 'v1.4',
    prompt: '검색 쿼리는 사용자 질문의 핵심 키워드와 관련 용어를 포함해 명확하게 구조화합니다.\n근거가 부족하면 추측하지 않고 출처(문서·조항)를 함께 제시합니다.',
    params: [
      ['query', 'string', true, '검색 쿼리. 사용자 질문의 핵심 키워드와 관련 용어를 포함한 명확한 표현 사용'],
      ['limit', 'integer', false, '반환할 검색 결과 개수 (기본값 5, RAG 챗봇은 8 권장)'],
      ['search_type', 'string', false, '검색 모드. "hybrid"(의미+키워드, 권장) · "semantic"(의미론적) · "keyword"(키워드)'],
    ],
    env: ['{SLUG}_API_URL', '{SLUG}_API_KEY'],
  },
  mcp: {
    version: 'v2.0',
    prompt: '사용자 요청을 MCP 도구 입력 스키마에 맞게 구조화합니다.\n민감정보는 최소 범위로 전달하고 실행 전 변경 여부를 확인합니다.',
    params: [
      ['query', 'string', true, '조회 또는 실행할 요청 내용'],
      ['limit', 'integer', false, '최대 결과 개수 (기본값 20)'],
      ['include_source', 'boolean', false, '근거 데이터(출처) 포함 여부'],
    ],
    env: ['{SLUG}_MCP_URL', '{SLUG}_API_KEY'],
  },
  middleware: {
    version: 'v1.2',
    prompt: '연동 대상 시스템의 표준 포맷으로 요청을 변환해 전달합니다.\n실패 시 재시도 정책과 응답 코드를 함께 반환합니다.',
    params: [
      ['action', 'string', true, '수행할 연동 작업 (조회 · 등록 · 발송 등)'],
      ['payload', 'object', false, '작업에 필요한 데이터'],
    ],
    env: ['{SLUG}_ENDPOINT', '{SLUG}_TOKEN'],
  },
  skill: {
    version: 'v1.1',
    prompt: '입력 텍스트를 스킬 목적에 맞게 처리하고 결과를 정형화(JSON)해 반환합니다.',
    params: [
      ['input', 'string', true, '처리할 원문 텍스트'],
      ['options', 'object', false, '길이 · 형식 등 처리 옵션'],
    ],
    env: [],
  },
}

const spec = computed(() => TOOL_SPECS[props.tool.type] || TOOL_SPECS.tool)
function envSlug(name) { const m = (name || '').match(/[A-Za-z0-9]+/g); return m ? m[0].toUpperCase() : 'AX' }
const envVars = computed(() => spec.value.env.map(e => e.replace('{SLUG}', envSlug(props.tool.name))))
const isMine = computed(() => props.tool.perm === 'granted' || props.tool.perm === 'owner')

function onPrimary() {
  const t = props.tool
  if (isMine.value) { emit('close'); return }
  if (t.perm === 'pending') {
    const req = store.requests.find(x => x.mine && x.status === 'pending' && x.targetType === 'resource' && x.targetName === t.name)
    if (req) cancelRequest(req)
  } else {
    requestResource(t.name)
  }
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal tdm" role="dialog" aria-modal="true" :aria-label="tool.name">
      <button class="modal-close" @click="emit('close')" aria-label="닫기"><Icon name="x" :size="18" /></button>

      <div class="tdm-title">{{ tool.name }}</div>
      <div class="tdm-desc">{{ tool.desc }}</div>

      <details class="tdm-prompt">
        <summary>LLM 프롬프트<Icon name="arrow" :size="14" class="tdm-chev" /></summary>
        <pre>{{ spec.prompt }}</pre>
      </details>

      <div class="tdm-badges">
        <span class="proto-badge" :class="'p-' + tool.proto">{{ tool.proto }}</span>
        <span class="tdm-ver">{{ spec.version }}</span>
        <span class="tool-kind" :class="'t-' + tool.type">{{ TYPE_LABEL[tool.type] || tool.type }}</span>
        <span v-if="tool.dept" class="tool-dept"><Icon name="users" :size="11" /> {{ tool.dept }}</span>
      </div>

      <div class="tdm-sec"><Icon name="gear" :size="15" /> 파라미터 <span class="tdm-cnt">({{ spec.params.length }})</span></div>
      <div class="tdm-params">
        <div v-for="p in spec.params" :key="p[0]" class="tdm-param">
          <div class="tdm-param-head">
            <code>{{ p[0] }}</code><span class="tdm-ptype">{{ p[1] }}</span>
            <span v-if="p[2]" class="tdm-req">required</span>
          </div>
          <div class="tdm-param-desc">{{ p[3] }}</div>
        </div>
      </div>

      <div class="tdm-sec"><Icon name="tool" :size="15" /> 필요한 환경 변수 <span class="tdm-cnt">({{ envVars.length }})</span></div>
      <div class="tdm-envs" v-if="envVars.length">
        <span v-for="e in envVars" :key="e" class="tdm-env">{{ e }}</span>
      </div>
      <div class="tdm-envs-empty" v-else>별도 환경 변수 없이 사용할 수 있습니다.</div>

      <div class="tdm-actions">
        <button class="btn btn-ghost" @click="emit('close')">닫기</button>
        <button v-if="isMine" class="btn tdm-owned" disabled>보유 중</button>
        <button v-else-if="tool.perm === 'pending'" class="btn btn-ghost" @click="onPrimary">요청 취소</button>
        <button v-else class="btn btn-gray" @click="onPrimary"><Icon name="shield" :size="13" /> {{ tool.perm === 'denied' ? '재요청' : '권한 신청' }}</button>
      </div>
    </div>
  </div>
</template>
