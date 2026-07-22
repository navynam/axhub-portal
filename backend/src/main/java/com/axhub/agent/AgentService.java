package com.axhub.agent;

import com.axhub.agent.domain.Agent;
import com.axhub.agent.dto.AgentResponse;
import com.axhub.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Agent 서비스(업무 로직) — [담당: 개발자 A]
 * -----------------------------------------------------------------------------
 * 컨트롤러는 얇게 유지하고, 실제 로직/트랜잭션은 서비스에 둔다.
 * - 조회는 @Transactional(readOnly = true) 로 성능 최적화
 * - 변경은 @Transactional 로 원자성 보장
 */
@Service
@RequiredArgsConstructor // final 필드 생성자 주입 (Lombok)
public class AgentService {

    private final AgentRepository agentRepository;

    /** 목록 조회 */
    @Transactional(readOnly = true)
    public List<AgentResponse> getAgents() {
        return agentRepository.findAll().stream().map(AgentResponse::from).toList();
    }

    /** 단건 조회 (없으면 404) */
    @Transactional(readOnly = true)
    public AgentResponse getAgent(String id) {
        return AgentResponse.from(findOrThrow(id));
    }

    /** 활성/비활성 토글 */
    @Transactional
    public AgentResponse setActive(String id, boolean active) {
        Agent agent = findOrThrow(id);
        if (agent.isActive() != active) agent.toggleActive();
        return AgentResponse.from(agent);
    }

    /** 즐겨찾기 토글 */
    @Transactional
    public AgentResponse setFavorite(String id, boolean fav) {
        Agent agent = findOrThrow(id);
        if (agent.isFavorite() != fav) agent.toggleFavorite();
        return AgentResponse.from(agent);
    }

    /** 공통: id 로 조회하되 없으면 404 예외 */
    private Agent findOrThrow(String id) {
        return agentRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("Agent 를 찾을 수 없습니다: " + id));
    }
}
