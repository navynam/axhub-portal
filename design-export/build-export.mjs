/**
 * 디자인 내보내기 생성기 — Claude(디자이너)가 볼 수 있는 자체완결 HTML 생성
 * -----------------------------------------------------------------------------
 * 실제 src/styles.css 를 읽어 각 화면 HTML(사이드바+헤더+본문)에 인라인한다.
 * 소스가 바뀌면 `node design-export/build-export.mjs` 재실행으로 갱신.
 *
 * 산출물: design-export/*.html (home/agents/knowledge/chat) + index.html
 * 사용법: 각 html 을 브라우저로 열거나 Claude 에게 전달 → 재디자인 → 개발에 반영
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = __dirname
mkdirSync(outDir, { recursive: true })
const css = readFileSync(join(root, 'src', 'styles.css'), 'utf8')

const FONT = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />'

/* ── 아이콘 (src/components/Icon.vue 의 path 발췌) ── */
const ICONS = {
  home: ['M3 11.2 12 4l9 7.2', 'M5.5 9.8V20h13V9.8'],
  bot: ['M12 3v3', 'M5 8.5h14a1 1 0 0 1 1 1V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9.5a1 1 0 0 1 1-1z', 'M9 13.5h.01', 'M15 13.5h.01'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  chat: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  users: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'm21 21-4.35-4.35'],
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  list: ['M8 6h12', 'M8 12h12', 'M8 18h12', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
  star: ['M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'],
  folder: ['M4 7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
  play: ['m6 4 13 8-13 8z'],
  download: ['M12 3v12', 'm7 10 5 5 5-5', 'M5 21h14'],
  share: ['M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'm8.6 13.5 6.8 3.9', 'm15.4 6.5-6.8 3.9'],
  arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
  doc: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6'],
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  send: ['m22 2-7 20-4-9-9-4z', 'M22 2 11 13'],
  edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
  plus: ['M12 5v14', 'M5 12h14'],
  clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  dots: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
  cpu: ['M6 6h12v12H6z', 'M9 3v3', 'M15 3v3', 'M9 18v3', 'M15 18v3', 'M18 9h3', 'M18 15h3', 'M3 9h3', 'M3 15h3'],
  collapse: ['m11 17-5-5 5-5', 'm18 17-5-5 5-5'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'],
  gear: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9.4A1.7 1.7 0 0 0 10.6 3V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9.4a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'],
  book2: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
}
const ic = (name, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(ICONS[name] || []).map(d => `<path d="${d}"/>`).join('')}</svg>`

/* ── 공통 셸 (사이드바 + 헤더) ── */
function sidebar(active) {
  const item = (key, icon, label, caret) =>
    `<div class="nav-item"><button class="${active === key ? 'on' : ''}"><span class="ico">${ic(icon)}</span><span class="label">${label}</span><span class="grow"></span>${caret ? '<span class="caret">›</span>' : ''}</button></div>`
  const reco = (icon, title, desc) =>
    `<button class="reco-item"><span class="reco-ic">${ic(icon, 16)}</span><span class="reco-body"><b>${title}</b><small>${desc}</small></span></button>`
  return `<aside class="sidebar">
  <div class="side-head">
    <div class="side-logo"><span class="sh">S</span><span class="side-logo-txt">신한<b>라이프</b></span></div>
    <button class="side-collapse">${ic('collapse')}</button>
  </div>
  <nav class="side-nav">
    ${item('home', 'home', '홈', false)}
    ${item('agents', 'bot', '에이전트', false)}
    ${item('knowledge', 'book', '지식관리', false)}
    ${item('community', 'chat', '라운지', true)}
    ${item('mypage', 'users', '마이페이지', true)}
  </nav>
  <div class="side-reco">
    <div class="side-reco-title">추천 자료</div>
    ${reco('book', 'AX 활용 가이드', '에이전트 시작하기')}
    ${reco('star', '이달의 추천 Agent', '규정·컴플라이언스')}
    ${reco('shield', '권한 신청 방법', '도구·지식 권한 안내')}
    ${reco('chat', '자주 묻는 질문', 'FAQ · 문의 게시판')}
  </div>
</aside>`
}
function header(title) {
  return `<header class="app-header">
  <div class="app-title"><span class="app-ci">CI</span> ${title}</div>
  <div class="app-actions">
    <button class="hdr-btn">${ic('bell')}<span class="hdr-dot"></span></button>
    <button class="hdr-btn">${ic('gear')}</button>
    <div class="hdr-role"><button class="on">사용자</button><button>관리자</button></div>
    <button class="hdr-profile"><span class="hdr-avatar">김</span><span class="hdr-user"><b>김신한</b><small>영업추진팀</small></span></button>
  </div>
</header>`
}
function page({ file, title, active, body, theme = 'default' }) {
  const html = `<!doctype html>
<html lang="ko" data-theme="${theme}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>AX-HUB · ${title}</title>
${FONT}
<style>
${css}
</style>
</head>
<body>
<div class="app">
${sidebar(active)}
<main class="content">
${header(title)}
<div class="content-scroll"><div class="content-inner">
${body}
</div></div>
</main>
</div>
</body>
</html>`
  writeFileSync(join(outDir, file), html, 'utf8')
  return file
}

/* ══════════════════ 화면 본문 ══════════════════ */

// 1) 에이전트 카탈로그
const AGENTS = (() => {
  const tag = t => `<span class="ax-tag">${t}</span>`
  const card = (name, desc, tags, folder, shares, state, owner) => {
    const action = state === 'run'
      ? `<button class="btn btn-primary btn-sm">${ic('play', 13)} 실행</button>`
      : state === 'pending'
        ? `<button class="btn btn-ghost btn-sm" disabled>${ic('clock', 12)} 요청중</button>`
        : `<button class="btn btn-gray btn-sm">${ic('shield', 12)} 권한 요청</button>`
    return `<div class="card ax-card">
      <button class="ax-fav ${owner ? 'on' : ''}">${ic('star', 16)}</button>
      <div class="ax-card-body">
        <div class="ax-name">${name}</div>
        <div class="ax-desc">${desc}</div>
        <div class="ax-tags">${tags.map(tag).join('')}</div>
      </div>
      <div class="ax-actions">
        ${owner ? '<button class="toggle sm on"></button>' : ''}
        <button class="ax-folder">${ic('folder', 12)}<span class="axf-name">${folder}</span></button>
        <span class="ax-share">${ic('share', 11)} ${shares}</span>
        <span class="grow"></span>
        ${action}
      </div>
    </div>`
  }
  const chip = t => `<button class="hashtag">#${t}</button>`
  return `<div class="catalog-toolbar">
  <div class="tabs" role="tablist">
    <button>내 Agent<span class="n">2</span></button>
    <button class="on">전체 Agent<span class="n">9</span></button>
    <button>${ic('star', 13)} 즐겨찾기<span class="n">3</span></button>
  </div>
  <div class="filters">
    <div class="search">${ic('search', 16)}<input placeholder="Agent 검색" /></div>
    <select class="select"><option>상태 전체</option></select>
    <div class="view-toggle"><button class="on">${ic('grid', 16)}</button><button>${ic('list', 16)}</button></div>
  </div>
  <div class="folder-bar">
    <button class="folder-chip on">${ic('grid', 13)}전체<span class="fc-n">9</span></button>
    <button class="folder-chip">${ic('folder', 13)}나의 업무<span class="fc-n">2</span></button>
    <button class="folder-chip">${ic('folder', 13)}미분류<span class="fc-n">7</span></button>
    <button class="folder-chip add">${ic('plus', 13)} 새 폴더</button>
  </div>
</div>
<div class="hashtags">${['메일 연동', '문서 요약', '표 데이터 분석', '문서 검색', 'FAQ 검색', '규정 검색', '조항 인용'].map(chip).join('')}</div>
<section class="folder-group">
  <div class="folder-group-head">${ic('folder', 15)}<span class="fgh-name">미분류</span><span class="fgh-count">7</span></div>
  <div class="ax-grid">
    ${card('규정·컴플라이언스 Agent', '사내 규정 질의에 근거 조항과 함께 답변합니다.', ['규정 검색', '조항 인용'], '미분류', '289', 'run', false)}
    ${card('IT 헬프데스크 Agent', '사내 IT 문의를 1차 응대하고 티켓을 분류합니다.', ['티켓 분류', '지식 검색'], '미분류', '388', 'run', false)}
    ${card('문서 초안 작성 Agent', '보고서·공문 초안을 사내 양식으로 작성합니다.', ['사내 양식 템플릿', '문서 생성'], '미분류', '193', 'request', false)}
    ${card('보험금 심사 지원 Agent', '심사 기준 지식 기반으로 심사 검토 의견을 생성합니다.', ['심사 기준 검색', '유사 사례 비교'], '미분류', '128', 'pending', false)}
    ${card('재무분석 Agent', '분기 재무 데이터를 분석하고 리포트 초안을 작성합니다.', ['표 데이터 분석', '차트 생성'], '미분류', '39', 'request', false)}
    ${card('상품 약관 Q&A Agent', '보험 상품 약관을 근거와 함께 답변합니다.', ['약관 검색', '근거 조항 인용'], '미분류', '108', 'request', false)}
  </div>
</section>`
})()

// 2) 홈 (Main Type B)
const HOME = (() => {
  const tile = (name, icon, sub) => `<div class="mtb-tile">${icon ? `<div class="mtb-tile-ic">${ic(icon, 16)}</div>` : ''}<div class="mtb-tile-name">${name}</div>${sub ? `<div class="mtb-tile-sub">${sub}</div>` : ''}</div>`
  const stat = (label, value, icon) => `<div class="mtb-stat"><div class="mtb-stat-ic">${ic(icon, 18)}</div><div class="mtb-stat-l">${label}</div><div class="mtb-stat-n">${value}</div></div>`
  const col = (title, items) => `<div class="mtb-col"><div class="mtb-col-head">${title} <button class="mtb-more">${ic('arrow', 15)}</button></div><ul class="mtb-col-list">${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`
  const ws = (name, desc, tags) => `<div class="mtb-ws-card"><div class="mtb-ws-name">${name}</div><div class="mtb-ws-desc">${desc}</div><div class="mtb-ws-tags">${tags.map(t => `<span class="ax-tag">${t}</span>`).join('')}</div></div>`
  return `<div class="mtb-count">▪ 등록한 에이전트 : <b>7</b>건</div>
<div class="mtb-grid">
  <div class="mtb-main">
    <div class="mtb-panels">
      <div class="mtb-panel">
        <div class="mtb-panel-head">My Agent <button class="mtb-more">${ic('arrow', 16)}</button></div>
        <div class="search mtb-search">${ic('search', 15)}<input placeholder="Agent 검색" /></div>
        <div class="mtb-tree">
          <div class="mtb-folder">
            <div class="mtb-folder-head"><span class="mtb-caret">▾</span> ${ic('folder', 14)} 나의 업무 (2)</div>
            <div class="mtb-agent-item"><div class="mtb-ai-name">내 업무 요약 Agent</div><div class="mtb-ai-desc">메일·일정·문서를 모아 하루 업무 브리핑…</div></div>
            <div class="mtb-agent-item"><div class="mtb-ai-name">회의록 정리 Agent</div><div class="mtb-ai-desc">녹취 텍스트를 회의록 양식으로 정리…</div></div>
          </div>
        </div>
      </div>
      <div class="mtb-panel">
        <div class="mtb-panel-head">Work Space <button class="mtb-more">${ic('arrow', 16)}</button></div>
        <div class="search mtb-search">${ic('search', 15)}<input placeholder="Agent 검색" /></div>
        <div class="mtb-ws">
          ${ws('RAG 평가 데이터셋 생성 에이전트', '업로드 문서(PDF/MD/Text)를 분석…', ['RAG', 'PPT', '시장분석'])}
          ${ws('사내 문서 RAG 챗봇', '사내 지식 베이스 기반 답변…', ['주식', '도식', '뉴스레터'])}
        </div>
      </div>
    </div>
    <div class="mtb-tiles">
      ${tile('에이전트 직접 만들기', 'plus')}
      ${tile('에이전트 가져오기', 'download')}
      ${tile('M&A 분석기 v3', null, '즐겨찾기')}
      ${tile('트렌드 대시보드 봇', null, '즐겨찾기')}
    </div>
    <div class="mtb-stats">
      ${stat('나의 에이전트', 17, 'bot')}
      ${stat('승인된 에이전트', 3, 'check')}
      ${stat('권한요청 지식', 12, 'book')}
      ${stat('권한요청 도구', 2, 'shield')}
    </div>
  </div>
  <aside class="mtb-side">
    ${col('공지사항', ['[시스템] AX Portal 배포 일정..', '[에이전트] 이 달의 추천 에이..', '[권한] 권한신청 방법 안내에 ..'])}
    ${col('커뮤니티', ['Agent 생성 기능 좋아요', '주간보고서 봇 생성방법 공유', '도구 툴에 프로그램 추가여부'])}
    ${col('문의 및 오류', ['[문의] 지식관리 등록방법', '[개선] 버튼 크기 변경 요청', '[문의] 에이전트 등록방법에…'])}
    ${col('사용자가이드', ['챗봇 기능 활성화 가이드', '업무부서 Agent 생성 안내', 'AX추진팀 문서 등록 관리'])}
  </aside>
</div>`
})()

// 3) 지식관리
const KNOWLEDGE = (() => {
  const tree = (name, count, on) => `<div class="tree-row ${on ? 'on' : ''}"><span class="tree-caret ghost"></span>${ic('book', 14)}<span class="tree-name">${name}</span><span class="tree-count">${count}</span></div>`
  const pill = (cls, label) => `<span class="pill ${cls}">${label}</span>`
  const card = (name, scope, owner, desc, docs, linked, updated, permCls, permLabel, action) =>
    `<div class="card kn-card">
      <div class="kn-card-top"><div class="sq sq-green">${name.slice(0, 1)}</div><div style="flex:1;min-width:0"><div class="kn-card-name">${name} <span class="scope-tag">${scope}</span></div><div class="kn-card-owner">${owner}</div></div></div>
      <div class="kn-card-desc">${desc}</div>
      <div class="kn-card-meta"><span>${ic('doc', 12)} 문서 ${docs}</span><span>연결 Agent ${linked}</span><span>최신화 ${updated}</span></div>
      <div class="kn-card-actions">${pill(permCls, permLabel)}<span class="grow"></span>${action}</div>
    </div>`
  return `<div class="kn-topbar"><div class="search">${ic('search', 16)}<input placeholder="지식 검색" /></div></div>
<div class="kn-layout">
  <aside class="kn-tree">
    <div class="tree-label">카테고리</div>
    <div class="tree-scroll">
      ${tree('전체 지식', 128, true)}
      ${tree('상품·약관', 41, false)}
      ${tree('심사·보상', 33, false)}
      ${tree('규정·컴플라이언스', 22, false)}
      ${tree('마케팅·영업', 18, false)}
      ${tree('IT·시스템', 14, false)}
    </div>
  </aside>
  <div class="kn-main">
    <div class="kn-toolbar"><div class="kn-crumb">전체 지식 <span class="count">128건</span></div><div class="view-toggle"><button class="on">${ic('grid', 16)}</button><button>${ic('list', 16)}</button></div></div>
    <div class="kn-cards">
      ${card('보험 상품 약관 KB', '부서', '상품개발부', '전 상품 약관 원문 + 개정 이력. 근거 인용에 사용.', '2,340', 6, '2026-07-10', 'pill-owner', '소유', `<button class="btn btn-primary btn-sm">상세 보기</button>`)}
      ${card('심사 기준 가이드', '팀', '심사부', '심사 판단 기준·유사 사례 데이터셋.', '1,120', 4, '2026-07-08', 'pill-active', '보유', `<button class="btn btn-primary btn-sm">상세 보기</button>`)}
      ${card('사내 규정 전문', '전사', '준법감시부', '취업규칙·정보보호·컴플라이언스 규정 전문.', '860', 3, '2026-07-05', 'pill-denied', '권한 필요', `<button class="btn btn-gray btn-sm">권한 요청</button>`)}
      ${card('마케팅 캠페인 성과 DB', '팀', '마케팅팀', '분기별 캠페인 지표·ROI 집계.', '540', 2, '2026-07-02', 'pill-active', '보유', `<button class="btn btn-primary btn-sm">상세 보기</button>`)}
    </div>
  </div>
</div>`
})()

// 4) 대화창 (My Agent 상세)
const CHAT = (() => {
  const csItem = (title, when, on) => `<div class="cs-item ${on ? 'on' : ''}"><div class="cs-item-body"><div class="cs-title">${title}</div><div class="cs-when">${when}</div></div><button class="cs-kebab">${ic('dots', 16)}</button></div>`
  const insightCard = (title, rows) => `<div class="card insight-card"><div class="insight-title">${title}</div>${rows}</div>`
  return `<div class="run-head"><button class="run-back">${ic('menu', 17)}</button><div class="run-crumb">My Agent</div><span style="flex:1"></span><span class="pill pill-owner">소유</span><button class="btn btn-ghost btn-sm">${ic('doc', 14)} 상세 숨기기</button></div>
<div class="run-layout">
  <aside class="chat-side">
    <div class="cs-head"><button class="btn btn-primary btn-sm cs-new">${ic('plus', 15)} 새 채팅</button></div>
    <div class="cs-scroll">
      <div class="search cs-search">${ic('search', 15)}<input placeholder="채팅 검색" /></div>
      <div class="cs-list">
        ${csItem('날씨정보를 연계해줘', '2026-10-01 13:24', true)}
        ${csItem('날씨정보와 지역정보를 맵핑하고, 가치 순위를 우선으로 계산하여 최적화된 프로세스를 계산해줘', '2026-10-01 13:24', false)}
      </div>
    </div>
  </aside>
  <div class="card chat-card">
    <div class="chat-header">
      <div class="sq sq-navy sq-sm">V</div>
      <div class="ch-info">
        <div class="ch-name">Vue3-Spring 개발 코파일럿</div>
        <div class="ch-desc">Vue3와 Spring 기반의 프론트엔드/백엔드 구현, 오류 분석, API 연동, 아키텍처 조언을 제공하는 실무형 개발 지원 에이전트</div>
        <div class="ch-tags"><span class="ax-tag">분석</span><span class="ax-tag">PPT</span><span class="ax-tag">트렌드</span><span class="ax-tag">Word</span><span class="ax-tag">보고서</span></div>
      </div>
      <button class="btn btn-primary btn-sm ch-edit">${ic('edit', 13)} 수정</button>
    </div>
    <div class="chat-scroll">
      <div class="msg user"><div class="msg-col"><div class="bubble">vue3 개발 가이드를 줄래</div></div></div>
      <div class="msg agent"><div class="sq sq-navy sq-sm">V</div><div class="msg-col"><div class="bubble">나는 Vue3-Spring Development Copilot이야.
즉, Vue 3 프론트엔드와 Spring(주로 Spring Boot) 백엔드 개발을 도와주는 개발 보조 AI야.

도와줄 수 있는 것들:
· Vue 3 컴포넌트/라우팅/품/상태관리·axios API 연동
· Spring Controller/Service/Repository, DTO/Validation, 트랜잭션, 에러 처리
· 프론트-백엔드 요청/응답(JSON) 계약 맞추기, 인증/인가 흐름 정리</div><div class="msg-usage"><span class="msg-copy">${ic('doc', 12)} 복사</span><span>↓ 169 · ↑ 208 · $0.0038</span></div></div></div>
      <div class="msg user"><div class="msg-col"><div class="bubble">프로젝트 생성을 도와줘.</div></div></div>
    </div>
    <div class="chat-input"><input placeholder="Vue3-Spring 개발 코파일럿에게 요청하세요" /><button class="send-btn">${ic('send', 17)}</button></div>
    <div class="ci-tools"><button class="ci-tool">${ic('star', 16)}</button><button class="ci-tool">${ic('shield', 16)}</button><button class="ci-tool">${ic('users', 16)}</button><button class="ci-tool">${ic('book', 16)}</button><button class="ci-tool">${ic('doc', 16)}</button><span style="flex:1"></span><button class="ci-quick">${ic('doc', 15)}</button><button class="ci-quick">${ic('bot', 15)}</button></div>
  </div>
  <aside class="insight">
    ${insightCard('AGENT 정보', `<div class="insight-row"><span class="k">소유</span><span class="v">개인</span></div><div class="insight-row"><span class="k">권한 모델</span><span class="v">ABAC</span></div><div class="insight-row"><span class="k">내 권한</span><span class="pill pill-owner">소유</span></div>`)}
    ${insightCard('사용 인사이트', `<div class="insight-stat"><div class="stat-box"><div class="n">1,240</div><div class="l">누적 실행</div></div><div class="stat-box"><div class="n">2</div><div class="l">이번 세션 질문</div></div></div>`)}
    ${insightCard('연결 지식 (RAG)', `<div class="insight-kn"><div class="sq sq-green sq-sm" style="width:28px;height:28px;font-size:11px">개</div><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">개발 표준 가이드</span><span style="font-size:11px;color:var(--gray-lt)">320건</span></div>`)}
  </aside>
</div>`
})()

/* ══════════════════ 생성 ══════════════════ */
const screens = [
  { file: 'home.html', title: 'AX HUB', active: 'home', body: HOME, label: '홈 (Main Type B)' },
  { file: 'agents.html', title: '에이전트', active: 'agents', body: AGENTS, label: '에이전트 카탈로그' },
  { file: 'knowledge.html', title: '지식관리', active: 'knowledge', body: KNOWLEDGE, label: '지식(RAG) 카탈로그' },
  { file: 'chat.html', title: '에이전트', active: 'agents', body: CHAT, label: '대화창 (My Agent 상세)' },
]
screens.forEach(page)

// 인덱스 (갤러리)
const indexBody = `<div style="max-width:900px;margin:40px auto;padding:0 20px;font-family:Pretendard,system-ui,sans-serif;color:#15223B">
  <h1 style="font-size:26px;font-weight:800;letter-spacing:-.4px">AX-HUB 디자인 내보내기</h1>
  <p style="color:#565F6D;margin:8px 0 26px">현재 개발된 화면을 자체완결 HTML 로 내보낸 것입니다. 각 파일을 Claude 에게 전달해 재디자인하고, 결과를 개발(Vue)에 반영하세요.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">
    ${screens.map(s => `<a href="${s.file}" style="display:block;padding:20px;border:1px solid #E5E9F1;border-radius:12px;text-decoration:none;color:#15223B;background:#fff;box-shadow:0 4px 12px rgba(15,23,42,.05)"><div style="font-weight:800;font-size:15px">${s.label}</div><div style="font-size:12.5px;color:#8A94A3;margin-top:4px">${s.file}</div></a>`).join('')}
  </div>
  <p style="color:#8A94A3;font-size:12px;margin-top:24px">테마 미리보기: 각 HTML 의 &lt;html data-theme="default"&gt; 값을 bento / dynamic / minimal / dark 로 바꾸면 해당 시안으로 렌더됩니다.</p>
</div>`
writeFileSync(join(outDir, 'index.html'), `<!doctype html><html lang="ko"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>AX-HUB 디자인 내보내기</title>${FONT}<style>body{margin:0;background:#F6F7F9}</style></head><body>${indexBody}</body></html>`, 'utf8')

console.log('생성 완료:', [...screens.map(s => s.file), 'index.html'].join(', '))
