package com.axhub.permission.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 권한 요청 생성 요청 바디 — [담당: 개발자 C]
 * @Valid 로 필수값(reason 등)을 검증한다.
 */
public record CreateRequestDto(
        @NotBlank String targetType,   // agent/knowledge/resource
        @NotBlank String targetId,
        @NotBlank String targetName,
        String permType,
        String period,
        @NotBlank(message = "요청 사유는 필수입니다.") String reason
) {}
