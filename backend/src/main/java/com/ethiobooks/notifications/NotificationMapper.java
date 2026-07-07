package com.ethiobooks.notifications;

import com.ethiobooks.notifications.domain.Notification;
import com.ethiobooks.notifications.dto.NotificationDto;

public final class NotificationMapper {

    private NotificationMapper() {}

    public static NotificationDto toDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .read(n.isRead())
                .type(n.getType())
                .createdAt(n.getCreatedAt())
                .businessId(n.getBusiness() != null ? n.getBusiness().getId() : null)
                .referenceId(n.getReferenceId())
                .build();
    }
}
