package com.axhub.permission;

import com.axhub.common.exception.BusinessException;
import com.axhub.permission.domain.PermissionRequest;
import com.axhub.permission.dto.CreateRequestDto;
import com.axhub.permission.dto.RequestResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 권한 요청/승인 서비스 — [담당: 개발자 C]
 * -----------------------------------------------------------------------------
 * 사용자: 요청 생성/취소
 * 관리자: 승인/반려
 * ※ 요청자/승인자는 로그인 사용자(SecurityContext)에서 가져와야 하지만,
 *    스캐폴드에서는 파라미터(currentUser)로 단순화했다. 인증 연동 후 교체할 것.
 */
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRequestRepository repository;

    /** 요청 생성 */
    @Transactional
    public RequestResponse create(CreateRequestDto dto, String currentUser, String currentDept) {
        PermissionRequest req = PermissionRequest.builder()
                .targetType(PermissionRequest.TargetType.valueOf(dto.targetType()))
                .targetId(dto.targetId())
                .targetName(dto.targetName())
                .requester(currentUser)
                .dept(currentDept)
                .permType(dto.permType())
                .period(dto.period())
                .reason(dto.reason())
                .sla("D-3")
                .build();
        return RequestResponse.from(repository.save(req));
    }

    /** 내 요청함 목록 */
    @Transactional(readOnly = true)
    public List<RequestResponse> listMine(String currentUser) {
        return repository.findByRequesterOrderByIdDesc(currentUser).stream().map(RequestResponse::from).toList();
    }

    /** 승인함 목록 (남이 낸 요청) */
    @Transactional(readOnly = true)
    public List<RequestResponse> listForApproval(String currentUser) {
        return repository.findByRequesterNotOrderByIdDesc(currentUser).stream().map(RequestResponse::from).toList();
    }

    /** 승인 */
    @Transactional
    public RequestResponse approve(Long id) {
        PermissionRequest req = findOrThrow(id);
        req.approve();
        // TODO(개발자 C): 승인 시 대상(Agent/지식/도구)의 권한을 granted 로 반영하는 연동 추가
        return RequestResponse.from(req);
    }

    /** 반려 (사유 필수) */
    @Transactional
    public RequestResponse deny(Long id, String reason) {
        if (reason == null || reason.isBlank()) throw BusinessException.badRequest("반려 사유는 필수입니다.");
        PermissionRequest req = findOrThrow(id);
        req.deny(reason);
        return RequestResponse.from(req);
    }

    /** 요청 취소 (삭제) */
    @Transactional
    public void cancel(Long id) {
        if (!repository.existsById(id)) throw BusinessException.notFound("요청을 찾을 수 없습니다: " + id);
        repository.deleteById(id);
    }

    private PermissionRequest findOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("요청을 찾을 수 없습니다: " + id));
    }
}
