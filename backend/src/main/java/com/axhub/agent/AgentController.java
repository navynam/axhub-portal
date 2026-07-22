package com.axhub.agent;

import com.axhub.agent.dto.AgentResponse;
import com.axhub.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Agent REST 컨트롤러 — [담당: 개발자 A]
 * -----------------------------------------------------------------------------
 * 프론트 agentService.js 와 1:1 매핑되는 엔드포인트.
 *   GET    /api/v1/agents              목록
 *   GET    /api/v1/agents/{id}         상세
 *   PATCH  /api/v1/agents/{id}/active  활성 토글
 *   PATCH  /api/v1/agents/{id}/favorite 즐겨찾기 토글
 * 응답은 ApiResponse 로 감싸 표준화한다.
 */
@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    @GetMapping
    public ApiResponse<List<AgentResponse>> list() {
        return ApiResponse.ok(agentService.getAgents());
    }

    @GetMapping("/{id}")
    public ApiResponse<AgentResponse> detail(@PathVariable String id) {
        return ApiResponse.ok(agentService.getAgent(id));
    }

    @PatchMapping("/{id}/active")
    public ApiResponse<AgentResponse> setActive(@PathVariable String id, @RequestBody Map<String, Boolean> body) {
        return ApiResponse.ok(agentService.setActive(id, Boolean.TRUE.equals(body.get("active"))));
    }

    @PatchMapping("/{id}/favorite")
    public ApiResponse<AgentResponse> setFavorite(@PathVariable String id, @RequestBody Map<String, Boolean> body) {
        return ApiResponse.ok(agentService.setFavorite(id, Boolean.TRUE.equals(body.get("fav"))));
    }
}
