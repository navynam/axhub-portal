/**
 * Figma 임포트용 HTML 스냅샷 생성기 (테마별 · 페이지/팝업/공통메세지)
 * -----------------------------------------------------------------------------
 * 실행 중인 dev 서버(5173)의 각 화면·팝업·공통메세지를 렌더된 DOM 그대로 캡처하고,
 * styles.css 를 인라인해 "자체 완결형(self-contained) HTML" 로 저장한다.
 * <script> 는 제거해 정적 스냅샷으로 만든다. Figma html.to.design 로 임포트하면
 * 각 요소(div→Frame, text→Text, svg→Vector)가 레이어로 변환된다.
 *
 * 출력 구조:
 *   figma-export/<theme>/pages/<name>.html(.png)
 *   figma-export/<theme>/popups/<name>.html(.png)
 *   figma-export/<theme>/messages/<name>.html(.png)
 *   figma-export/index.html   (썸네일 갤러리)
 *
 * 테마: default(신한 기본) · bento(베토 그리드) · dark(다크)
 * 사용: (dev 서버 실행 중) 프로젝트 루트에서  →  node figma-export/_generate.mjs
 */
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'

const OUT = './figma-export'
const URL = 'http://localhost:5173/'
const css = readFileSync('./src/styles.css', 'utf8')
const THEMES = [
  { key: 'default', label: '신한 기본' },
  { key: 'bento', label: '베토 그리드' },
  { key: 'dark', label: '다크' },
]
const wait = (p, ms) => p.waitForTimeout(ms)

// ── 진입 내비게이션(재사용) ───────────────────────
const nav = {
  home: async () => {},
  agents: async p => { await p.getByRole('button', { name: /에이전트/ }).first().click(); await wait(p, 300) },
  tools: async p => { await p.getByRole('button', { name: /에이전트/ }).first().click(); await wait(p, 200); await p.getByRole('button', { name: '툴 관리' }).first().click(); await wait(p, 300) },
  run: async p => { await p.getByRole('button', { name: /에이전트/ }).first().click(); await wait(p, 400); await p.getByRole('button', { name: /^실행$/ }).first().click(); await wait(p, 400) },
  knowledge: async p => { await p.getByRole('button', { name: '지식관리' }).first().click(); await wait(p, 300) },
  glossary: async p => { await p.getByRole('button', { name: /용어사전/ }).first().click(); await wait(p, 300) },
  community: async p => { await p.getByRole('button', { name: '라운지' }).first().click(); await wait(p, 300) },
  perms: async p => { await p.getByRole('button', { name: '마이페이지' }).first().click(); await wait(p, 300) },
  permsApprove: async p => { await p.getByRole('button', { name: '마이페이지' }).first().click(); await wait(p, 250); await p.getByRole('button', { name: '승인함' }).first().click(); await wait(p, 300) },
  access: async p => { await p.getByRole('button', { name: /권한 신청 방법/ }).click(); await wait(p, 300) },
  sysmon: async p => { await p.getByRole('button', { name: '시스템 관리' }).first().click(); await wait(p, 300) },
  itops: async p => { await p.getByRole('button', { name: '시스템 관리' }).first().click(); await wait(p, 200); await p.getByRole('button', { name: 'IT 운영 관리' }).first().click(); await wait(p, 400) },
  computeruse: async p => { await p.getByRole('button', { name: '시스템 관리' }).first().click(); await wait(p, 200); await p.getByRole('button', { name: '현황 전파' }).first().click(); await wait(p, 300) },
  daily: async p => { await p.getByRole('button', { name: '시스템 관리' }).first().click(); await wait(p, 200); await p.getByRole('button', { name: '일일점검 보고서' }).first().click(); await wait(p, 300) },
}

// ── 화면(페이지) ──────────────────────────────────
const PAGES = [
  { name: 'home', title: '홈 대시보드', steps: nav.home },
  { name: 'agents', title: '에이전트 카탈로그', steps: nav.agents },
  { name: 'tools', title: '툴 관리', steps: nav.tools },
  { name: 'run', title: '에이전트 실행(대화)', steps: nav.run },
  { name: 'knowledge', title: '지식관리', steps: nav.knowledge },
  { name: 'glossary', title: '용어사전', steps: nav.glossary },
  { name: 'community', title: '라운지(커뮤니티)', steps: nav.community },
  { name: 'perms', title: '마이페이지(요청함)', steps: nav.perms },
  { name: 'access', title: '권한 신청', steps: nav.access },
  { name: 'sysmon', title: '시스템 모니터링', admin: true, steps: nav.sysmon },
  { name: 'itops', title: 'IT 운영 관리', admin: true, steps: nav.itops },
  { name: 'computeruse', title: '현황 전파', admin: true, steps: nav.computeruse },
  { name: 'daily', title: '일일점검 보고서', admin: true, steps: nav.daily },
]

// ── 팝업(모달) ───────────────────────────────────
const POPUPS = [
  { name: 'settings-theme', title: '설정 · 테마', steps: async p => { await p.getByRole('button', { name: '설정' }).click(); await wait(p, 400) } },
  { name: 'settings-keys', title: '설정 · KEY 관리', steps: async p => { await p.getByRole('button', { name: '설정' }).click(); await wait(p, 300); await p.getByRole('tab', { name: /KEY 관리/ }).click(); await wait(p, 400) } },
  { name: 'agent-info', title: '에이전트 정보', steps: async p => { await nav.agents(p); await p.locator('.ax-card').first().click(); await wait(p, 400) } },
  { name: 'request-permission', title: '권한 요청', steps: async p => { await nav.agents(p); await p.getByRole('button', { name: /권한 요청/ }).first().click(); await wait(p, 400) } },
  { name: 'new-folder', title: '새 폴더(공통 입력)', steps: async p => { await nav.agents(p); await p.getByRole('button', { name: /새 폴더/ }).click(); await wait(p, 400) } },
  { name: 'folder-move', title: '폴더 이동', steps: async p => { await nav.agents(p); await p.locator('.ax-folder').first().click(); await wait(p, 400) } },
  { name: 'report', title: '신고 · 개선요청', steps: async p => { await nav.run(p); await p.getByRole('button', { name: /신고하기/ }).click(); await wait(p, 400) } },
  { name: 'detail', title: '상세 정보(차트 클릭)', admin: true, steps: async p => { await nav.itops(p); await p.locator('.io-clk').first().click(); await wait(p, 400) } },
  { name: 'deny', title: '반려 사유', admin: true, steps: async p => { await nav.permsApprove(p); await p.getByRole('button', { name: /반려/ }).first().click(); await wait(p, 400) } },
  { name: 'builder', title: 'Agent 빌더(런처)', steps: async p => { await p.locator('.fab-main').click(); await wait(p, 300); await p.getByRole('button', { name: /Agent 빌더/ }).click(); await wait(p, 500) } },
  { name: 'chatbot', title: '챗봇 팝업', steps: async p => { await p.locator('.fab-main').click(); await wait(p, 300); await p.getByRole('button', { name: /^챗봇$/ }).click(); await wait(p, 500) } },
]

// ── 공통 메세지(토스트) ───────────────────────────
const MESSAGES = [
  { name: 'toast', title: '토스트 알림(권한 신청)', steps: async p => { await nav.tools(p); await p.getByRole('button', { name: /권한 신청/ }).first().click(); await wait(p, 300) } },
]

function sanitize(html) {
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  return '<!DOCTYPE html>\n' + noScript.replace('</head>', `<style id="ax-inline-styles">\n${css}\n</style>\n</head>`)
}

const b = await chromium.launch({ channel: 'chrome', headless: true })
async function themedPage(theme) {
  const p = await b.newPage()
  await p.setViewportSize({ width: 1440, height: 900 })
  await p.addInitScript(t => { try { localStorage.setItem('ax-theme', t) } catch {} }, theme)
  return p
}

const result = {}   // theme -> { pages:[], popups:[], messages:[] }
let ok = 0, fail = 0

async function capture(theme, category, spec, fullPage) {
  const p = await themedPage(theme)
  try {
    await p.goto(URL, { waitUntil: 'networkidle' }); await wait(p, 400)
    if (spec.admin) { await p.getByRole('button', { name: '관리자' }).click(); await wait(p, 250) }
    await spec.steps(p)
    await wait(p, 500)
    writeFileSync(`${OUT}/${theme}/${category}/${spec.name}.html`, sanitize(await p.evaluate(() => document.documentElement.outerHTML)))
    await p.screenshot({ path: `${OUT}/${theme}/${category}/${spec.name}.png`, fullPage })
    result[theme][category].push(spec); ok++
    console.log('  ok  ', theme, category, spec.name)
  } catch (e) {
    console.log('  FAIL', theme, category, spec.name, '-', e.message.split('\n')[0]); fail++
  }
  await p.close()
}

for (const t of THEMES) {
  result[t.key] = { pages: [], popups: [], messages: [] }
  mkdirSync(`${OUT}/${t.key}/pages`, { recursive: true })
  mkdirSync(`${OUT}/${t.key}/popups`, { recursive: true })
  mkdirSync(`${OUT}/${t.key}/messages`, { recursive: true })
  for (const s of PAGES) await capture(t.key, 'pages', s, true)
  for (const s of POPUPS) await capture(t.key, 'popups', s, false)
  for (const s of MESSAGES) await capture(t.key, 'messages', s, false)
}

// ── 갤러리 index.html ─────────────────────────────
const catLabel = { pages: '화면', popups: '팝업', messages: '공통 메세지' }
function section(theme) {
  const t = THEMES.find(x => x.key === theme)
  let html = `<h2>${t.label} <code>${theme}</code></h2>`
  for (const cat of ['pages', 'popups', 'messages']) {
    const items = result[theme][cat]
    if (!items.length) continue
    html += `<h3>${catLabel[cat]} (${items.length})</h3><div class="g">` + items.map(s =>
      `<a class="c" href="${theme}/${cat}/${s.name}.html"><img loading="lazy" src="${theme}/${cat}/${s.name}.png" alt="${s.title}"/><span>${s.title} <code>${s.name}</code></span></a>`).join('') + `</div>`
  }
  return html
}
writeFileSync(`${OUT}/index.html`, `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AX-HUB — Figma 임포트용 HTML (테마별)</title>
<style>
 body{font-family:Pretendard,'Malgun Gothic',system-ui,sans-serif;background:#f4f7fb;margin:0;padding:32px;color:#15223b}
 h1{font-size:22px;margin:0 0 6px} h2{font-size:18px;margin:34px 0 4px;padding-top:14px;border-top:2px solid #e5e9f1}
 h3{font-size:13px;color:#565f6d;margin:16px 0 8px;text-transform:uppercase;letter-spacing:.5px}
 p{color:#565f6d;font-size:13.5px;line-height:1.6;margin:0 0 8px} code{color:#8a94a3;font-weight:600;font-size:11px}
 .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
 .c{display:block;border:1px solid #e5e9f1;border-radius:12px;overflow:hidden;background:#fff;text-decoration:none;color:inherit;box-shadow:0 1px 3px rgba(21,34,59,.08);transition:.15s}
 .c:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(21,34,59,.12)}
 .c img{width:100%;height:158px;object-fit:cover;object-position:top;display:block;border-bottom:1px solid #eef1f6;background:#fff}
 .c span{display:block;padding:10px 12px;font-weight:750;font-size:13px}
</style></head><body>
 <h1>AX-HUB — Figma 임포트용 HTML</h1>
 <p>테마 <b>${THEMES.map(t => t.label).join(' · ')}</b> × <b>화면·팝업·공통메세지</b>. 각 파일은 자체 완결형 HTML(CSS 인라인)로, Figma <b>html.to.design</b> 임포트 시 레이어로 변환됩니다. 방법: <code>docs/피그마연동가이드.md</code></p>
 ${THEMES.map(t => section(t.key)).join('\n')}
</body></html>
`, 'utf8')

await b.close()
console.log(`\nDONE  ok=${ok} fail=${fail}`)
