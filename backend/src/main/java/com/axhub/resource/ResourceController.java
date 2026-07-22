package com.axhub.resource;

import com.axhub.common.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 리소스(도구) 권한 컨트롤러 — [담당: 개발자 C]  ※ 스캐폴드
 * -----------------------------------------------------------------------------
 * "Agent 실행에 필요한 도구를 하나라도 미보유하면 실행 불가" 규칙의 데이터 소스.
 * 프론트 resourceService.js 와 매핑:
 *   GET  /api/v1/resources/me            내 도구 권한 맵 { name: {owner, perm} }
 *   POST /api/v1/resources/{name}/request 도구 권한 요청 (permission 도메인과 연동)
 */
@RestController
@RequestMapping("/api/v1/resources")
public class ResourceController {

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> myResources() {
        // TODO(개발자 C): 로그인 사용자의 도구별 권한(owner, perm) 맵 반환
        return ApiResponse.ok(Map.of());
    }

    @PostMapping("/{name}/request")
    public ApiResponse<Object> request(@PathVariable String name) {
        // TODO(개발자 C): PermissionService.create(...) 재사용해 도구 권한 요청 생성
        return ApiResponse.ok(Map.of("name", name, "perm", "pending"));
    }
}
