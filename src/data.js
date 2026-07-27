// AX-HUB 사용자 포털 — 목업 데이터
// perm: 'owner'(내 소유) | 'granted'(사용중) | 'pending'(요청중) | 'none'(권한없음) | 'denied'(반려) | 'expired'(만료)

export const seedAgents = [
  { id: 'ag-01', name: '내 업무 요약 Agent', desc: '메일·일정·문서를 모아 하루 업무 브리핑을 생성합니다.', owner: '개인', scope: 'personal', perm: 'owner', active: true, knowledge: 1, runs: 42, fav: true,
    category: '개인 생산성', model: 'GPT-4o mini', version: 'v1.4', updated: '2026-06-30', tools: ['메일 연동', '일정 연동', '문서 요약'], examples: ['오늘 일정 브리핑 만들어줘', '안 읽은 메일 요약해줘'] },
  { id: 'ag-02', name: '회의록 정리 Agent', desc: '녹취 텍스트를 회의록 양식으로 정리합니다.', owner: '개인', scope: 'personal', perm: 'owner', active: false, knowledge: 0, runs: 17,
    category: '문서', model: 'GPT-4o mini', version: 'v1.1', updated: '2026-06-20', tools: ['STT 텍스트 정리', '요약'], examples: ['이 녹취록 회의록으로 정리해줘', '액션 아이템만 뽑아줘'] },
  { id: 'ag-03', name: '재무분석 Agent', desc: '분기 재무 데이터를 분석하고 리포트 초안을 작성합니다.', owner: '재무기획팀', scope: 'team', perm: 'none', active: true, knowledge: 2, runs: 312,
    category: '재무', model: 'Claude 3.5 Sonnet', version: 'v2.0', updated: '2026-06-30', tools: ['표 데이터 분석', '차트 생성', '문서 검색'], examples: ['2분기 손익 요약해줘', '전분기 대비 비용 증감 분석해줘'] },
  { id: 'ag-04', name: '캠페인 성과 Agent', desc: '마케팅 캠페인 지표를 수집·요약합니다.', owner: '마케팅팀', scope: 'team', perm: 'granted', active: true, knowledge: 1, runs: 198, fav: true,
    category: '마케팅', model: 'GPT-4o', version: 'v1.6', updated: '2026-06-28', tools: ['지표 수집', '문서 검색'], examples: ['지난달 캠페인 ROI 요약해줘', '채널별 성과 비교해줘'] },
  { id: 'ag-05', name: '고객 응대 지원 Agent', desc: '상담 스크립트와 FAQ 기반 응대 문안을 제안합니다.', owner: 'CS팀', scope: 'team', perm: 'denied', active: true, knowledge: 2, runs: 421,
    category: 'CS', model: 'Claude 3.5 Sonnet', version: 'v1.9', updated: '2026-06-29', tools: ['FAQ 검색', '응대 문안 생성'], examples: ['환불 문의 응대 문안 작성해줘', '불만 고객 응대 스크립트 만들어줘'] },
  { id: 'ag-06', name: '보험금 심사 지원 Agent', desc: '심사 기준 지식 기반으로 심사 검토 의견을 생성합니다.', owner: '심사부', scope: 'dept', perm: 'none', active: true, knowledge: 3, runs: 1024,
    category: '심사', model: 'Claude 3.5 Sonnet', version: 'v2.1', updated: '2026-06-27', tools: ['심사 기준 검색', '유사 사례 비교'], examples: ['이 청구 건 심사 의견 작성해줘', '유사 심사 사례 찾아줘'] },
  { id: 'ag-07', name: '상품 약관 Q&A Agent', desc: '보험 상품 약관을 근거와 함께 답변합니다.', owner: '상품개발부', scope: 'dept', perm: 'pending', active: true, knowledge: 2, runs: 866,
    category: '상품', model: 'GPT-4o', version: 'v1.8', updated: '2026-06-26', tools: ['약관 검색', '근거 조항 인용'], examples: ['암 진단금 지급 조건 알려줘', '이 특약의 면책 사항은?'] },
  { id: 'ag-08', name: '규정·컴플라이언스 Agent', desc: '사내 규정 질의에 근거 조항과 함께 답변합니다.', owner: '준법감시부', scope: 'company', perm: 'granted', active: true, knowledge: 1, runs: 2310, fav: true,
    category: '준법', model: 'Claude 3.5 Sonnet', version: 'v2.2', updated: '2026-07-01', tools: ['규정 검색', '조항 인용'], examples: ['개인정보 위탁 규정 알려줘', '내부통제 기준 조항 찾아줘'] },
  { id: 'ag-09', name: '문서 초안 작성 Agent', desc: '보고서·공문 초안을 사내 양식으로 작성합니다.', owner: '경영지원부', scope: 'company', perm: 'none', active: true, knowledge: 1, runs: 1540,
    category: '문서', model: 'GPT-4o', version: 'v1.5', updated: '2026-06-24', tools: ['사내 양식 템플릿', '문서 생성'], examples: ['품의서 초안 작성해줘', '대외 공문 초안 만들어줘'] },
  { id: 'ag-10', name: 'IT 헬프데스크 Agent', desc: '사내 IT 문의를 1차 응대하고 티켓을 분류합니다.', owner: '정보시스템부', scope: 'company', perm: 'expired', active: true, knowledge: 1, runs: 3105,
    category: 'IT', model: 'GPT-4o mini', version: 'v1.3', updated: '2026-06-22', tools: ['티켓 분류', '지식 검색'], examples: ['VPN 접속이 안 될 때 해결법', '노트북 교체 신청 방법 알려줘'] },
]

// 리소스(도구) 레지스트리 — Agent 실행에 필요한 도구별 운영 부서(owner)와 현재 사용자 권한(perm)
// perm: 'granted'(보유) | 'none'(권한없음) | 'pending'(요청중) | 'denied'(반려)
// type: tool(도구) | skill(스킬) | middleware(미들웨어) | mcp(MCP)
// 리소스(도구·미들웨어·스킬·MCP) 카탈로그
//  · type: tool | middleware | skill | mcp   (유형 탭)
//  · proto: built-in | custom | http | mcp-http | mcp-stdio  (연결 방식 배지)
//  · tags: 검색·필터용 태그   · desc: 카드 설명
export const seedResources = [
  // ── 도구 ──
  { name: '문서 검색', type: 'tool', owner: 'AI플랫폼팀', perm: 'granted', proto: 'mcp-http', desc: '사내 문서를 검색합니다', tags: ['rag', 'internal-documents', 'search'] },
  { name: '지식 검색', type: 'tool', owner: 'AI플랫폼팀', perm: 'granted', proto: 'mcp-http', desc: '지식 베이스를 하이브리드 방식으로 검색합니다', tags: ['rag', 'knowledge-base', 'hybrid-search'] },
  { name: 'FAQ 검색', type: 'tool', owner: 'CS팀', perm: 'granted', proto: 'built-in', desc: 'FAQ 문서를 검색합니다', tags: ['search', 'knowledge-base'] },
  { name: '지표 수집', type: 'tool', owner: '데이터플랫폼팀', perm: 'granted', proto: 'http', desc: '운영 지표를 수집합니다', tags: ['api', 'data-extraction'] },
  { name: '표 데이터 분석', type: 'tool', owner: '데이터플랫폼팀', perm: 'none', proto: 'built-in', desc: '표 형식 데이터를 분석합니다', tags: ['data-extraction', 'code'] },
  { name: '차트 생성', type: 'tool', owner: '데이터플랫폼팀', perm: 'none', proto: 'built-in', desc: '데이터로 차트를 생성합니다', tags: ['data-extraction'] },
  { name: '약관 검색', type: 'tool', owner: '상품개발부', perm: 'none', proto: 'mcp-http', desc: '보험 약관 문서를 검색합니다', tags: ['rag', 'internal-documents', 'search'] },
  { name: '심사 기준 검색', type: 'tool', owner: '심사부', perm: 'none', proto: 'mcp-http', desc: '심사 기준·판례를 검색합니다', tags: ['rag', 'internal-documents'] },
  { name: '규정 검색', type: 'tool', owner: '준법감시부', perm: 'none', proto: 'mcp-http', desc: '사내 규정·컴플라이언스 문서를 검색합니다', tags: ['rag', 'internal-documents'] },
  // ── 스킬 ──
  { name: '문서 요약', type: 'skill', owner: 'AI플랫폼팀', perm: 'granted', proto: 'built-in', desc: '긴 문서를 핵심 위주로 요약합니다', tags: ['ai-powered', 'summarize'] },
  { name: '요약', type: 'skill', owner: 'AI플랫폼팀', perm: 'granted', proto: 'built-in', desc: '텍스트를 간결하게 요약합니다', tags: ['ai-powered', 'summarize'] },
  { name: '문서 생성', type: 'skill', owner: 'AI플랫폼팀', perm: 'granted', proto: 'custom', desc: '서식에 맞춰 문서를 생성합니다', tags: ['ai-powered', 'generate'] },
  { name: '근거 조항 인용', type: 'skill', owner: 'AI플랫폼팀', perm: 'granted', proto: 'custom', desc: '근거가 되는 조항을 찾아 인용합니다', tags: ['ai-powered', 'citation'] },
  { name: '조항 인용', type: 'skill', owner: 'AI플랫폼팀', perm: 'granted', proto: 'custom', desc: '관련 조항을 인용합니다', tags: ['citation'] },
  { name: '응대 문안 생성', type: 'skill', owner: 'CS팀', perm: 'granted', proto: 'custom', desc: '고객 응대 문안을 생성합니다', tags: ['ai-powered', 'communication', 'generate'] },
  { name: '유사 사례 비교', type: 'skill', owner: '심사부', perm: 'granted', proto: 'custom', desc: '유사 심사 사례를 비교합니다', tags: ['ai-powered', 'compare'] },
  { name: '티켓 분류', type: 'skill', owner: '정보시스템부', perm: 'granted', proto: 'built-in', desc: '문의 티켓을 자동 분류합니다', tags: ['ai-powered', 'classification'] },
  { name: 'STT 텍스트 정리', type: 'skill', owner: 'IT인프라팀', perm: 'granted', proto: 'built-in', desc: '음성 인식 결과를 정리합니다', tags: ['ai-powered', 'transcription'] },
  // ── 미들웨어 ──
  { name: '메일 연동', type: 'middleware', owner: 'IT인프라팀', perm: 'granted', proto: 'http', desc: '사내 메일 시스템과 연동합니다', tags: ['email', 'communication', 'transactional'] },
  { name: '일정 연동', type: 'middleware', owner: 'IT인프라팀', perm: 'granted', proto: 'http', desc: '캘린더·일정과 연동합니다', tags: ['communication', 'transactional'] },
  { name: '사내 양식 템플릿', type: 'middleware', owner: '경영지원부', perm: 'granted', proto: 'built-in', desc: '사내 문서 양식을 제공합니다', tags: ['internal-documents'] },
  { name: '그룹웨어 연동', type: 'middleware', owner: '정보시스템부', perm: 'none', proto: 'http', desc: '그룹웨어와 연동합니다', tags: ['communication', 'transactional'] },
  { name: 'SSO/EIAM 커넥터', type: 'middleware', owner: '정보시스템부', perm: 'none', proto: 'custom', desc: 'SSO·계정 인증과 연동합니다', tags: ['api', 'transactional'] },
  { name: 'ITSM 연동', type: 'middleware', owner: 'IT인프라팀', perm: 'none', proto: 'http', desc: 'ITSM 티켓 시스템과 연동합니다', tags: ['api', 'dev-tools', 'transactional'] },
  // ── MCP ──
  { name: 'Confluence MCP', type: 'mcp', owner: '협업플랫폼팀', perm: 'granted', proto: 'mcp-http', desc: 'Confluence 문서를 검색·조회합니다', tags: ['knowledge-base', 'search', 'internal-documents'] },
  { name: 'Jira MCP', type: 'mcp', owner: '협업플랫폼팀', perm: 'none', proto: 'mcp-http', desc: 'Jira 이슈를 조회·관리합니다', tags: ['dev-tools', 'api'] },
  { name: 'GitHub MCP', type: 'mcp', owner: 'DevOps팀', perm: 'none', proto: 'mcp-http', desc: 'GitHub 저장소·PR을 조회합니다', tags: ['dev-tools', 'code', 'api'] },
  { name: 'Slack MCP', type: 'mcp', owner: '협업플랫폼팀', perm: 'none', proto: 'mcp-stdio', desc: 'Slack 메시지를 조회·전송합니다', tags: ['communication', 'api'] },
  { name: 'PostgreSQL MCP', type: 'mcp', owner: '데이터플랫폼팀', perm: 'none', proto: 'mcp-stdio', desc: 'PostgreSQL 데이터를 조회합니다', tags: ['data-extraction', 'api'] },
  { name: 'Splunk MCP', type: 'mcp', owner: 'IT인프라팀', perm: 'none', proto: 'mcp-stdio', desc: 'Splunk 로그를 검색합니다', tags: ['dev-tools', 'data-extraction'] },
]

// 설정 > KEY 관리 — MCP·Agent 등록에 사용하는 API 키 (마스킹 표시용 목데이터)
//  · type: llm(LLM 모델) | mcp(MCP 서버) | agent(Agent 등록)  · status: active | expired
export const seedKeys = [
  { id: 'key-001', name: 'Anthropic Claude', type: 'llm', provider: 'Anthropic', value: 'sk-ant-api03-9Fh2kD8sLxQ4nB1', created: '2026-07-10', status: 'active' },
  { id: 'key-002', name: 'OpenAI GPT', type: 'llm', provider: 'OpenAI', value: 'sk-proj-7bQ1mZ3vT0aWpE9dRc', created: '2026-06-28', status: 'active' },
  { id: 'key-003', name: 'GitHub MCP 토큰', type: 'mcp', provider: 'GitHub', value: 'ghp_A1b2C3d4E5f6G7h8I9j0', created: '2026-07-05', status: 'active' },
  { id: 'key-004', name: 'Confluence MCP', type: 'mcp', provider: 'Atlassian', value: 'ATATT3xFfGF0aBcDeFgHiJkL', created: '2026-07-02', status: 'expired' },
  { id: 'key-005', name: 'AX-HUB Agent 등록 키', type: 'agent', provider: 'AX-HUB', value: 'axk_live_5Kd9Qw2Rt7Yu3IpM', created: '2026-07-12', status: 'active' },
]

// 용어사전 — AI/에이전트·보험업무·데이터·인프라 용어 (대화형 조회용 목데이터)
//  · keys: 검색 매칭 키워드(한/영/약어)  · related: 관련 용어명
export const glossaryTerms = [
  // ── AI / 에이전트 ──
  { term: 'RAG', cat: 'AI/에이전트', keys: ['rag', '검색 증강 생성', 'retrieval'], related: ['임베딩', '벡터 검색', '지식베이스'],
    def: '검색 증강 생성(Retrieval-Augmented Generation). 질문과 관련된 문서를 먼저 검색해 근거로 삼아 LLM이 답변을 생성하는 방식. 최신·사내 지식 반영과 할루시네이션 완화에 쓰인다.' },
  { term: 'LLM', cat: 'AI/에이전트', keys: ['llm', '대규모 언어 모델', 'language model'], related: ['프롬프트', '토큰', '파인튜닝'],
    def: '대규모 언어 모델(Large Language Model). 방대한 텍스트로 학습해 자연어를 이해·생성하는 AI 모델. GPT·Claude 등이 해당된다.' },
  { term: '에이전트(Agent)', cat: 'AI/에이전트', keys: ['에이전트', 'agent'], related: ['MCP', '도구', 'ABAC'],
    def: '특정 목적을 위해 도구·지식·LLM을 조합해 작업을 자동 수행하는 AI 단위. AX-HUB에서는 에이전트가 사용하는 도구 권한을 모두 보유해야 실행할 수 있다.' },
  { term: 'MCP', cat: 'AI/에이전트', keys: ['mcp', 'model context protocol'], related: ['에이전트(Agent)', '도구'],
    def: 'Model Context Protocol. 문서·이슈·DB 등 외부 시스템을 표준 방식으로 LLM/에이전트에 연결하는 프로토콜. AX-HUB 툴 관리의 연결 방식(mcp-stdio/mcp-http) 중 하나.' },
  { term: '프롬프트(Prompt)', cat: 'AI/에이전트', keys: ['프롬프트', 'prompt'], related: ['LLM', '토큰'],
    def: 'LLM에 작업을 지시하는 입력 텍스트. 역할·맥락·요구사항·출력 형식을 명확히 담을수록 결과 품질이 높아진다.' },
  { term: '파인튜닝(Fine-tuning)', cat: 'AI/에이전트', keys: ['파인튜닝', 'fine-tuning', '미세조정'], related: ['LLM'],
    def: '사전학습된 모델을 특정 도메인·작업 데이터로 추가 학습시켜 성능을 맞추는 것. RAG가 “근거 주입”이라면 파인튜닝은 “모델 자체 학습”이다.' },
  { term: '토큰(Token)', cat: 'AI/에이전트', keys: ['토큰', 'token'], related: ['LLM', '프롬프트'],
    def: 'LLM이 텍스트를 처리하는 최소 단위(대략 단어 조각). 입력·출력 토큰 수가 사용량과 비용 산정의 기준이 된다.' },
  { term: '할루시네이션(Hallucination)', cat: 'AI/에이전트', keys: ['할루시네이션', 'hallucination', '환각'], related: ['RAG'],
    def: 'LLM이 사실과 다른 내용을 그럴듯하게 생성하는 현상. RAG·근거 문장 인용·출처 표기로 완화한다.' },
  { term: '임베딩(Embedding)', cat: 'AI/에이전트', keys: ['임베딩', 'embedding', '벡터'], related: ['벡터 검색', 'RAG'],
    def: '텍스트를 의미를 담은 고차원 벡터로 변환한 표현. 의미가 가까운 문장끼리 벡터 공간에서 가깝게 위치해 유사도 검색의 기반이 된다.' },
  { term: '벡터 검색(Vector Search)', cat: 'AI/에이전트', keys: ['벡터 검색', 'vector search', '유사도 검색'], related: ['임베딩', 'RAG'],
    def: '임베딩 벡터 간 유사도로 의미가 가까운 문서를 찾는 검색. 키워드 일치가 아닌 “의미” 기반이라 RAG의 핵심 요소다.' },
  // ── 보험 / 업무 ──
  { term: '언더라이팅(Underwriting)', cat: '보험/업무', keys: ['언더라이팅', 'underwriting', '인수심사'], related: ['손해율', '클레임'],
    def: '보험 계약 인수 심사. 피보험자의 위험을 평가해 인수 여부·조건·보험료를 결정하는 업무.' },
  { term: '약관', cat: '보험/업무', keys: ['약관', 'terms'], related: ['컴플라이언스'],
    def: '보험 상품의 보장 내용·지급 조건·면책 사항을 규정한 계약 문서. 상품별로 판매중·판매중지 약관이 관리된다.' },
  { term: '컴플라이언스(Compliance)', cat: '보험/업무', keys: ['컴플라이언스', 'compliance', '준법'], related: ['ABAC'],
    def: '법규·감독규정·내부통제 준수. 준법감시 업무의 핵심이며 위반 시 제재 위험이 있다.' },
  { term: '손해율', cat: '보험/업무', keys: ['손해율', 'loss ratio'], related: ['언더라이팅', '클레임'],
    def: '수입 보험료 대비 지급 보험금 비율. 상품·계약의 수익성을 나타내는 핵심 지표.' },
  { term: '클레임(Claim)', cat: '보험/업무', keys: ['클레임', 'claim', '보험금 청구'], related: ['언더라이팅', '손해율'],
    def: '보험금 청구. 사고·질병 등 보험사고 발생 시 계약자가 보험금을 요구하는 것.' },
  // ── 데이터 / RAG ──
  { term: '지식베이스(Knowledge Base)', cat: '데이터/RAG', keys: ['지식베이스', 'knowledge base', 'kb'], related: ['컬렉션', 'RAG'],
    def: '에이전트가 근거로 삼는 문서 집합. AX-HUB에서는 컬렉션 단위로 묶여 지식관리에서 관리된다.' },
  { term: '컬렉션(Collection)', cat: '데이터/RAG', keys: ['컬렉션', 'collection'], related: ['지식베이스'],
    def: '지식 문서를 주제·부서별로 묶은 단위. 지식관리 화면의 좌측 트리 노드에 해당한다.' },
  { term: 'ABAC', cat: '데이터/RAG', keys: ['abac', '속성 기반 접근', 'attribute'], related: ['에이전트(Agent)', 'SLA'],
    def: '속성 기반 접근 제어(Attribute-Based Access Control). 사용자·리소스의 속성으로 권한을 판정하는 방식. AX-HUB 권한 승인의 정책 기반.' },
  { term: 'SLA', cat: '데이터/RAG', keys: ['sla', 'service level'], related: ['ABAC'],
    def: '서비스 수준 협약(Service Level Agreement). 권한 요청 승인 기한 등 목표 처리 시간을 정의한다.' },
  // ── 시스템 / 인프라 ──
  { term: 'OCP', cat: '시스템/인프라', keys: ['ocp', 'openshift'], related: ['AIOps'],
    def: 'OpenShift Container Platform. 쿠버네티스 기반 컨테이너 운영 플랫폼. 시스템 모니터링의 관제 대상 환경.' },
  { term: 'AIOps', cat: '시스템/인프라', keys: ['aiops'], related: ['MTTD', 'MTTR', 'OCP'],
    def: 'AI 기반 IT 운영. 로그·지표를 분석해 장애를 예측·탐지·대응한다. IT 운영 관리 콘솔의 핵심 개념.' },
  { term: 'MTTD', cat: '시스템/인프라', keys: ['mttd', '평균 탐지'], related: ['MTTR', 'AIOps'],
    def: '평균 탐지 시간(Mean Time To Detect). 장애 발생부터 감지까지 걸린 평균 시간. 짧을수록 좋다.' },
  { term: 'MTTR', cat: '시스템/인프라', keys: ['mttr', '평균 복구'], related: ['MTTD', 'AIOps'],
    def: '평균 복구 시간(Mean Time To Repair). 장애 발생부터 복구 완료까지 평균 시간. 짧을수록 좋다.' },
  { term: 'Redaction', cat: '시스템/인프라', keys: ['redaction', '비식별', '마스킹'], related: ['컴플라이언스'],
    def: '민감정보 비식별화. 개인정보·기밀을 가리고 전파하는 처리. 현황 전파(Computer-Use) 에이전트가 발송 전 수행한다.' },
  { term: 'p95', cat: '시스템/인프라', keys: ['p95', '95 백분위'], related: ['AIOps'],
    def: '95 백분위수 응답시간. 전체 요청의 95%가 이 시간 이내에 처리됨을 의미하는 성능 지표.' },
]

export const seedKnowledge = [
  { id: 'kn-01', name: '내 프로젝트 노트', desc: '개인 업무 노트·회의 메모 지식화', owner: '개인', scope: 'personal', perm: 'owner', docs: 86, linked: 1, updated: '2026-07-02', category: 'personal-note' },
  { id: 'kn-02', name: '캠페인 성과 데이터 지식', desc: '최근 3년 캠페인 리포트·지표 문서', owner: '마케팅팀', scope: 'team', perm: 'granted', docs: 430, linked: 2, updated: '2026-06-30', category: 'sales-camp' },
  { id: 'kn-03', name: '재무·회계 기준 지식', desc: '내부 회계 기준·재무 보고 가이드', owner: '재무기획팀', scope: 'team', perm: 'none', docs: 1020, linked: 4, updated: '2026-06-25', category: 'fin-account' },
  { id: 'kn-04', name: '보험금 심사 기준 지식', desc: '심사 매뉴얼·판례·사례 문서', owner: '심사부', scope: 'dept', perm: 'pending', docs: 860, linked: 3, updated: '2026-06-28', category: 'uw-standard' },
  { id: 'kn-05', name: '보험 상품 약관 지식베이스', desc: '판매중·판매중지 상품 약관 전체', owner: '상품개발부', scope: 'dept', perm: 'none', docs: 1240, linked: 5, updated: '2026-07-01', category: 'product-terms' },
  { id: 'kn-06', name: '사내 규정·컴플라이언스 지식', desc: '사규·감독규정·내부통제 문서', owner: '준법감시부', scope: 'company', perm: 'granted', docs: 2310, linked: 8, updated: '2026-07-02', category: 'common-reg' },
  { id: 'kn-07', name: '고객 응대 스크립트 지식', desc: '상담 스크립트·응대 가이드', owner: 'CS팀', scope: 'company', perm: 'none', docs: 430, linked: 2, updated: '2026-06-30', category: 'cs-script' },
]

// 지식 카테고리 트리 (실제 운영 시 100+ 카테고리까지 확장. leaf id 를 지식의 category 로 매핑)
export const knowledgeTree = [
  { id: 'common', name: '전사 공통', children: [
    { id: 'common-reg', name: '규정·컴플라이언스' },
    { id: 'common-hr', name: '인사·복무' },
    { id: 'common-sec', name: '정보보안' },
  ] },
  { id: 'sales', name: '영업·마케팅', children: [
    { id: 'sales-camp', name: '캠페인' },
    { id: 'sales-channel', name: '채널·제휴' },
    { id: 'sales-target', name: '고객 타겟팅' },
  ] },
  { id: 'product', name: '상품', children: [
    { id: 'product-terms', name: '약관' },
    { id: 'product-rate', name: '요율·특약' },
    { id: 'product-plan', name: '상품 기획' },
  ] },
  { id: 'uw', name: '심사·보상', children: [
    { id: 'uw-standard', name: '심사 기준' },
    { id: 'uw-claim', name: '보상·지급' },
    { id: 'uw-case', name: '분쟁·판례' },
  ] },
  { id: 'finance', name: '재무·회계', children: [
    { id: 'fin-account', name: '회계 기준' },
    { id: 'fin-tax', name: '세무·결산' },
    { id: 'fin-budget', name: '예산·자금' },
  ] },
  { id: 'customer', name: '고객·CS', children: [
    { id: 'cs-script', name: '상담 스크립트' },
    { id: 'cs-voc', name: 'VOC·FAQ' },
  ] },
  { id: 'it', name: 'IT·시스템', children: [
    { id: 'it-help', name: '헬프데스크' },
    { id: 'it-infra', name: '인프라·운영' },
  ] },
  { id: 'personal', name: '개인', children: [
    { id: 'personal-note', name: '업무 노트' },
  ] },
]

// 타인 요청 시드 — 승인함 데모용
export const seedRequests = [
  { id: 'rq-01', targetType: 'agent', targetId: 'ag-03', targetName: '재무분석 Agent', requester: '김영희', dept: '상품개발부', permType: '사용', period: '~2026-09-30', reason: '신상품 손익 시뮬레이션 검토', status: 'pending', sla: 'D-2', mine: false, createdAt: '2026-07-01' },
  { id: 'rq-02', targetType: 'knowledge', targetId: 'kn-04', targetName: '보험금 심사 기준 지식', requester: '이철수', dept: 'CS팀', permType: '열람', period: '~2026-08-31', reason: '민원 응대 시 심사 기준 확인', status: 'pending', sla: 'D-1', mine: false, createdAt: '2026-07-02' },
  { id: 'rq-03', targetType: 'agent', targetId: 'ag-07', targetName: '상품 약관 Q&A Agent', requester: '홍길동', dept: '마케팅팀', permType: '사용', period: '~2026-12-31', reason: '캠페인 문안의 약관 적합성 사전 검토', status: 'pending', sla: 'D-3', mine: true, createdAt: '2026-07-02' },
  { id: 'rq-04', targetType: 'knowledge', targetId: 'kn-04', targetName: '보험금 심사 기준 지식', requester: '홍길동', dept: '마케팅팀', permType: '열람', period: '~2026-09-30', reason: '보장 관련 콘텐츠 제작 근거 확인', status: 'pending', sla: 'D-3', mine: true, createdAt: '2026-07-02' },
  { id: 'rq-05', targetType: 'agent', targetId: 'ag-05', targetName: '고객 응대 지원 Agent', requester: '홍길동', dept: '마케팅팀', permType: '사용', period: '상시', reason: '캠페인 문의 응대 참고', status: 'denied', denyReason: '상시 권한은 CS 직무에 한함. 기간제로 재요청 바랍니다.', sla: '-', mine: true, createdAt: '2026-06-24' },
]

export const seedBoards = [
  { id: 'notice', name: '공지사항', desc: '시스템·운영 공지', badge: '공지 4', posts: [
    { title: '[중요] 신규 Agent 12종 오픈 안내', author: '운영자', date: '2026-07-01', views: 812 },
    { title: '7월 정기 점검 안내 (7/12 02:00~04:00)', author: '운영자', date: '2026-06-28', views: 455 },
  ]},
  { id: 'guide', name: '활용 가이드', desc: 'Agent·지식 활용법', badge: '가이드 26', posts: [
    { title: '재무분석 Agent로 분기 리포트 30분 만에 쓰기', author: '재무기획팀', date: '2026-06-30', views: 1204, agent: 'ag-03' },
    { title: '약관 Q&A Agent 프롬프트 베스트 5', author: '상품개발부', date: '2026-06-27', views: 980, agent: 'ag-07' },
  ]},
  { id: 'qna', name: 'Q&A', desc: '질문과 답변', badge: '새 질문 5', posts: [
    { title: '권한 승인은 보통 얼마나 걸리나요?', author: '박민수', date: '2026-07-02', views: 210 },
    { title: '지식 최신화 주기가 어떻게 되나요?', author: '최지은', date: '2026-07-01', views: 143 },
  ]},
  { id: 'faq', name: 'FAQ', desc: '자주 묻는 질문', badge: 'FAQ 18', posts: [
    { title: '반려된 요청은 어떻게 재요청하나요?', author: '운영자', date: '2026-06-20', views: 640 },
  ]},
  { id: 'lounge', name: '라운지', desc: '자유 소통 공간', badge: '새 글 9', posts: [
    { title: '다들 어떤 Agent 제일 자주 쓰세요?', author: '익명', date: '2026-07-02', views: 388 },
  ]},
  { id: 'best', name: '우수 활용사례', desc: '부서별 베스트 사례', badge: '사례 11', posts: [
    { title: '[CS팀] 응대 Agent 도입 후 처리시간 34% 단축', author: 'CS팀', date: '2026-06-29', views: 1560, agent: 'ag-05' },
  ]},
]
