package com.axhub.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * 보안 설정 (JWT 기반 · 세션 미사용).
 *
 * ⚠ 현재는 개발 편의를 위해 모든 요청을 허용(permitAll)한다.
 *   인증 개발 담당자는 아래 순서로 확장한다:
 *   1) JwtProvider 로 토큰 발급/검증 구현 (auth 패키지)
 *   2) JwtAuthFilter 를 addFilterBefore 로 등록
 *   3) requestMatchers 로 /auth/** 만 permitAll, 나머지 authenticated 로 변경
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {}) // corsConfigurationSource 빈 사용
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // TODO(인증 담당): 아래를 .requestMatchers("/api/v1/auth/**").permitAll().anyRequest().authenticated() 로 변경
                .anyRequest().permitAll()
            );
        return http.build();
    }

    /** 프론트(5173) → 백엔드(8080) 교차 출처 허용 (application.yml 의 origins 참고) */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(List.of("http://localhost:5173"));
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("*"));
        c.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", c);
        return src;
    }
}
