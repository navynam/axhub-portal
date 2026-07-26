# AX-HUB 사용자 포털 (프로토타입)

신한라이프 **AX-HUB** 사용자 포털 프론트엔드 프로토타입입니다.
AI **에이전트**·**지식(RAG)** 카탈로그, **권한 요청→승인** 워크플로우, **에이전트 채팅 실행**,
그리고 관리자용 **시스템 관제(AIOps)** 화면을 하나의 SPA로 제공합니다.

- **스택**: Vue 3 (`<script setup>`) · Vite · 목(mock) 데이터 기반 단독 동작
- **라우팅**: vue-router 없이 `store.page` 기반 간이 라우팅 (`src/App.vue`)
- **상태관리**: 경량 reactive 스토어 (`src/store/`)
- **백엔드 연동 seam**: `src/shared/api/config.js` 의 `USE_API` 하나로 mock ↔ 실서버 전환
- **라이브 데모**: https://navynam.github.io/axhub-portal/ (GitHub Pages 자동 배포)

> 형제 백엔드 스캐폴드: `backend/` (Spring Boot · JPA). `agent`·`permission` 도메인이 레퍼런스 구현.

---

## 빠른 시작

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 프로덕션 빌드 → dist/
```

> VS Code 확장 추천: **Vue - Official (Volar)**
> 실서버 연동: 프로젝트 루트에 `.env` — `VITE_USE_API=true`, `VITE_API_BASE=http://localhost:8080/api/v1`

---

## 화면 구성

| 메뉴 | 화면 | 파일 | 접근 | 주요 기능 |
|---|---|---|---|---|
| 홈 | 홈 대시보드 | `pages/Home.vue` | 전체 | 통합검색, 내 에이전트 바로가기, 요청 현황 |
| 에이전트 | 에이전트 카탈로그 | `pages/Agents.vue` | 전체 | 내/전체/즐겨찾기 탭, 폴더 그룹, 권한 요청, 실행 |
| 〃 | 에이전트 실행(채팅) | `pages/AgentRun.vue` | 전체 | 스트리밍 응답, 대화 기록, 인사이트 패널, 신고/개선요청 |
| 〃 | 툴 관리 | `pages/ToolManage.vue` | 전체 | 도구·미들웨어·스킬·MCP 카탈로그, 유형·프로토콜·태그 필터, 개별 권한 신청 |
| 지식관리 | 지식(RAG) 카탈로그 | `pages/Knowledge.vue` | 전체 | 컬렉션 트리, 카드/리스트, 상세 문서목록, **지식 채팅** |
| 라운지 | 커뮤니티 | `pages/Community.vue` | 전체 | 보드별 게시글, 관련 에이전트 딥링크 |
| 마이페이지 | 내 요청함 / 승인함 | `pages/Permissions.vue` | 사용자 / 관리자 | 요청 진행 스텝, 승인·반려(사유 필수), 신고함 |
| 〃 | 권한 신청 | `pages/AccessRequest.vue` | 전체 | 도구·지식 권한 신청 안내 |
| 시스템 관리 | 시스템 모니터링 | `pages/SysMonitor.vue` | 관리자 | OCP 환경 Agent 관제(토큰·GPU·트래픽·서비스 상태) |
| 〃 | IT 운영 관리 | `pages/ItOps.vue` | 관리자 | AIOps 관제 콘솔(대시보드·시그널 피드·분석 챗, 축소/확장·스플릿) |
| 〃 | 현황 전파 | `pages/ComputerUse.vue` | 관리자 | Computer-Use 에이전트(자동 탐색→Redaction→전파) |
| 〃 | 일일점검 보고서 | `pages/DailyReport.vue` | 관리자 | 배치형 에이전트(수집→AI 초안→승인→발송) |

**디자인 테마 5종** — default(기본) / bento(색면 카드) / dynamic(동적 카드) / minimal(행 리스트) / dark(다크).
우측 상단 설정(⚙) → 테마 전환. `store.theme` + `data-theme` 속성으로 전 화면 즉시 반영.

---

## 핵심 업무 규칙

> **에이전트는 누구나 생성·사용할 수 있으나, 에이전트가 쓰는 도구(리소스)를 하나라도 보유하지 않으면 실행할 수 없다.**

- 실행 가능 여부 `agentReady(agent)` = 모든 `agent.tools` 가 `granted`
- 미보유 도구 → **권한 요청** → 운영 관리자 **승인** → 도구 `granted` → 실행 버튼 활성화
- 권한 상태: `owner`(내 소유) · `granted`(보유) · `pending`(요청중) · `none`(미보유) · `denied`(반려)

라이브 데모 시나리오: **사용자**로 에이전트/도구 권한 요청 → 헤더에서 **관리자** 전환 → 승인함에서 **승인** → 다시 **사용자**로 전환 시 실행 가능.

---

## 폴더 구조 (요약)

```
src/
├─ main.js · App.vue · styles.css     앱 진입 · 라우팅/레이아웃 · 전역 스타일(디자인 토큰+5테마)
├─ shared/        공통: api(config·http) · constants(enums) · utils(format) · models(types)
├─ store/         전역상태 state.js + 도메인 액션 modules/*.js + 배럴 index.js (+ 하위호환 store.js)
├─ features/      도메인별 백엔드 연동 서비스 (agent·knowledge·community·permission·auth·access·chatbot)
├─ pages/         화면 12종 (위 표 참고)
├─ components/    재사용 컴포넌트 (Icon, StatusPill, 각종 Modal, DetailModal 등)
└─ data.js        목 데이터 (에이전트·지식·요청·보드·리소스·지식트리)
```

레이어링 규칙: **화면(pages/components) → store(액션)/service → shared/api(http) → 백엔드**.
화면에서 `fetch` 직접 호출 금지, 백엔드 연동은 `features/*/services` 안에서만(`USE_API` 분기).

---

## 문서 (docs/)

| 문서 | 내용 |
|---|---|
| [기획서](docs/기획서.md) | 서비스 개요·역할·IA·사용자 시나리오·화면별 기획 |
| [기능명세서](docs/기능명세서.md) | 화면별 기능 상세(기능ID·동작·예외) — QA 테스트 기준 |
| [아키텍처](docs/ARCHITECTURE.md) | 프론트·백엔드 구조, 레이어링, 풀스택 호출관계, 담당 배분 |
| [개발가이드](docs/개발가이드.md) | 초급 개발자 온보딩·새 기능 추가 실습·컨벤션 |
| [퍼블리싱 가이드](docs/퍼블리싱가이드.md) | 디자인 토큰·공통 클래스·5테마·반응형(디자이너/퍼블리셔) |
| [컴포넌트 카탈로그](docs/컴포넌트카탈로그.md) | 전 컴포넌트 props·emit·사용처 |
| [API 명세서](docs/API명세서.md) | REST API 계약(프론트 service ↔ 백엔드 controller) |
| [백엔드 가이드](docs/백엔드가이드.md) | 백엔드 패키지 구조·레이어·새 도메인 구현 표준 |

---

## 팀 담당 배분 (개발자 5 + 디자이너/퍼블리셔)

| 담당 | 영역 |
|---|---|
| 개발자 A | 에이전트 도메인 (Home/Agents/AgentRun, store agent·conversation, agentService) |
| 개발자 B | 지식 도메인 (Knowledge/KnowledgeChat/KnowledgeTreeNode, knowledgeService) |
| 개발자 C | 권한 도메인 (Permissions/AccessRequest/ToolManage, store request·resource·report) |
| 개발자 D | 커뮤니티 + 시스템 관리 (Community/SysMonitor/ItOps/ComputerUse/DailyReport) |
| 개발자 E | 플랫폼/공통 (shared/*, store 코어, 공통 컴포넌트, 인증, 빌드/배포) |
| 디자이너·퍼블리셔 | 디자인 시스템(styles.css), 5테마, 컴포넌트 스타일, 반응형·접근성 |

> 공통 영역(shared·store 코어·공통 컴포넌트·styles.css) 변경은 **개발자 E 리뷰 필수**.
> 자세한 내용은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/개발가이드.md](docs/개발가이드.md) 참고.
