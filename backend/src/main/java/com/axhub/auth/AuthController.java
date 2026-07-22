package com.axhub.auth;

import com.axhub.common.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 인증 컨트롤러 — [담당: 공통 개발자]  ※ 스캐폴드
 * -----------------------------------------------------------------------------
 * 프론트 authService.js 와 매핑:
 *   POST /api/v1/auth/login  로그인 → { accessToken, user }
 *   GET  /api/v1/auth/me     현재 사용자
 * TODO(공통): JwtProvider 로 토큰 발급/검증, 사용자 저장소(UserRepository) 연동.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        // TODO(공통): 사용자 검증 후 JWT 발급
        return ApiResponse.ok(Map.of(
                "accessToken", "dummy-token",
                "user", Map.of("name", "홍길동", "dept", "마케팅팀")
        ));
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me() {
        // TODO(공통): SecurityContext 에서 사용자 반환
        return ApiResponse.ok(Map.of("name", "홍길동", "dept", "마케팅팀"));
    }
}
