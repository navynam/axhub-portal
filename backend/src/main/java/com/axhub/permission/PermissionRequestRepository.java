package com.axhub.permission;

import com.axhub.permission.domain.PermissionRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 권한 요청 저장소 — [담당: 개발자 C]
 * 메서드 이름 규칙으로 쿼리를 자동 생성한다.
 */
public interface PermissionRequestRepository extends JpaRepository<PermissionRequest, Long> {

    /** 내 요청함: 특정 사용자가 낸 요청 */
    List<PermissionRequest> findByRequesterOrderByIdDesc(String requester);

    /** 승인함: 특정 사용자가 내지 않은(=남이 낸) 요청 — 승인 대상 */
    List<PermissionRequest> findByRequesterNotOrderByIdDesc(String requester);
}
