/**
 * 공통 상수/열거형 (공통 개발자 담당)
 * -----------------------------------------------------------------------------
 * 화면·스토어·서비스 전반에서 문자열 리터럴을 직접 쓰지 않고 이 상수를 참조한다.
 * (오타 방지 + 의미 명확화 + 백엔드 enum 과 1:1 매핑)
 */

/** 권한(소유) 상태 — Agent / 지식 카드에 공통 적용 */
export const Perm = {
  OWNER: 'owner',     // 내 소유
  GRANTED: 'granted', // 사용중(권한 보유)
  PENDING: 'pending', // 요청중
  NONE: 'none',       // 권한 없음
  DENIED: 'denied',   // 반려됨
  EXPIRED: 'expired', // 만료
}

/** 권한 상태별 표시 메타 (pill 라벨/색상 클래스) */
export const PERM_META = {
  [Perm.OWNER]:   { label: '내 소유',  cls: 'pill-owner' },
  [Perm.GRANTED]: { label: '● 사용중', cls: 'pill-active' },
  [Perm.PENDING]: { label: '요청중',   cls: 'pill-pending' },
  [Perm.NONE]:    { label: '권한없음', cls: 'pill-none' },
  [Perm.DENIED]:  { label: '반려',     cls: 'pill-denied' },
  [Perm.EXPIRED]: { label: '만료',     cls: 'pill-none' },
}

/** 권한 요청 처리 상태 */
export const ReqStatus = {
  PENDING: 'pending',   // 요청중(승인 대기)
  APPROVED: 'approved', // 승인
  DENIED: 'denied',     // 반려
}

/** 요청 대상 유형 */
export const TargetType = {
  AGENT: 'agent',
  KNOWLEDGE: 'knowledge',
  RESOURCE: 'resource', // 도구/스킬 등 리소스
}

/** 공개 범위(스코프) */
export const Scope = {
  PERSONAL: 'personal',
  TEAM: 'team',
  DEPT: 'dept',
  COMPANY: 'company',
}

/** 스코프 한글 라벨 */
export const SCOPE_LABEL = {
  [Scope.PERSONAL]: '개인',
  [Scope.TEAM]: '팀',
  [Scope.DEPT]: '부서',
  [Scope.COMPANY]: '전사',
}

/** 사용자 역할 */
export const Role = { USER: 'user', ADMIN: 'admin' }

/** 토스트 종류 */
export const ToastKind = { INFO: 'info', OK: 'ok', WARN: 'warn' }
