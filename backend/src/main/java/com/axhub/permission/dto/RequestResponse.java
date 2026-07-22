package com.axhub.permission.dto;

import com.axhub.permission.domain.PermissionRequest;

/**
 * 권한 요청 응답 DTO — [담당: 개발자 C]
 * 프론트 PermRequest 모델(shared/models/types.js)과 필드를 맞춘다.
 */
public record RequestResponse(
        Long id,
        String targetType,
        String targetId,
        String targetName,
        String requester,
        String dept,
        String permType,
        String period,
        String reason,
        String status,
        String sla,
        String owner,
        String denyReason
) {
    public static RequestResponse from(PermissionRequest r) {
        return new RequestResponse(
                r.getId(), r.getTargetType().name(), r.getTargetId(), r.getTargetName(),
                r.getRequester(), r.getDept(), r.getPermType(), r.getPeriod(), r.getReason(),
                r.getStatus().name(), r.getSla(), r.getOwner(), r.getDenyReason()
        );
    }
}
