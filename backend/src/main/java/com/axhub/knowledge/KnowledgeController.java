package com.axhub.knowledge;

import com.axhub.common.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 지식(RAG) 컨트롤러 — [담당: 개발자 B]  ※ 스캐폴드
 * -----------------------------------------------------------------------------
 * agent 도메인(Controller→Service→Repository→Entity→DTO)을 참고해 동일 패턴으로 구현할 것.
 * 프론트 knowledgeService.js 와 매핑:
 *   GET /api/v1/knowledge              목록(카테고리/스코프/검색 필터)
 *   GET /api/v1/knowledge/categories   카테고리 트리
 *   GET /api/v1/knowledge/{id}         상세
 */
@RestController
@RequestMapping("/api/v1/knowledge")
public class KnowledgeController {

    @GetMapping
    public ApiResponse<List<Object>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String q) {
        // TODO(개발자 B): KnowledgeService.getKnowledge(category, scope, q) 구현
        return ApiResponse.ok(List.of());
    }

    @GetMapping("/categories")
    public ApiResponse<List<Object>> categories() {
        // TODO(개발자 B): 카테고리 트리 반환 (KnowledgeCategory 엔티티, 부모/자식 구조)
        return ApiResponse.ok(List.of());
    }

    @GetMapping("/{id}")
    public ApiResponse<Object> detail(@PathVariable String id) {
        // TODO(개발자 B): 상세 조회
        return ApiResponse.ok(null);
    }
}
