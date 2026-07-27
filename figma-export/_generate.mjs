/**
 * Figma 임포트용 HTML 스냅샷 생성기
 * -----------------------------------------------------------------------------
 * 실행 중인 dev 서버(5173)의 각 화면을 렌더된 DOM 그대로 캡처하고, styles.css 를
 * 인라인해 "자체 완결형(self-contained) HTML" 파일로 저장한다. <script> 는 제거해
 * 정적 스냅샷으로 만든다. 이렇게 만든 HTML 을 Figma html.to.design 플러그인으로
 * 임포트하면 각 요소(div→Frame, text→Text, svg→Vector)가 레이어로 변환된다.
 *
 * 사용:  (dev 서버 실행 중) 프로젝트 루트에서
 *   node figma-export/_generate.mjs
 */
import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'

const OUT = './figma-export'
mkdirSync(`${OUT}/html`, { recursive: true })
mkdirSync(`${OUT}/preview`, { recursive: true })
const css = readFileSync('./src/styles.css', 'utf8')

const b = await chromium.launch({ channel: 'chrome', headless: true })

// 각 화면: name(파일명) · title · admin(관리자 역할 필요) · nav(진입 클릭 시퀀스)
const specs = [
  { name: 'home', title: '홈 대시보드', nav: async () => {} },
  { name: 'agents', title: '에이전트 카탈로그', nav: async p => { await p.getByRole('button', { name: /에이전트/ }).first().click() } },
  { name: 'tools', title: '툴 관리', nav: async p => { await p.getByRole('button', { name: /에이전트/ }).first().click(); await p.waitForTimeout(200); await p.getByRole('button', { name: '툴 관리' }).first().click() } },
  { name: 'run', title: '에이전트 실행(대화)', nav: async p => { await p.getByRole('button', { name: /에이전트/ }).first().click(); await p.waitForTimeout(400); await p.getByRole('button', { name: /^실행$/ }).first().click() } },
  { name: 'knowledge', title: '지식관리', nav: async p => { await p.getByRole('button', { name: '지식관리' }).first().click() } },
  { name: 'glossary', title: '용어사전', nav: async p => { await p.getByRole('button', { name: /용어사전/ }).first().click() } },
  { name: 'community', title: '라운지(커뮤니티)', nav: async p => { await p.getByRole('button', { name: '라운지' }).first().click() } },
  { name: 'perms', title: '마이페이지(요청함)', nav: async p => { await p.getByRole('button', { name: '마이페이지' }).first().click() } },
  { name: 'access', title: '권한 신청', nav: async p => { await p.getByRole('button', { name: /권한 신청 방법/ }).click() } },
  { name: 'sysmon', title: '시스템 모니터링', admin: true, nav: async p => { await p.getByRole('button', { name: '시스템 관리' }).first().click() } },
  { name: 'itops', title: 'IT 운영 관리', admin: true, nav: async p => { await p.getByRole('button', { name: '시스템 관리' }).first().click(); await p.waitForTimeout(200); await p.getByRole('button', { name: 'IT 운영 관리' }).first().click() } },
  { name: 'computeruse', title: '현황 전파', admin: true, nav: async p => { await p.getByRole('button', { name: '시스템 관리' }).first().click(); await p.waitForTimeout(200); await p.getByRole('button', { name: '현황 전파' }).first().click() } },
  { name: 'daily', title: '일일점검 보고서', admin: true, nav: async p => { await p.getByRole('button', { name: '시스템 관리' }).first().click(); await p.waitForTimeout(200); await p.getByRole('button', { name: '일일점검 보고서' }).first().click() } },
]

function sanitize(html) {
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  const withCss = noScript.replace('</head>', `<style id="ax-inline-styles">\n${css}\n</style>\n</head>`)
  return '<!DOCTYPE html>\n' + withCss
}

const done = []
for (const s of specs) {
  const p = await b.newPage()
  await p.setViewportSize({ width: 1440, height: 900 })
  try {
    await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
    await p.waitForTimeout(400)
    if (s.admin) { await p.getByRole('button', { name: '관리자' }).click(); await p.waitForTimeout(250) }
    await s.nav(p)
    await p.waitForTimeout(700)
    const html = await p.evaluate(() => document.documentElement.outerHTML)
    writeFileSync(`${OUT}/html/${s.name}.html`, sanitize(html), 'utf8')
    await p.screenshot({ path: `${OUT}/preview/${s.name}.png`, fullPage: true })
    done.push(s)
    console.log('  ok  ', s.name)
  } catch (e) {
    console.log('  FAIL', s.name, '-', e.message.split('\n')[0])
  }
  await p.close()
}

const cards = done.map(s =>
  `    <a class="c" href="html/${s.name}.html"><img loading="lazy" src="preview/${s.name}.png" alt="${s.title}"/><span>${s.title} <code>${s.name}.html</code></span></a>`).join('\n')
writeFileSync(`${OUT}/index.html`, `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AX-HUB — Figma 임포트용 HTML</title>
<style>
 body{font-family:Pretendard,'Malgun Gothic',system-ui,sans-serif;background:#f4f7fb;margin:0;padding:32px;color:#15223b}
 h1{font-size:21px;margin:0 0 6px} p{color:#565f6d;font-size:13.5px;line-height:1.6;margin:0 0 8px} code{color:#8a94a3;font-weight:500;font-size:11px}
 .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-top:20px}
 .c{display:block;border:1px solid #e5e9f1;border-radius:14px;overflow:hidden;background:#fff;text-decoration:none;color:inherit;box-shadow:0 1px 3px rgba(21,34,59,.08);transition:.15s}
 .c:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(21,34,59,.12)}
 .c img{width:100%;display:block;border-bottom:1px solid #eef1f6;background:#fff}
 .c span{display:block;padding:11px 13px;font-weight:750;font-size:13.5px}
</style></head><body>
 <h1>AX-HUB — Figma 임포트용 HTML (${done.length}개 화면)</h1>
 <p>각 카드를 열면 <b>자체 완결형 HTML</b>(CSS 인라인·스크립트 제거)입니다. Figma <b>html.to.design</b> 플러그인에서 URL 또는 HTML 코드로 임포트하면 각 요소가 편집 가능한 레이어로 변환됩니다.</p>
 <p>임포트 방법은 <code>docs/피그마연동가이드.md</code> 참고. 코드 변경 후 재생성: <code>node figma-export/_generate.mjs</code></p>
 <div class="g">
${cards}
 </div>
</body></html>
`, 'utf8')

await b.close()
console.log(`DONE ${done.length}/${specs.length} pages`)
