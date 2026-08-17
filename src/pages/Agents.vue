<script setup>
/**
 * Agent 목록 (에이전트 카탈로그) — 기능은 원본 그대로, 비주얼만 신규 디자인 토큰으로 재조판.
 * -----------------------------------------------------------------------------
 * 탭(내/전체/즐겨찾기) · 검색 · 상태필터 · 그리드/리스트 토글 · 폴더 바(+새 폴더)
 * · 해시태그(도구) 필터 · 폴더별 그룹 · 카드/행 액션(즐겨찾기·활성토글·폴더이동·공유·실행/권한요청)
 * 스타일은 이 파일 scoped <style> 에만 존재 → 다른 페이지 영향 없음.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { store, toggleActive, openRun, toggleFavorite, agentReady, resourcePerm, openRequest } from '../store.js'
import Icon from '../components/Icon.vue'
import AgentInfoModal from '../components/AgentInfoModal.vue'

const tabs = [
  { key: 'mine', label: '내 Agent' },
  { key: 'all', label: '전체 Agent' },
  { key: 'fav', label: '즐겨찾기', icon: 'star' },
]
const tab = ref('all')
const q = ref('')
const accessFilter = ref('all')   // all | yes(실행 가능) | no(도구 권한 필요)
const view = ref('grid')          // grid | list
const infoAgent = ref(null)
const tagFilter = ref('')         // 선택된 해시태그(도구)
const folderFilter = ref('전체')  // 선택된 그룹

// 데이터 상태 (loading/ready/error)
const dataState = ref('loading')
let timer
function load() {
  dataState.value = 'loading'
  clearTimeout(timer)
  timer = setTimeout(() => { dataState.value = Array.isArray(store.agents) ? 'ready' : 'error' }, 300)
}
onMounted(load)
onBeforeUnmount(() => clearTimeout(timer))

// 실행 가능 = 활용 도구를 모두 보유(내 소유는 활성 상태여야)
const isRunnable = a => agentReady(a) && (a.perm !== 'owner' || a.active)
// 요청중 = 실행 불가인데 미보유 도구가 전부 '요청중'
const agentPending = a =>
  !agentReady(a) &&
  (a.tools || []).some(t => resourcePerm(t) === 'pending') &&
  !(a.tools || []).some(t => ['none', 'denied'].includes(resourcePerm(t)))

// 즐겨찾기 / 내 Agent(소유) / 전체(타 Agent + 소유이면서 활성)
const inTab = a =>
  tab.value === 'fav' ? a.fav
    : tab.value === 'mine' ? a.perm === 'owner'
      : (a.perm !== 'owner' || a.active)

// 해시태그 = 도구명 모음
const allTags = computed(() => {
  const set = new Set()
  store.agents.forEach(a => (a.tools || []).forEach(t => set.add(t)))
  return [...set]
})
function toggleTag(t) { tagFilter.value = tagFilter.value === t ? '' : t }
const tagTrack = ref(null)
function scrollTags(dir) { tagTrack.value?.scrollBy({ left: dir * 260, behavior: 'smooth' }) }

// 그룹 목록/개수 (전사 그룹은 권한 관리 › 그룹 관리에서 생성)
const folderList = computed(() => {
  const set = new Set(store.agentGroups)
  store.agents.forEach(a => { if (a.folder) set.add(a.folder) })
  return ['전체', ...set]
})
function folderCount(f) {
  const base = store.agents.filter(inTab)
  return f === '전체' ? base.length : base.filter(a => a.folder === f).length
}

// 폴더 제외 전체 필터 + 공유 많은 순
const list = computed(() =>
  store.agents
    .filter(inTab)
    .filter(a => !tagFilter.value || (a.tools || []).includes(tagFilter.value))
    .filter(a => !q.value.trim() || (a.name + a.desc + a.owner).includes(q.value.trim()))
    .filter(a => accessFilter.value === 'all' || isRunnable(a) === (accessFilter.value === 'yes'))
    .slice()
    .sort((x, y) => y.shares - x.shares)
)

// 폴더별 그룹 섹션 (전체=폴더별 헤더 / 특정폴더=평면)
const sections = computed(() => {
  const base = list.value
  if (folderFilter.value !== '전체') {
    return [{ folder: folderFilter.value, items: base.filter(a => a.folder === folderFilter.value), header: false }]
  }
  return folderList.value
    .filter(f => f !== '전체')
    .map(f => ({ folder: f, items: base.filter(a => a.folder === f), header: true }))
    .filter(g => g.items.length)
})
const totalCount = computed(() => sections.value.reduce((n, g) => n + g.items.length, 0))

const tabCount = key =>
  key === 'fav' ? store.agents.filter(a => a.fav).length
    : key === 'mine' ? store.agents.filter(a => a.perm === 'owner').length
      : store.agents.filter(a => a.perm !== 'owner' || a.active).length

const filtered = computed(() => q.value.trim() || tagFilter.value || accessFilter.value !== 'all' || folderFilter.value !== '전체')
function resetFilters() { q.value = ''; tagFilter.value = ''; accessFilter.value = 'all'; folderFilter.value = '전체' }
</script>

<template>
  <div class="agv2">
    <!-- 툴바: 탭 · 검색/상태/보기 · 폴더 바 -->
    <div class="ax-toolbar">
      <div class="ax-tabs" role="tablist">
        <button v-for="t in tabs" :key="t.key" role="tab" :aria-selected="tab === t.key"
          :class="{ on: tab === t.key }" @click="tab = t.key">
          <Icon v-if="t.icon" :name="t.icon" :size="13" />{{ t.label }}<span class="ax-tn">{{ tabCount(t.key) }}</span>
        </button>
      </div>

      <div class="ax-filters">
        <label class="ax-search">
          <Icon name="search" :size="16" />
          <input v-model="q" placeholder="Agent 검색" aria-label="Agent 검색" />
          <button v-if="q" class="ax-x" @click="q = ''" aria-label="검색어 지우기"><Icon name="x" :size="13" /></button>
        </label>
        <select class="ax-select" v-model="accessFilter" aria-label="상태 필터">
          <option value="all">상태 전체</option>
          <option value="yes">실행 가능</option>
          <option value="no">도구 권한 필요</option>
        </select>
        <div class="ax-viewtoggle" role="group" aria-label="보기 방식">
          <button :class="{ on: view === 'grid' }" @click="view = 'grid'" aria-label="카드 보기" title="카드 보기"><Icon name="grid" :size="16" /></button>
          <button :class="{ on: view === 'list' }" @click="view = 'list'" aria-label="리스트 보기" title="리스트 보기"><Icon name="list" :size="16" /></button>
        </div>
      </div>

      <div class="ax-folderbar" role="group" aria-label="그룹">
        <button v-for="f in folderList" :key="f" class="ax-fchip" :class="{ on: folderFilter === f }" @click="folderFilter = f">
          <Icon :name="f === '전체' ? 'grid' : 'folder'" :size="13" />{{ f }}<span class="ax-fn">{{ folderCount(f) }}</span>
        </button>
      </div>
    </div>

    <!-- 해시태그(도구) 필터 · 한 줄 좌우 스크롤 -->
    <div class="ax-hashtags" v-if="allTags.length">
      <button class="ax-tagnav" @click="scrollTags(-1)" aria-label="태그 왼쪽으로"><Icon name="back" :size="14" /></button>
      <div class="ax-tagtrack" ref="tagTrack">
        <button v-for="t in allTags" :key="t" class="ax-tag-f" :class="{ on: tagFilter === t }" @click="toggleTag(t)">{{ t }}</button>
      </div>
      <button class="ax-tagnav" @click="scrollTags(1)" aria-label="태그 오른쪽으로"><Icon name="arrow" :size="14" /></button>
      <button v-if="tagFilter" class="ax-tagclear" @click="tagFilter = ''"><Icon name="x" :size="11" /> 초기화</button>
    </div>

    <!-- ══ LOADING ══ -->
    <div v-if="dataState === 'loading'" class="ax-grid" aria-busy="true">
      <div v-for="i in 6" :key="i" class="ax-skel">
        <div class="sk w60"></div><div class="sk w90"></div><div class="sk w75"></div>
        <div class="sk-foot"><span class="sk-pill"></span></div>
      </div>
    </div>

    <!-- ══ ERROR ══ -->
    <div v-else-if="dataState === 'error'" class="ax-statepanel">
      <div class="ax-state-ic err"><Icon name="zap" :size="22" /></div>
      <div class="ax-state-t">Agent 목록을 불러오지 못했어요</div>
      <div class="ax-state-d">잠시 후 다시 시도해 주세요.</div>
      <button class="ax-run" @click="load"><Icon name="arrow" :size="14" /> 다시 시도</button>
    </div>

    <!-- ══ READY ══ -->
    <template v-else-if="totalCount">
      <section v-for="g in sections" :key="g.folder" class="ax-group">
        <div class="ax-group-head" v-if="g.header">
          <Icon name="folder" :size="14" /><span class="ax-gh-name">{{ g.folder }}</span><span class="ax-gh-n">{{ g.items.length }}</span>
        </div>

        <!-- 카드 보기 -->
        <div class="ax-grid" v-if="view === 'grid'">
          <article v-for="a in g.items" :key="a.id" class="ax-card" role="button" tabindex="0"
            @click="infoAgent = a" @keydown.enter="infoAgent = a">
            <div class="ax-card-top">
              <h3 class="ax-name">{{ a.name }}</h3>
              <button class="ax-fav" :class="{ on: a.fav }" @click.stop="toggleFavorite(a)"
                :aria-pressed="a.fav" :aria-label="`즐겨찾기 ${a.fav ? '해제' : '추가'}`"><Icon name="star" :size="15" /></button>
            </div>
            <p class="ax-desc">{{ a.desc }}</p>
            <div class="ax-toolline">
              <span v-for="t in (a.tools || []).slice(0, 3)" :key="t" class="ax-tool">{{ t }}</span>
              <span v-if="(a.tools || []).length > 3" class="ax-tool more">+{{ a.tools.length - 3 }}</span>
            </div>
            <div class="ax-actions" @click.stop>
              <button v-if="a.perm === 'owner'" class="ax-toggle" :class="{ on: a.active }" @click="toggleActive(a)"
                :aria-pressed="a.active" :aria-label="`${a.name} ${a.active ? '비활성화' : '활성화'}`"></button>
              <span class="ax-folderbtn static" :title="`그룹: ${a.folder}`">
                <Icon name="folder" :size="12" /><span>{{ a.folder }}</span>
              </span>
              <span class="ax-share" title="공유 횟수"><Icon name="share" :size="11" /> {{ a.shares.toLocaleString() }}</span>
              <span class="grow"></span>
              <button v-if="agentReady(a)" class="ax-run" :disabled="a.perm === 'owner' && !a.active" @click="openRun(a)"><Icon name="play" :size="13" /> 실행</button>
              <button v-else-if="agentPending(a)" class="ax-pending" disabled><Icon name="clock" :size="12" /> 요청중</button>
              <button v-else class="ax-req" @click="openRequest('agent', a)"><Icon name="shield" :size="12" /> 권한 요청</button>
            </div>
          </article>
        </div>

        <!-- 리스트 보기 -->
        <div class="ax-list" v-else>
          <div v-for="a in g.items" :key="a.id" class="ax-row">
            <div class="ax-avatar">{{ a.name.slice(0, 1) }}</div>
            <div class="ax-row-main" role="button" tabindex="0" @click="infoAgent = a" @keydown.enter="infoAgent = a">
              <div class="ax-row-name">{{ a.name }}</div>
              <div class="ax-row-desc">{{ a.desc }}</div>
            </div>
            <div class="ax-row-owner">{{ a.owner }}</div>
            <div class="ax-row-meta">
              <span><Icon name="book" :size="12" /> {{ a.knowledge }}</span>
              <span>실행 {{ a.runs.toLocaleString() }}</span>
            </div>
            <div class="ax-row-act">
              <button v-if="a.perm === 'owner'" class="ax-toggle" :class="{ on: a.active }" @click="toggleActive(a)"
                :aria-pressed="a.active" :aria-label="`${a.name} ${a.active ? '비활성화' : '활성화'}`"></button>
              <button v-if="agentReady(a)" class="ax-run" :disabled="a.perm === 'owner' && !a.active" @click="openRun(a)"><Icon name="play" :size="13" /> 실행</button>
              <button v-else-if="agentPending(a)" class="ax-pending" disabled><Icon name="clock" :size="12" /> 요청중</button>
              <button v-else class="ax-req" @click="openRequest('agent', a)"><Icon name="shield" :size="12" /> 권한 요청</button>
            </div>
            <span class="ax-folderbtn row static" :title="`그룹: ${a.folder}`">
              <Icon name="folder" :size="12" /><span>{{ a.folder }}</span>
            </span>
            <button class="ax-fav" :class="{ on: a.fav }" @click="toggleFavorite(a)"
              :aria-pressed="a.fav" :aria-label="`즐겨찾기 ${a.fav ? '해제' : '추가'}`"><Icon name="star" :size="15" /></button>
            <button class="ax-info" @click="infoAgent = a" aria-label="Agent 정보"><Icon name="menu" :size="16" /></button>
          </div>
        </div>
      </section>
    </template>

    <!-- ══ EMPTY ══ -->
    <div v-else-if="dataState === 'ready'" class="ax-statepanel">
      <div class="ax-state-ic"><Icon :name="tab === 'fav' && !filtered ? 'star' : 'search'" :size="22" /></div>
      <template v-if="tab === 'fav' && !filtered">
        <div class="ax-state-t">즐겨찾기한 Agent가 없습니다</div>
        <div class="ax-state-d">카드의 별(★)을 눌러 자주 쓰는 Agent를 모아 두세요.</div>
      </template>
      <template v-else>
        <div class="ax-state-t">조건에 맞는 Agent가 없습니다</div>
        <div class="ax-state-d">검색어·그룹·상태·태그 필터를 조정해 보세요.</div>
        <button v-if="filtered" class="ax-req" @click="resetFilters"><Icon name="x" :size="13" /> 필터 초기화</button>
      </template>
    </div>

    <AgentInfoModal v-if="infoAgent" :agent="infoAgent" @close="infoAgent = null" />
  </div>
</template>

<style scoped>
/* ── 이 페이지 전용 토큰 (제안 시스템) ─────────────── */
.agv2{
  --surface-1:#F2F5FA; --surface-2:#FFFFFF; --surface-3:#E8EDF5;
  --border:#DBE2EC; --border-strong:#C0CAD8;
  --text-1:#19212E; --text-2:#566072; --text-3:#8892A2;
  --accent:#0046FF; --accent-hover:#0038CC; --accent-soft:#E6EDFF; --on-accent:#FFFFFF;
  --brand-yellow:#F5B301;
  --success:#0E8A66; --success-soft:#DCF1E9;
  --warning:#9A6700; --warning-soft:#FBEECB;
  --neutral:#6A7383; --neutral-soft:#EAEEF4;
  --radius-sm:6px; --radius-md:10px;
  --ring:0 0 0 3px rgba(0,70,255,.30);
  --fs-xs:12px; --fs-sm:13px; --fs-base:14px; --fs-md:16px;
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-6:24px;
  --sans:"Pretendard","Pretendard Variable",-apple-system,"Apple SD Gothic Neo","Malgun Gothic","Segoe UI",system-ui,sans-serif;
  font-family:var(--sans); color:var(--text-2); font-size:var(--fs-base);
}
:root[data-theme="dark"] .agv2{
  --surface-1:#0F1319; --surface-2:#171C24; --surface-3:#1F2630;
  --border:#2A313C; --border-strong:#3A4353;
  --text-1:#EAEDF2; --text-2:#A2ABBA; --text-3:#6F7A8A;
  --accent:#5B87FF; --accent-hover:#789EFF; --accent-soft:#1B2740; --on-accent:#0B1220;
  --success:#4FB894; --success-soft:#13251E;
  --warning:#E0A93A; --warning-soft:#2A2213;
  --neutral:#99A3B2; --neutral-soft:#1D232C;
  --ring:0 0 0 3px rgba(91,135,255,.40);
}
.agv2 *{box-sizing:border-box}
.grow{flex:1}

/* ── 툴바 ── */
.ax-toolbar{display:flex;flex-direction:column;gap:var(--sp-3);margin-bottom:var(--sp-4)}
.ax-tabs{display:inline-flex;align-self:flex-start;background:var(--surface-3);border-radius:var(--radius-sm);padding:3px}
.ax-tabs button{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 var(--sp-3);border:0;border-radius:5px;
  background:transparent;color:var(--text-2);font:inherit;font-size:var(--fs-sm);font-weight:600;cursor:pointer}
.ax-tabs button.on{background:var(--surface-2);color:var(--text-1);box-shadow:0 1px 2px rgba(18,28,54,.08)}
.ax-tn{font-size:11px;font-weight:600;color:var(--text-3);font-variant-numeric:tabular-nums}
.ax-tabs button.on .ax-tn{color:var(--accent)}

.ax-filters{display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap}
.ax-search{display:flex;align-items:center;gap:var(--sp-2);height:38px;padding:0 var(--sp-3);min-width:220px;flex:1;max-width:340px;
  background:var(--surface-2);border:1px solid var(--border-strong);border-radius:var(--radius-sm)}
.ax-search:focus-within{border-color:var(--accent);box-shadow:var(--ring)}
.ax-search svg{color:var(--text-3);flex-shrink:0}
.ax-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--text-1);font:inherit;font-size:var(--fs-sm)}
.ax-x{border:0;background:transparent;color:var(--text-3);cursor:pointer;display:grid;place-items:center}
.ax-x:hover{color:var(--text-1)}
.ax-select{height:38px;padding:0 var(--sp-3);background:var(--surface-2);border:1px solid var(--border-strong);border-radius:var(--radius-sm);
  color:var(--text-1);font:inherit;font-size:var(--fs-sm);cursor:pointer}
.ax-select:focus{outline:none;border-color:var(--accent);box-shadow:var(--ring)}
.ax-viewtoggle{display:inline-flex;background:var(--surface-2);border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:2px}
.ax-viewtoggle button{width:32px;height:32px;display:grid;place-items:center;border:0;border-radius:4px;background:transparent;color:var(--text-3);cursor:pointer}
.ax-viewtoggle button.on{background:var(--accent-soft);color:var(--accent)}

/* 폴더 바 */
.ax-folderbar{display:flex;flex-wrap:wrap;gap:6px}
.ax-fchip{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border:1px solid var(--border);border-radius:999px;
  background:var(--surface-2);color:var(--text-2);font:inherit;font-size:var(--fs-xs);font-weight:600;cursor:pointer;transition:border-color .12s,color .12s}
.ax-fchip svg{color:var(--text-3)}
.ax-fchip:hover{border-color:var(--border-strong);color:var(--text-1)}
.ax-fchip.on{background:var(--accent-soft);border-color:transparent;color:var(--accent)}
.ax-fchip.on svg{color:var(--accent)}
.ax-fn{font-size:11px;color:var(--text-3);font-variant-numeric:tabular-nums}
.ax-fchip.on .ax-fn{color:var(--accent)}
.ax-fchip.add{border-style:dashed;color:var(--text-3)}
.ax-fchip.add:hover{border-color:var(--accent);color:var(--accent)}

/* ── 해시태그 필터 ── */
.ax-hashtags{display:flex;align-items:center;gap:6px;margin-bottom:var(--sp-4)}
.ax-tagnav{width:28px;height:28px;flex-shrink:0;display:grid;place-items:center;border:1px solid var(--border);border-radius:var(--radius-sm);
  background:var(--surface-2);color:var(--text-3);cursor:pointer}
.ax-tagnav:hover{color:var(--text-1);border-color:var(--border-strong)}
.ax-tagtrack{display:flex;gap:6px;overflow-x:auto;scroll-behavior:smooth;scrollbar-width:none}
.ax-tagtrack::-webkit-scrollbar{display:none}
.ax-tag-f{flex-shrink:0;height:28px;padding:0 11px;border:1px solid var(--border);border-radius:999px;background:var(--surface-2);
  color:var(--text-2);font:inherit;font-size:var(--fs-xs);font-weight:500;cursor:pointer;white-space:nowrap;transition:border-color .12s,color .12s}
.ax-tag-f:hover{border-color:var(--border-strong);color:var(--text-1)}
.ax-tag-f.on{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.ax-tagclear{flex-shrink:0;display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 10px;border:0;border-radius:var(--radius-sm);
  background:var(--neutral-soft);color:var(--text-2);font:inherit;font-size:var(--fs-xs);font-weight:600;cursor:pointer}

/* ── 그룹 ── */
.ax-group{margin-bottom:var(--sp-6)}
.ax-group-head{display:flex;align-items:center;gap:7px;font-size:var(--fs-sm);font-weight:700;color:var(--text-1);margin-bottom:var(--sp-3)}
.ax-group-head svg{color:var(--text-3)}
.ax-gh-n{font-size:var(--fs-xs);font-weight:600;color:var(--text-3);font-variant-numeric:tabular-nums}

/* ── 카드 ── */
.ax-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--sp-3)}
.ax-card{display:flex;flex-direction:column;gap:var(--sp-2);background:var(--surface-2);border:1px solid var(--border);
  border-radius:var(--radius-md);padding:var(--sp-4);cursor:pointer;transition:border-color .13s,transform .13s}
.ax-card:hover{border-color:var(--border-strong);transform:translateY(-1px)}
.ax-card:focus-visible{outline:none;box-shadow:var(--ring);border-color:var(--accent)}
.ax-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-2)}
.ax-name{margin:0;font-size:var(--fs-md);font-weight:600;color:var(--text-1);letter-spacing:-.01em;line-height:1.3}
.ax-fav{flex-shrink:0;border:0;background:transparent;color:var(--text-3);cursor:pointer;display:grid;place-items:center;padding:2px;opacity:.55;transition:opacity .12s,color .12s}
.ax-card:hover .ax-fav,.ax-row:hover .ax-fav{opacity:1}
.ax-fav.on{color:var(--brand-yellow);opacity:1}
.ax-desc{margin:0;font-size:var(--fs-sm);color:var(--text-2);line-height:1.5;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ax-toolline{display:flex;flex-wrap:wrap;align-items:center;font-size:var(--fs-xs);color:var(--text-3)}
.ax-tool{color:var(--text-3)}
.ax-tool + .ax-tool::before{content:"·";margin:0 6px;color:var(--border-strong)}
.ax-tool.more{margin-left:8px}

.ax-actions{display:flex;align-items:center;gap:var(--sp-2);margin-top:auto;padding-top:var(--sp-3)}
.ax-share{display:inline-flex;align-items:center;gap:4px;font-size:var(--fs-xs);color:var(--text-3)}
.ax-share svg{color:var(--text-3)}

/* 액션 버튼 */
.ax-run{display:inline-flex;align-items:center;gap:5px;border:0;background:var(--accent);color:var(--on-accent);
  font:inherit;font-size:var(--fs-sm);font-weight:600;padding:7px 13px;border-radius:var(--radius-sm);cursor:pointer;transition:background .12s}
.ax-run:hover{background:var(--accent-hover)}
.ax-run:disabled{opacity:.45;cursor:not-allowed}
.ax-req{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border-strong);background:var(--surface-2);color:var(--text-2);
  font:inherit;font-size:var(--fs-sm);font-weight:600;padding:6px 11px;border-radius:var(--radius-sm);cursor:pointer;transition:border-color .12s,color .12s}
.ax-req:hover{border-color:var(--text-3);color:var(--text-1)}
.ax-pending{display:inline-flex;align-items:center;gap:5px;border:0;font:inherit;font-size:var(--fs-sm);font-weight:600;
  color:var(--warning);background:var(--warning-soft);padding:6px 11px;border-radius:var(--radius-sm);cursor:default}
.ax-toggle{position:relative;width:36px;height:21px;border:0;border-radius:999px;background:var(--neutral);cursor:pointer;transition:background .15s;flex-shrink:0}
.ax-toggle::after{content:'';position:absolute;top:2px;left:2px;width:17px;height:17px;border-radius:50%;background:#fff;transition:transform .15s}
.ax-toggle.on{background:var(--success)} .ax-toggle.on::after{transform:translateX(15px)}
.ax-folderbtn{display:inline-flex;align-items:center;gap:4px;max-width:110px;border:1px solid var(--border);border-radius:var(--radius-sm);
  background:transparent;color:var(--text-3);font:inherit;font-size:var(--fs-xs);font-weight:600;padding:4px 8px;cursor:pointer;transition:border-color .12s,color .12s}
.ax-folderbtn span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ax-folderbtn:hover{border-color:var(--border-strong);color:var(--text-1)}
.ax-folderbtn.static{cursor:default}
.ax-folderbtn.static:hover{border-color:var(--border);color:var(--text-3)}

/* ── 리스트 보기 ── */
.ax-list{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden}
.ax-row{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);border-bottom:1px solid var(--border)}
.ax-row:last-child{border-bottom:none}
.ax-row:hover{background:var(--surface-1)}
.ax-avatar{width:34px;height:34px;flex-shrink:0;border-radius:var(--radius-sm);background:var(--accent-soft);color:var(--accent);
  display:grid;place-items:center;font-weight:700;font-size:var(--fs-sm)}
.ax-row-main{flex:1;min-width:0;cursor:pointer}
.ax-row-name{font-size:var(--fs-sm);font-weight:600;color:var(--text-1)}
.ax-row-desc{font-size:var(--fs-xs);color:var(--text-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ax-row-owner{width:96px;flex-shrink:0;font-size:var(--fs-xs);color:var(--text-2)}
.ax-row-meta{display:flex;flex-direction:column;gap:2px;width:96px;flex-shrink:0;font-size:11px;color:var(--text-3)}
.ax-row-meta span{display:inline-flex;align-items:center;gap:4px}
.ax-row-meta svg{color:var(--text-3)}
.ax-row-act{display:flex;align-items:center;gap:var(--sp-2);flex-shrink:0}
.ax-folderbtn.row{flex-shrink:0}
.ax-info{width:30px;height:30px;flex-shrink:0;display:grid;place-items:center;border:0;border-radius:var(--radius-sm);background:transparent;color:var(--text-3);cursor:pointer}
.ax-info:hover{background:var(--surface-3);color:var(--text-1)}
@media (max-width:920px){ .ax-row-owner,.ax-row-meta{display:none} }

/* ── 로딩 스켈레톤 ── */
.ax-skel{display:flex;flex-direction:column;gap:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);padding:var(--sp-4);min-height:150px}
.sk{height:11px;border-radius:4px;background:var(--surface-3)}
.sk.w60{width:60%;height:15px}.sk.w90{width:90%}.sk.w75{width:75%}
.sk-foot{margin-top:auto;padding-top:var(--sp-3)}
.sk-pill{display:block;width:72px;height:26px;border-radius:var(--radius-sm);background:var(--surface-3)}
.ax-skel .sk,.ax-skel .sk-pill{animation:sk 1.3s ease-in-out infinite}
@keyframes sk{50%{opacity:.45}}

/* ── 상태 패널(에러·빈) ── */
.ax-statepanel{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;
  padding:48px var(--sp-6);background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md)}
.ax-state-ic{width:48px;height:48px;border-radius:var(--radius-md);display:grid;place-items:center;margin-bottom:6px;background:var(--surface-3);color:var(--text-3)}
.ax-state-ic.err{background:var(--warning-soft);color:var(--warning)}
.ax-state-t{font-size:var(--fs-md);font-weight:600;color:var(--text-1)}
.ax-state-d{font-size:var(--fs-sm);color:var(--text-2);max-width:44ch}
.ax-statepanel .ax-run,.ax-statepanel .ax-req{margin-top:var(--sp-3)}

@media (prefers-reduced-motion:reduce){
  .ax-card,.ax-run,.ax-toggle::after{transition:none}
  .ax-skel .sk,.ax-skel .sk-pill{animation:none}
}
</style>
