package com.axhub.agent;

import com.axhub.agent.domain.Agent;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Agent 저장소 — [담당: 개발자 A]
 * -----------------------------------------------------------------------------
 * Spring Data JPA 가 인터페이스만으로 CRUD 구현체를 자동 생성한다.
 * 메서드 이름 규칙(findByOwner 등)으로 쿼리도 자동 생성 가능.
 */
public interface AgentRepository extends JpaRepository<Agent, String> {
    // 예) List<Agent> findByScope(Agent.Scope scope);
    // 예) List<Agent> findByFavoriteTrue();
}
