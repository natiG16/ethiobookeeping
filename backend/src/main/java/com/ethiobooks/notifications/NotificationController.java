package com.ethiobooks.notifications;

import com.ethiobooks.common.dto.ApiResponse;
import com.ethiobooks.notifications.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<Page<NotificationDto>> list(@PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(notificationService.list(pageable));
    }

    @PostMapping("/sync-debt-reminders")
    public ApiResponse<Map<String, Integer>> syncDebtReminders() {
        int created = notificationService.syncDebtReminders();
        return ApiResponse.ok(Map.of("created", created));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> unreadCount() {
        return ApiResponse.ok(Map.of("count", notificationService.unreadCount()));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markRead(@PathVariable UUID id) {
        notificationService.markRead(id);
        return ApiResponse.ok(null);
    }
}
