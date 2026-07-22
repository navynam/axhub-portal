package com.axhub.common.response;

import lombok.Getter;

/**
 * 모든 API 의 표준 응답 래퍼.
 * <pre>
 * { "success": true, "data": {...}, "message": null }
 * </pre>
 * 프론트 shared/api/http.js 가 이 구조를 인지하여 data 만 언랩(unwrap)한다.
 * → 프론트/백엔드가 응답 형태를 한 가지로 통일한다.
 *
 * @param <T> 실제 데이터 타입
 */
@Getter
public class ApiResponse<T> {
    private final boolean success;
    private final T data;
    private final String message;

    private ApiResponse(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    /** 성공 응답 */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    /** 실패 응답 (GlobalExceptionHandler 에서 사용) */
    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(false, null, message);
    }
}
