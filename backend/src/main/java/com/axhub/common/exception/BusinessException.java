package com.axhub.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 업무 규칙 위반 등 "예상된" 예외.
 * 서비스 계층에서 던지면 GlobalExceptionHandler 가 표준 실패 응답으로 변환한다.
 * 예) throw new BusinessException(HttpStatus.FORBIDDEN, "도구 권한이 없어 실행할 수 없습니다.");
 */
@Getter
public class BusinessException extends RuntimeException {
    private final HttpStatus status;

    public BusinessException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    /** 400 Bad Request 단축 생성 */
    public static BusinessException badRequest(String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, message);
    }

    /** 404 Not Found 단축 생성 */
    public static BusinessException notFound(String message) {
        return new BusinessException(HttpStatus.NOT_FOUND, message);
    }
}
