# AX-HUB 디자인 내보내기 (design-export)

현재 개발된 화면을 **자체완결 정적 HTML**로 내보낸 폴더입니다.
Claude(디자이너)에게 화면을 보여주고 재디자인한 뒤, 결과를 다시 개발(Vue)에 반영하는 용도입니다.

## 무엇이 들어있나

| 파일 | 화면 | 원본 소스(Vue) |
|------|------|----------------|
| `index.html` | 갤러리(목차) | — |
| `home.html` | 홈 (Main Type B) | `src/pages/Home.vue` |
| `agents.html` | 에이전트 카탈로그 | `src/pages/Agents.vue` |
| `knowledge.html` | 지식(RAG) 카탈로그 | `src/pages/Knowledge.vue` |
| `chat.html` | 대화창 (My Agent 상세) | `src/pages/AgentRun.vue` |

각 HTML은 **사이드바 + 글로벌 헤더 + 본문**을 포함하며, 실제 `src/styles.css` 전체가 `<style>`에 인라인되어 있어 **파일 하나만 열어도 그대로 렌더**됩니다(폰트만 CDN).

## 보기

- `design-export/index.html` 을 브라우저로 열면 각 화면으로 이동할 수 있습니다.
- **테마 시안 미리보기**: 각 HTML 최상단 `<html data-theme="default">` 의 값을
  `bento` / `dynamic` / `minimal` / `dark` 로 바꾸면 해당 테마로 렌더됩니다. (5개 테마 CSS가 모두 인라인됨)

## 재디자인 → 개발 반영 워크플로우

1. 원하는 화면 HTML(예: `agents.html`)을 Claude 에게 전달하고 "이 화면을 이렇게 다듬어줘" 요청.
2. Claude 가 돌려준 **HTML/CSS**를 확인.
3. 개발 반영:
   - **스타일 변경** → `src/styles.css` 의 해당 클래스(`.ax-card`, `.catalog-toolbar`, `.mtb-*`, `.kn-card`, `.chat-*` 등)에 반영.
   - **구조/마크업 변경** → 위 표의 해당 `.vue` 템플릿에 반영.
   - 클래스명·구조를 최대한 유지하면 반영이 쉽습니다.
4. `npm run build` 로 확인.

> 내보낸 HTML의 클래스 이름과 마크업 구조는 실제 컴포넌트와 1:1로 맞춰져 있습니다.
> 따라서 "이 클래스의 스타일을 이렇게" 형태의 변경은 `styles.css` 한 곳만 고치면 전 화면에 반영됩니다.

## 다시 생성(갱신)

소스(`styles.css`/템플릿)가 바뀌면 아래로 재생성하세요.

```
node design-export/build-export.mjs
```

## 아직 미포함 화면

`마이페이지(요청함/승인함)`, `라운지`, `권한 신청` 화면은 아직 내보내지 않았습니다.
필요하면 `build-export.mjs` 에 화면 본문을 추가(또는 요청)하면 동일 방식으로 생성됩니다.
