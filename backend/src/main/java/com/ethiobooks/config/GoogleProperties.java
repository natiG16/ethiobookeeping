package com.ethiobooks.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.google")
public class GoogleProperties {

    /**
     * Comma-separated Google OAuth client IDs (Web, Android, iOS) allowed to sign in.
     */
    private String clientIds = "";

    public List<String> getClientIdList() {
        if (clientIds == null || clientIds.isBlank()) {
            return List.of();
        }
        return Arrays.stream(clientIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
