package com.axhub.permission.domain;

import com.axhub.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 권한/도구 요청 엔티티 — [담당: 개발자 C]
 * -----------------------------------------------------------------------------
 * 사용자가 Agent/지식/도구(리소스)에 대해 낸 권한 요청 1건.
 * 승인/반려에 따라 status 와 denyReason 이 갱신된다.
 */
@Entity
@Table(name = "permission_request")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PermissionRequest extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TargetType targetType;   // agent/knowledge/resource

    private String targetId;
    private String targetName;

    private String requester;        // 요청자(사용자명) — '내 요청함'/'승인함' 구분 기준
    private String dept;             // 요청자 부서
    private String permType;         // 사용/열람/도구 사용 등
    private String period;           // 사용 기간
    @Column(length = 500)
    private String reason;           // 요청 사유

    @Enumerated(EnumType.STRING)
    private Status status;           // pending/approved/denied

    private String sla;
    private String owner;            // 리소스 요청 시 승인 관리자 부서
    @Column(length = 500)
    private String denyReason;       // 반려 사유

    @Builder
    private PermissionRequest(TargetType targetType, String targetId, String targetName,
                              String requester, String dept, String permType, String period,
                              String reason, String sla, String owner) {
        this.targetType = targetType;
        this.targetId = targetId;
        this.targetName = targetName;
        this.requester = requester;
        this.dept = dept;
        this.permType = permType;
        this.period = period;
        this.reason = reason;
        this.sla = sla;
        this.owner = owner;
        this.status = Status.pending; // 생성 시 항상 대기
    }

    /** 승인 처리 */
    public void approve() { this.status = Status.approved; }

    /** 반려 처리 (사유 필수) */
    public void deny(String denyReason) {
        this.status = Status.denied;
        this.denyReason = denyReason;
    }

    public enum TargetType { agent, knowledge, resource }
    public enum Status { pending, approved, denied }
}
