package com.ethiobooks.notifications;

import com.ethiobooks.notifications.domain.Notification;
import com.ethiobooks.notifications.domain.NotificationType;
import com.ethiobooks.notifications.dto.NotificationDto;
import com.ethiobooks.notifications.repository.NotificationRepository;
import com.ethiobooks.security.SecurityUtils;
import com.ethiobooks.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final DebtNotificationService debtNotificationService;

    public Page<NotificationDto> list(Pageable pageable) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(SecurityUtils.currentUserId(), pageable)
                .map(NotificationMapper::toDto);
    }

    @Transactional
    public int syncDebtReminders() {
        return debtNotificationService.syncForCurrentUser(LocalDate.now());
    }

    public long unreadCount() {
        return notificationRepository.countByUserIdAndReadFalse(SecurityUtils.currentUserId());
    }

    @Transactional
    public void markRead(UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(SecurityUtils.currentUserId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    public void createSystemNotification(UUID userId, String title, String message) {
        Notification notification = Notification.builder()
                .user(userRepository.getReferenceById(userId))
                .type(NotificationType.SYSTEM)
                .title(title)
                .message(message)
                .build();
        notificationRepository.save(notification);
    }
}
