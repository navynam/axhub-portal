package com.axhub.agent.dto;

import com.axhub.agent.domain.Agent;

import java.util.List;

/**
 * Agent 응답 DTO — [담당: 개발자 A]
 * -----------------------------------------------------------------------------
 * 엔티티(Agent)를 그대로 노출하지 않고 DTO 로 변환해 응답한다.
 * (엔티티 노출 시 순환참조/불필요 필드 노출/스펙 결합 문제가 생김)
 * record 를 사용해 불변 DTO 를 간결하게 정의.
 */
public record AgentResponse(
        String id,
        String name,
        String desc,
        String owner,
        String scope,
        String perm,
        boolean active,
        boolean fav,
        int knowledge,
        int runs,
        String category,
        String model,
        String version,
        List<String> tools
) {
    /** 엔티티 → DTO 변환 */
    public static AgentResponse from(Agent a) {
        return new AgentResponse(
                a.getId(), a.getName(), a.getDescription(), a.getOwner(),
                a.getScope().name(), a.getPerm().name(), a.isActive(), a.isFavorite(),
                a.getKnowledgeCount(), a.getRuns(), a.getCategory(), a.getModel(),
                a.getVersion(), a.getTools()
        );
    }
}
