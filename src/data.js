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
export const seedResources = [
  { name: '문서 검색', owner: 'AI플랫폼팀', perm: 'granted' },
  { name: '문서 요약', owner: 'AI플랫폼팀', perm: 'granted' },
  { name: '요약', owner: 'AI플랫폼팀', perm: 'granted' },
  { name: '지식 검색', owner: 'AI플랫폼팀', perm: 'granted' },
  { name: '문서 생성', owner: 'AI플랫폼팀', perm: 'granted' },
  { name: '근거 조항 인용', owner: 'AI플랫폼팀', perm: 'granted' },
  { name: '조항 인용', owner: 'AI플랫폼팀', perm: 'granted' },
  { name: '사내 양식 템플릿', owner: '경영지원부', perm: 'granted' },
  { name: '응대 문안 생성', owner: 'CS팀', perm: 'granted' },
  { name: 'FAQ 검색', owner: 'CS팀', perm: 'granted' },
  { name: '티켓 분류', owner: '정보시스템부', perm: 'granted' },
  { name: '지표 수집', owner: '데이터플랫폼팀', perm: 'granted' },
  { name: 'STT 텍스트 정리', owner: 'IT인프라팀', perm: 'granted' },
  { name: '메일 연동', owner: 'IT인프라팀', perm: 'granted' },
  { name: '일정 연동', owner: 'IT인프라팀', perm: 'granted' },
  { name: '유사 사례 비교', owner: '심사부', perm: 'granted' },
  // 미보유 — 권한 요청 필요(데모)
  { name: '표 데이터 분석', owner: '데이터플랫폼팀', perm: 'none' },
  { name: '차트 생성', owner: '데이터플랫폼팀', perm: 'none' },
  { name: '약관 검색', owner: '상품개발부', perm: 'none' },
  { name: '심사 기준 검색', owner: '심사부', perm: 'none' },
  { name: '규정 검색', owner: '준법감시부', perm: 'none' },
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
