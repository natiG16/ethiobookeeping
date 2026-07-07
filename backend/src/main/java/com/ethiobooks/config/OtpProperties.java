package com.ethiobooks.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.otp")
public class OtpProperties {
    /** Phone OTP sign-in (Telegram/SMS). Off until a real SMS provider is configured. */
    private boolean phoneEnabled = false;

    private String secret;
    private int ttlSeconds = 300;
    private int maxAttempts = 5;
    private int maxSendsPer10m = 3;

    private Telegram telegram = new Telegram();

    @Data
    public static class Telegram {
        private String botToken;
        private String chatId;
    }
}

