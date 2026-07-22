package com.axhub.community;

import com.axhub.common.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 커뮤니티 컨트롤러 — [담당: 개발자 B]  ※ 스캐폴드
 * -----------------------------------------------------------------------------
 * 프론트 communityService.js 와 매핑:
 *   GET /api/v1/community/boards               게시판 목록
 *   GET /api/v1/community/boards/{id}/posts     게시판 글 목록
 */
@RestController
@RequestMapping("/api/v1/community")
public class CommunityController {

    @GetMapping("/boards")
    public ApiResponse<List<Object>> boards() {
        // TODO(개발자 B): Board 엔티티 목록 반환
        return ApiResponse.ok(List.of());
    }

    @GetMapping("/boards/{id}/posts")
    public ApiResponse<List<Object>> posts(@PathVariable String id) {
        // TODO(개발자 B): 게시판 글 목록 반환 (페이징 권장)
        return ApiResponse.ok(List.of());
    }
}
