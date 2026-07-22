package com.axhub.permission;

import com.axhub.common.response.ApiResponse;
import com.axhub.permission.dto.CreateRequestDto;
import com.axhub.permission.dto.RequestResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 권한 요청/승인 REST 컨트롤러 — [담당: 개발자 C]
 * -----------------------------------------------------------------------------
 * 프론트 permissionService.js 와 매핑:
 *   GET    /api/v1/requests?scope=mine|approve  목록
 *   POST   /api/v1/requests                      생성
 *   POST   /api/v1/requests/{id}/approve         승인
 *   POST   /api/v1/requests/{id}/deny            반려
 *   DELETE /api/v1/requests/{id}                 취소
 *
 * ※ currentUser 는 인증 연동 후 @AuthenticationPrincipal 등으로 대체.
 *   지금은 데모 사용자('홍길동')로 고정.
 */
@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService service;

    // TODO(인증 담당): SecurityContext 에서 로그인 사용자 획득으로 교체
    private static final String CURRENT_USER = "홍길동";
    private static final String CURRENT_DEPT = "마케팅팀";

    @GetMapping
    public ApiResponse<List<RequestResponse>> list(@RequestParam(defaultValue = "mine") String scope) {
        List<RequestResponse> data = "approve".equals(scope)
                ? service.listForApproval(CURRENT_USER)
                : service.listMine(CURRENT_USER);
        return ApiResponse.ok(data);
    }

    @PostMapping
    public ApiResponse<RequestResponse> create(@Valid @RequestBody CreateRequestDto dto) {
        return ApiResponse.ok(service.create(dto, CURRENT_USER, CURRENT_DEPT));
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<RequestResponse> approve(@PathVariable Long id) {
        return ApiResponse.ok(service.approve(id));
    }

    @PostMapping("/{id}/deny")
    public ApiResponse<RequestResponse> deny(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(service.deny(id, body.get("reason")));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> cancel(@PathVariable Long id) {
        service.cancel(id);
        return ApiResponse.ok(null);
    }
}
