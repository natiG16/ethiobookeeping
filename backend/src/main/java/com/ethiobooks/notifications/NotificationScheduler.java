package com.ethiobooks.notifications;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final DebtNotificationService debtNotificationService;

    /** Daily at 8:00 Addis Ababa — due tomorrow, due today, and overdue debt alerts. */
    @Scheduled(cron = "0 0 8 * * *", zone = "Africa/Addis_Ababa")
    public void sendDebtReminders() {
        int created = debtNotificationService.processAllReminders(LocalDate.now());
        log.info("Debt due-date notifications: {} new reminder(s)", created);
    }
}
