package com.axhub.common.exception;

import com.axhub.common.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 전역 예외 처리기.
 * 컨트롤러/서비스에서 발생한 예외를 표준 실패 응답({success:false, message})으로 변환한다.
 * → 화면(프론트)은 항상 동일한 형태로 에러를 처리할 수 있다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 업무 예외 (서비스에서 의도적으로 던진 것) */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException e) {
        return ResponseEntity.status(e.getStatus()).body(ApiResponse.fail(e.getMessage()));
    }

    /** @Valid 검증 실패 (요청 DTO 필드 오류) */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        FieldError fe = e.getBindingResult().getFieldError();
        String msg = fe != null ? fe.getField() + ": " + fe.getDefaultMessage() : "요청 값이 올바르지 않습니다.";
        return ResponseEntity.badRequest().body(ApiResponse.fail(msg));
    }

    /** 그 외 미처리 예외 (서버 오류) */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleEtc(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("서버 오류가 발생했습니다: " + e.getMessage()));
    }
}
