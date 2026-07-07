package com.ethiobooks.notifications.dto;

import com.ethiobooks.notifications.domain.NotificationType;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class NotificationDto {
    UUID id;
    String title;
    String message;
    boolean read;
    NotificationType type;
    Instant createdAt;
    UUID businessId;
    UUID referenceId;
}
