# AX-HUB Backend (Spring Boot)

현대모비스 AX-HUB 사용자 포털의 백엔드 API 서버. 프론트(`../` axhub-portal, Vue3)와 `/api/v1` 로 통신한다.

## 기술 스택
- Java 17 · Spring Boot 3.2 · Spring Web / Data JPA / Security
- JWT(jjwt) · H2(개발) → PostgreSQL/MySQL(운영)
- Gradle · Lombok

## 실행
```bash
cd backend
./gradlew bootRun        # http://localhost:8080
# H2 콘솔: http://localhost:8080/h2-console (jdbc:h2:mem:axhub)
```
프론트에서 실제 API 를 쓰려면 `axhub-portal/.env` 에 `VITE_USE_API=true`, `VITE_API_BASE=http://localhost:8080/api/v1` 설정.

## 표준 레이어 구조 (도메인마다 동일)
```
com.axhub.<도메인>
├─ <도메인>Controller.java   REST 엔드포인트 (얇게 유지, DTO in/out)
├─ <도메인>Service.java      업무 로직 + 트랜잭션
├─ <도메인>Repository.java   Spring Data JPA
├─ domain/<엔티티>.java       DB 매핑 + 도메인 로직
└─ dto/*.java                요청/응답 DTO (record)
```
공통 규약은 `com.axhub.common` 참고:
- `response/ApiResponse` : 모든 응답 `{success, data, message}` 래핑
- `exception/*` : `BusinessException` + `GlobalExceptionHandler`
- `config/SecurityConfig` : 보안(현재 permitAll, 인증 연동 시 강화)
- `entity/BaseTimeEntity` : 생성/수정 시각 자동 기록

## 도메인별 담당 (프론트와 동일 분할)
| 도메인 | 패키지 | 담당 | 상태 |
|--------|--------|------|------|
| Agent | `agent` | 개발자 A | ✅ 레퍼런스 구현 |
| 권한 요청/승인 | `permission` | 개발자 C | ✅ 레퍼런스 구현 |
| 지식(RAG) | `knowledge` | 개발자 B | 🔧 스캐폴드 |
| 리소스(도구) | `resource` | 개발자 C | 🔧 스캐폴드 |
| 커뮤니티 | `community` | 개발자 B | 🔧 스캐폴드 |
| 인증 | `auth` | 공통 | 🔧 스캐폴드 |

> `agent` / `permission` 두 도메인이 "완성 예시"다. 나머지는 같은 패턴으로 채운다.
