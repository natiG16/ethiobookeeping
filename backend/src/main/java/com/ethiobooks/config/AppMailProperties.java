package com.ethiobooks.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.mail")
public class AppMailProperties {
    private String from = "mysuq <noreply@localhost>";
    private String frontendUrl = "http://localhost:4200";
    private int verificationTtlHours = 24;
}
