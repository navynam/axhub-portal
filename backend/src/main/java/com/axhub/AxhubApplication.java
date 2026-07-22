package com.axhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * AX-HUB 백엔드 애플리케이션 진입점.
 * <p>실행: {@code ./gradlew bootRun} (JDK 17)
 * <p>@EnableJpaAuditing : BaseTimeEntity 의 생성/수정 시각 자동 기록에 필요.
 */
@EnableJpaAuditing
@SpringBootApplication
public class AxhubApplication {
    public static void main(String[] args) {
        SpringApplication.run(AxhubApplication.class, args);
    }
}
