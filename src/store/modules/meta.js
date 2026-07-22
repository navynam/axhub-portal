/**
 * 파생 메타(라벨/탭 정의) — 공통 개발자 담당
 * -----------------------------------------------------------------------------
 * 화면 여러 곳에서 공유하는 표시용 상수. 실제 값은 shared/constants 를 재사용한다.
 */
import { PERM_META } from '../../shared/constants/enums'

/** 권한 상태 → { label, cls } (StatusPill 에서 사용). shared 의 PERM_META 를 재노출 */
export const permMeta = PERM_META

/** 공개 범위 탭 정의 */
export const scopeTabs = [
  { key: 'personal', label: '내' },
  { key: 'team', label: '팀' },
  { key: 'dept', label: '부서' },
  { key: 'company', label: '전사' },
]
