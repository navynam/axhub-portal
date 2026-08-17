<script setup>
/**
 * 지식 요청함 (커뮤니티형) — 지식관리 '요청함' 모드 · [담당: 개발자 B]
 * -----------------------------------------------------------------------------
 * ① 지식 요청 목록: 사유·내용·첨부·코멘트 스레드. 관리자는 진행/승인/반려 + '지식 등록'.
 * ② 문서 등록 승인 대기: 컬렉션 관리자가 업로드된 문서 등록 요청을 승인/반려.
 */
import { ref, computed } from 'vue'
import {
  store, knReqStatusLabel, knReqStatusCls,
  commentKnowledgeRequest, setKnowledgeRequestStatus, cancelKnowledgeRequest,
  approveDocRegistration, rejectDocRegistration,
} from '../store.js'
import Icon from './Icon.vue'

const emit = defineEmits(['register'])   // 관리자가 요청 근거로 지식 등록 → 부모가 업로드 모달 오픈

const isAdmin = computed(() => store.role === 'admin')
const requests = computed(() => store.knowledgeRequests)
const pendingDocs = computed(() => store.docRequests.filter(d => d.status === 'pending'))

const commentText = ref({})
function addComment(req) { if (commentKnowledgeRequest(req, commentText.value[req.id])) commentText.value[req.id] = '' }
function setStatus(req, s) { setKnowledgeRequestStatus(req, s) }
function cancel(req) { if (window.confirm('이 지식 요청을 취소할까요?')) cancelKnowledgeRequest(req) }
</script>

<template>
  <div class="knr">
    <!-- ① 지식 요청 -->
    <div class="knr-sec-head"><Icon name="book" :size="15" /> 지식 요청 <span class="count">{{ requests.length }}</span></div>

    <div v-if="requests.length" class="knr-list">
      <div v-for="req in requests" :key="req.id" class="knr-card">
        <div class="knr-top">
          <div class="knr-title">{{ req.title }}</div>
          <span class="pill pill-sm" :class="knReqStatusCls[req.status]">{{ knReqStatusLabel[req.status] }}</span>
        </div>
        <div class="knr-meta">
          {{ req.requester }} · {{ req.dept }} · {{ req.createdAt }}
          <span v-if="req.targetName"> · 대상 <b>{{ req.targetName }}</b></span>
        </div>
        <div class="knr-content">{{ req.content }}</div>
        <div class="knr-files" v-if="req.files.length">
          <span v-for="(f, i) in req.files" :key="i" class="knr-file"><Icon name="doc" :size="11" /> {{ f.name }}</span>
        </div>

        <!-- 코멘트 스레드 -->
        <div class="knr-comments" v-if="req.comments.length">
          <div v-for="(c, i) in req.comments" :key="i" class="knr-comment" :class="{ admin: c.role === 'admin' }">
            <span class="knc-who">{{ c.author }}<em v-if="c.role === 'admin'">관리자</em></span>
            <span class="knc-text">{{ c.text }}</span>
            <span class="knc-at">{{ c.at }}</span>
          </div>
        </div>

        <!-- 코멘트 입력 -->
        <div class="knr-cbar">
          <input v-model="commentText[req.id]" class="knr-cinput" placeholder="코멘트 입력…" @keydown.enter="addComment(req)" aria-label="코멘트" />
          <button class="btn btn-ghost btn-sm" @click="addComment(req)">등록</button>
        </div>

        <!-- 처리 액션 -->
        <div class="knr-actions">
          <template v-if="isAdmin">
            <button v-if="req.status !== 'progress'" class="btn btn-ghost btn-sm" @click="setStatus(req, 'progress')">진행</button>
            <button class="btn btn-gray btn-sm" @click="emit('register', req)"><Icon name="doc" :size="12" /> 지식 등록</button>
            <span class="grow" style="flex:1"></span>
            <button class="btn btn-ghost btn-sm" @click="setStatus(req, 'rejected')">반려</button>
            <button class="btn btn-primary btn-sm" @click="setStatus(req, 'approved')">승인</button>
          </template>
          <button v-else-if="req.requester === store.user.name && req.status === 'pending'" class="btn btn-ghost btn-sm" @click="cancel(req)">요청 취소</button>
        </div>
      </div>
    </div>
    <div v-else class="card empty"><b>등록된 지식 요청이 없습니다</b>상단 ‘지식 요청’ 버튼으로 요청을 등록해 보세요.</div>

    <!-- ② 문서 등록 승인 대기 (관리자) -->
    <template v-if="isAdmin && pendingDocs.length">
      <div class="knr-sec-head" style="margin-top:24px"><Icon name="doc" :size="15" /> 문서 등록 승인 대기 <span class="count">{{ pendingDocs.length }}</span></div>
      <div class="knr-list">
        <div v-for="dr in pendingDocs" :key="dr.id" class="knr-card knr-doc">
          <div class="knr-top">
            <div class="knr-title">{{ dr.docName }} <span class="knr-ver">{{ dr.version }}</span></div>
            <span class="pill pill-pending pill-sm">승인 대기</span>
          </div>
          <div class="knr-meta">컬렉션 <b>{{ dr.knowledgeName }}</b> · 요청 {{ dr.requester }} · {{ dr.createdAt }}</div>
          <div class="knr-content" v-if="dr.reason">{{ dr.reason }}</div>
          <div class="knr-files"><span v-for="(f, i) in dr.files" :key="i" class="knr-file"><Icon name="doc" :size="11" /> {{ f.name }}</span></div>
          <div class="knr-actions">
            <span class="grow" style="flex:1"></span>
            <button class="btn btn-ghost btn-sm" @click="rejectDocRegistration(dr)">반려</button>
            <button class="btn btn-primary btn-sm" @click="approveDocRegistration(dr)"><Icon name="check" :size="12" /> 승인 · 등록</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
