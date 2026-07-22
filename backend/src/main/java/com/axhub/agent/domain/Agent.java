package com.axhub.agent.domain;

import com.axhub.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Agent 엔티티 (DB 테이블 매핑) — [담당: 개발자 A]
 * -----------------------------------------------------------------------------
 * 프론트 Agent 모델(shared/models/types.js)과 필드를 1:1로 맞춘다.
 * 활용 도구 목록(tools)은 별도 테이블(agent_tool)에 저장하는 예시.
 */
@Entity
@Table(name = "agent")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA 기본 생성자 (외부 new 금지)
public class Agent extends BaseTimeEntity {

    @Id
    @Column(length = 20)
    private String id;              // 예: 'ag-03'

    private String name;
    private String description;
    private String owner;           // 소유(제공) 부서

    @Enumerated(EnumType.STRING)
    private Scope scope;            // personal/team/dept/company

    @Enumerated(EnumType.STRING)
    private Perm perm;             // 소유/권한 상태

    private boolean active;         // 내 소유 Agent 활성 여부
    private boolean favorite;       // 즐겨찾기
    private int knowledgeCount;     // 연결 지식 수
    private int runs;               // 누적 실행 수

    private String category;
    private String model;           // 사용 LLM
    private String version;

    /** 활용 도구 이름 목록 (실행 가능 여부 판단의 기준) */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "agent_tool", joinColumns = @JoinColumn(name = "agent_id"))
    @Column(name = "tool_name")
    private List<String> tools = new ArrayList<>();

    /** 활성/비활성 토글 (도메인 로직은 엔티티 안에 두는 것을 권장) */
    public void toggleActive() { this.active = !this.active; }

    /** 즐겨찾기 토글 */
    public void toggleFavorite() { this.favorite = !this.favorite; }

    /** 실행 카운트 증가 */
    public void increaseRuns() { this.runs++; }

    // 공개 범위/권한 enum
    public enum Scope { personal, team, dept, company }
    public enum Perm { owner, granted, pending, none, denied, expired }
}
