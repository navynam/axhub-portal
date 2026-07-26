# AX-HUB REST API 명세서

> 신한라이프 **AX-HUB** 사용자 포털의 백엔드 API 명세.
> 프론트(`axhub-portal`, Vue 3)의 `src/features/*/services/*.js` 가 정의하는 호출 계약과
> 백엔드(`backend`, Spring Boot · JPA)의 Controller 를 종합해 정리했다.
>
> - 근거 파일: 각 도메인의 `*Service.js`(프론트) ↔ `*Controller.java`(백엔드).
> - 구현 상태: **✅ 구현**(agent, permission), **🔧 스캐폴드**(auth, knowledge, community, resource — 컨트롤러 골격만, 빈 응답 반환).
> - 문서 기준일: 2026-07. 실제 소스에 존재하는 클래스/메서드/엔드포인트만 기술한다.

---

## 1. 공통 규약

### 1.1 Base Path / 서버
| 항목 | 값 | 근거 |
|------|-----|------|
| Base Path | `/api/v1` | 각 Controller `@RequestMapping("/api/v1/...")`, 프론트 `config.js` `API_BASE` |
| 백엔드 포트 | `8080` (context-path `/`) | `application.yml` |
| 프론트 개발 서버 | `http://localhost:5173` (CORS 허용 대상) | `SecurityConfig`, `application.yml` `axhub.cors` |
| 실연동 스위치 | 프론트 `.env` 의 `VITE_USE_API=true`, `VITE_API_BASE=http://localhost:8080/api/v1` | `config.js`, `backend/README.md` |

프론트는 기본값 `USE_API=false`(mock)로 동작하며, `USE_API=true` 일 때만 아래 실제 API 를 호출한다.
프론트→백엔드 통신은 **모두 `src/shared/api/http.js`(fetch 래퍼)** 를 통한다.

### 1.2 인증 (JWT Bearer)
| 항목 | 내용 |
|------|------|
| 방식 | JWT Bearer 토큰 (`Authorization: Bearer <token>`) |
| 토큰 발급 | `POST /auth/login` 응답의 `accessToken` |
| 토큰 저장 | 프론트 `localStorage`, 키 `axhub.accessToken` (`config.js` `TOKEN_KEY`) |
| 자동 첨부 | `http.js` `request()` 가 저장된 토큰을 모든 요청 헤더에 자동 부착 |
| 현재 상태 | ⚠ `SecurityConfig` 가 **`anyRequest().permitAll()`** — 아직 인증을 **강제하지 않음**(개발 편의). JWT 발급/검증 필터는 미구현(TODO). |

> 인증 연동 로드맵(SecurityConfig 주석): ① `JwtProvider` 로 토큰 발급/검증 → ② `JwtAuthFilter` 등록 → ③ `/api/v1/auth/**` 만 `permitAll`, 나머지 `authenticated`.
> 현재 `PermissionController` 의 사용자는 데모값(`홍길동`/`마케팅팀`)으로 고정되어 있다.

### 1.3 표준 응답 포맷
모든 응답은 `ApiResponse<T>` 로 감싼다. (`common/response/ApiResponse.java`)

```json
{ "success": true, "data": { ... }, "message": null }
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | boolean | 성공 여부 |
| `data` | T | 실제 페이로드 (실패 시 `null`) |
| `message` | string\|null | 실패 사유 (성공 시 `null`) |

프론트 `http.js` 는 이 구조를 인지해 **`data` 필드만 언랩(unwrap)** 하여 반환한다.
따라서 아래 명세의 "응답(주요 필드)" 은 언랩된 `data` 기준으로 표기한다.

### 1.4 에러 포맷 / 상태코드
에러는 `GlobalExceptionHandler`(`@RestControllerAdvice`)가 표준 실패 응답으로 변환한다.

| 발생 원인 | HTTP 상태 | 응답 바디 | 처리 위치 |
|-----------|-----------|-----------|-----------|
| `BusinessException` (업무 예외) | 예외에 담긴 status (예: 400/403/404) | `{success:false, data:null, message}` | `handleBusiness` |
| `@Valid` 검증 실패 | `400 Bad Request` | `message = "필드명: 오류메시지"` | `handleValidation` |
| 그 외 미처리 예외 | `500 Internal Server Error` | `message = "서버 오류가 발생했습니다: ..."` | `handleEtc` |

`BusinessException` 단축 생성자: `badRequest(msg)` → 400, `notFound(msg)` → 404. (그 외 status 는 직접 지정)

프론트 측 에러 정규화(`http.js`):
- 응답이 `!ok` → `HttpError(status, payload.message ?? 기본문구, payload)` throw.
- 네트워크 실패(서버 다운/CORS) → `HttpError(0, '서버에 연결할 수 없습니다.')`.
- 화면단은 `err.status` / `err.message` 로 일관 처리.

### 1.5 상태코드 관례
| 코드 | 사용 예 |
|------|---------|
| 200 OK | 조회/생성/변경/삭제 성공 (본 API 는 생성도 200 + `ApiResponse.ok` 로 반환) |
| 400 | 검증 실패, 잘못된 요청(예: 반려 사유 누락) |
| 403 | 권한 없음 (BusinessException 으로 던질 수 있으나 현재 사용처는 예시 주석 수준) |
| 404 | 대상 리소스 없음 (Agent/요청 미존재) |
| 500 | 서버 내부 오류 |

---

## 2. 도메인별 엔드포인트

범례: **구현 상태** 열 — ✅ 실제 로직 구현 / 🔧 스캐폴드(컨트롤러만, 빈 배열·null·더미 반환).

### 2.1 Agent (`agent`) — ✅ 구현
프론트 `agent/services/agentService.js` ↔ 백엔드 `AgentController` (`/api/v1/agents`).

| 메서드 | 경로 | 설명 | 요청 | 응답(data) | 프론트 함수 | 상태 |
|--------|------|------|------|-----------|-------------|------|
| GET | `/agents` | Agent 목록 | 없음 | `AgentResponse[]` | `fetchAgents()` | ✅ |
| GET | `/agents/{id}` | Agent 상세 | path: `id` (예: `ag-03`) | `AgentResponse` | `fetchAgent(id)` | ✅ |
| PATCH | `/agents/{id}/active` | 활성/비활성 토글 | body: `{ "active": boolean }` | `AgentResponse` | `updateActive(id, active)` | ✅ |
| PATCH | `/agents/{id}/favorite` | 즐겨찾기 토글 | body: `{ "fav": boolean }` | `AgentResponse` | `updateFavorite(id, fav)` | ✅ |

- 없는 id → 404 (`AgentService.findOrThrow` → `BusinessException.notFound`).
- 요청 바디 키가 백엔드 파싱과 정확히 일치해야 함: active 는 `active`, favorite 는 `fav` (`AgentController.setActive/setFavorite`).

### 2.2 권한 요청/승인 (`permission`) — ✅ 구현
프론트 `permission/services/permissionService.js` ↔ 백엔드 `PermissionController` (`/api/v1/requests`).

| 메서드 | 경로 | 설명 | 요청 | 응답(data) | 프론트 함수 | 상태 |
|--------|------|------|------|-----------|-------------|------|
| GET | `/requests?scope=mine\|approve` | 요청 목록 (내 요청함/승인함) | query: `scope` (기본 `mine`) | `RequestResponse[]` | `fetchRequests(scope)` | ✅ |
| POST | `/requests` | 권한 요청 생성 | body: `CreateRequestDto` (`@Valid`) | `RequestResponse` | `createRequest(payload)` | ✅ |
| POST | `/requests/{id}/approve` | 승인 | path: `id` (Long) | `RequestResponse` (status=approved) | `approveRequest(id)` | ✅ |
| POST | `/requests/{id}/deny` | 반려 (사유 필수) | path: `id`, body: `{ "reason": string }` | `RequestResponse` (status=denied) | `denyRequest(id, reason)` | ✅ |
| DELETE | `/requests/{id}` | 요청 취소(삭제) | path: `id` | `null` | `cancelRequestApi(id)` | ✅ |

- `scope=approve` → `findByRequesterNotOrderByIdDesc`(남이 낸 요청), 그 외 → `findByRequesterOrderByIdDesc`(내 요청).
- 반려 시 `reason` 이 비어 있으면 400 (`"반려 사유는 필수입니다."`).
- 취소 시 없는 id → 404. 요청자/승인자는 현재 데모값(`홍길동`) 고정.

### 2.3 리소스(도구) 권한 (`resource`) — 🔧 스캐폴드
프론트 `permission/services/resourceService.js` ↔ 백엔드 `ResourceController` (`/api/v1/resources`).

| 메서드 | 경로 | 설명 | 요청 | 응답(data) | 프론트 함수 | 상태 |
|--------|------|------|------|-----------|-------------|------|
| GET | `/resources/me` | 내 도구 권한 맵 `{ name: {owner, perm} }` | 없음 | 현재 `{}` (빈 맵) | `fetchMyResources()` | 🔧 |
| POST | `/resources/{name}/request` | 도구 권한 요청 | path: `name` (URL 인코딩) | 현재 `{name, perm:"pending"}` 더미 | `requestResourceApi(name)` | 🔧 |

- 목표 규칙: "Agent 실행에 필요한 도구를 하나라도 미보유하면 실행 불가" 의 데이터 소스.
- 구현 시 `PermissionService.create(...)` 를 재사용해 `targetType=resource` 요청을 생성하는 것이 설계 의도(컨트롤러 TODO).

### 2.4 지식 (RAG) (`knowledge`) — 🔧 스캐폴드
프론트 `knowledge/services/knowledgeService.js` ↔ 백엔드 `KnowledgeController` (`/api/v1/knowledge`).

| 메서드 | 경로 | 설명 | 요청 | 응답(data) | 프론트 함수 | 상태 |
|--------|------|------|------|-----------|-------------|------|
| GET | `/knowledge` | 지식 목록 (필터) | query: `category`, `scope`, `q` (모두 optional) | 현재 `[]` | `fetchKnowledge(params)` | 🔧 |
| GET | `/knowledge/categories` | 카테고리 트리 | 없음 | 현재 `[]` | `fetchCategoryTree()` | 🔧 |
| GET | `/knowledge/{id}` | 지식 상세 | path: `id` | 현재 `null` | `fetchKnowledgeDetail(id)` | 🔧 |

- 프론트 mock 은 `store.knowledge` / `data.js` 의 `knowledgeTree` 를 사용(필터는 화면 computed).
- 구현 시 agent 패턴대로 `Knowledge` 엔티티 + `KnowledgeCategory`(부모/자식) + Service/Repository/DTO 추가.

### 2.5 커뮤니티 (`community`) — 🔧 스캐폴드
프론트 `community/services/communityService.js` ↔ 백엔드 `CommunityController` (`/api/v1/community`).

| 메서드 | 경로 | 설명 | 요청 | 응답(data) | 프론트 함수 | 상태 |
|--------|------|------|------|-----------|-------------|------|
| GET | `/community/boards` | 게시판 목록(+요약) | 없음 | 현재 `[]` | `fetchBoards()` | 🔧 |
| GET | `/community/boards/{id}/posts` | 게시판 글 목록 | path: `id` | 현재 `[]` | `fetchPosts(boardId)` | 🔧 |

- 구현 시 `Board` 엔티티 목록 및 글 목록(페이징 권장) 반환.

### 2.6 인증 (`auth`) — 🔧 스캐폴드
프론트 `auth/services/authService.js` ↔ 백엔드 `AuthController` (`/api/v1/auth`).

| 메서드 | 경로 | 설명 | 요청 | 응답(data) | 프론트 함수 | 상태 |
|--------|------|------|------|-----------|-------------|------|
| POST | `/auth/login` | 로그인 → 토큰 발급 | body: `{ username, password }` | `{ accessToken, user:{name, dept} }` (현재 `accessToken="dummy-token"`) | `login(username, password)` | 🔧 |
| GET | `/auth/me` | 현재 로그인 사용자 | 없음 | `{ name, dept }` (현재 데모 `홍길동`/`마케팅팀`) | `me()` | 🔧 |

- 프론트 `login()` 성공 시 `accessToken` 을 `localStorage[axhub.accessToken]` 에 저장.
- `logout()` 은 프론트 로컬 토큰 제거만 수행(백엔드 호출 없음).
- 구현 시 `JwtProvider` 발급/검증 + `UserRepository` 연동(컨트롤러 TODO).

### 2.7 프론트 전용(백엔드 미존재) 호출
프론트 service 에는 존재하나 대응 Controller 가 아직 없는 계획된 엔드포인트. (참고용)

| 메서드 | 경로 | 프론트 함수 / 파일 | 비고 |
|--------|------|--------------------|------|
| POST | `/access-requests` | `submitAccessRequest()` — `access/services/accessService.js` | 결재선 포함 권한 신청. 프로세스 확정 후 연동 예정, 백엔드 Controller **없음**. |
| POST | `/chatbot/ask` | `getReply()` — `chatbot/services/chatbotService.js` | body `{question}` → `{answer}`. 현재 프론트 규칙기반 mock, 백엔드 Controller **없음**. |

---

## 3. 데이터 모델 (DTO / Entity)

응답 스키마는 실제 `dto`(record) 기준이며, 프론트 mock(`data.js` / `models/types.js`)과 필드명을 맞췄다.

### 3.1 AgentResponse (`agent/dto/AgentResponse.java`)
GET `/agents`, `/agents/{id}` 및 PATCH 응답의 요소.

| 필드 | 타입 | 설명 | Entity 원본(`Agent`) | 프론트 mock 키 |
|------|------|------|----------------------|----------------|
| `id` | string | 예 `ag-03` | `id` | `id` |
| `name` | string | Agent 이름 | `name` | `name` |
| `desc` | string | 한 줄 설명 | `description` | `desc` |
| `owner` | string | 소유(제공) 부서 | `owner` | `owner` |
| `scope` | string | `personal\|team\|dept\|company` | `scope`(enum) | `scope` |
| `perm` | string | `owner\|granted\|pending\|none\|denied\|expired` | `perm`(enum) | `perm` |
| `active` | boolean | 활성 여부 | `active` | `active` |
| `fav` | boolean | 즐겨찾기 | `favorite` | `fav` |
| `knowledge` | int | 연결 지식 수 | `knowledgeCount` | `knowledge` |
| `runs` | int | 누적 실행 수 | `runs` | `runs` |
| `category` | string | 카테고리 | `category` | `category` |
| `model` | string | 사용 LLM | `model` | `model` |
| `version` | string | 버전 | `version` | `version` |
| `tools` | string[] | 활용 도구 이름 목록 | `tools`(@ElementCollection) | `tools` |

> 참고: 프론트 mock 에는 `updated`(YYYY-MM-DD), `examples`(추천 질문) 도 있으나 현재 `AgentResponse` DTO 에는 **미포함**.
> Entity 는 `BaseTimeEntity` 상속으로 `createdAt`/`updatedAt` 을 가지지만 DTO 로 노출하지 않는다.

### 3.2 PermissionRequest 계열

**CreateRequestDto (요청 바디, `permission/dto/CreateRequestDto.java`)**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `targetType` | string | ✔(`@NotBlank`) | `agent\|knowledge\|resource` |
| `targetId` | string | ✔ | 대상 식별자 |
| `targetName` | string | ✔ | 대상 표시명 |
| `permType` | string |  | 권한 종류(사용/열람/도구 사용 등) |
| `period` | string |  | 사용 기간 |
| `reason` | string | ✔(`"요청 사유는 필수입니다."`) | 요청 사유 |

**RequestResponse (응답, `permission/dto/RequestResponse.java`)**

| 필드 | 타입 | 설명 | Entity 원본(`PermissionRequest`) |
|------|------|------|----------------------------------|
| `id` | Long | 요청 PK (auto increment) | `id` |
| `targetType` | string | `agent\|knowledge\|resource` | `targetType`(enum) |
| `targetId` | string | 대상 식별자 | `targetId` |
| `targetName` | string | 대상 표시명 | `targetName` |
| `requester` | string | 요청자(현재 데모 `홍길동`) | `requester` |
| `dept` | string | 요청자 부서 | `dept` |
| `permType` | string | 권한 종류 | `permType` |
| `period` | string | 사용 기간 | `period` |
| `reason` | string | 요청 사유 | `reason` |
| `status` | string | `pending\|approved\|denied` (생성 시 항상 `pending`) | `status`(enum) |
| `sla` | string | SLA 표시(생성 시 `D-3` 고정) | `sla` |
| `owner` | string | 리소스 요청 시 승인 관리자 부서 | `owner` |
| `denyReason` | string | 반려 사유(반려 시 세팅) | `denyReason` |

> 프론트 `PermRequest` 타입(`models/types.js`)에는 `mine`(내 요청 여부), `createdAt` 이 있으나
> 백엔드 DTO 에는 `mine` 없음(서버는 `scope` 파라미터로 구분). `createdAt` 은 Entity 에 있으나 DTO 미노출.

### 3.3 Resource (mock 기준, 백엔드 DTO 미구현)
`GET /resources/me` 의 목표 응답 형태는 `{ 도구이름: { owner, perm } }` 맵.
프론트 mock(`data.js` `seedResources`) 요소: `name`, `type`(tool/skill/middleware/mcp), `owner`, `perm`(granted/none/pending/denied), `proto`, `desc`, `tags[]`.
(백엔드 Entity/DTO 는 아직 없음 — agent 패턴으로 신설 필요.)

---

## 4. 알려진 미구현 / 불일치

| 항목 | 내용 | 근거 |
|------|------|------|
| 인증 미강제 | `SecurityConfig` 가 `permitAll` — JWT 필터/검증 없음. 모든 API 무인증 접근 가능(개발용). | `SecurityConfig.java` |
| auth 더미 응답 | `/auth/login` 이 `dummy-token` 과 고정 사용자 반환. 실제 발급/검증 미구현. | `AuthController.java` |
| 사용자 고정 | permission 의 요청자/부서가 `홍길동`/`마케팅팀` 하드코딩. 인증 연동 후 `@AuthenticationPrincipal` 로 교체 예정. | `PermissionController.java` |
| knowledge/community/resource | 컨트롤러만 존재, Service/Repository/Entity 미구현 → 빈 배열·`null`·더미 반환. | 각 Controller |
| resource↔permission 미연동 | `/resources/{name}/request` 가 `PermissionService.create` 재사용하도록 연동 필요(현재 더미). | `ResourceController` TODO |
| 승인 시 권한 반영 없음 | `approve()` 가 대상(Agent/지식/도구) 권한을 `granted` 로 바꾸는 후속 연동 미구현. | `PermissionService.approve` TODO |
| access-requests / chatbot | 프론트 service 는 있으나 백엔드 Controller 부재(계획됨). | accessService.js / chatbotService.js |

---

## 부록. 엔드포인트 요약

- 백엔드 구현 엔드포인트: **총 18개** (agent 4 · permission 5 · resource 2 · knowledge 3 · community 2 · auth 2).
  - ✅ 로직 구현: agent(4) + permission(5) = **9개**
  - 🔧 스캐폴드(골격만): resource(2) + knowledge(3) + community(2) + auth(2) = **9개**
- 프론트 전용(백엔드 미존재): `/access-requests`, `/chatbot/ask` = **2개**
