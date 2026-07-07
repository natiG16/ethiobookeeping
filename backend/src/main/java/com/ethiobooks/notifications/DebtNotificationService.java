package com.ethiobooks.notifications;

import com.ethiobooks.debts.domain.Debt;
import com.ethiobooks.debts.domain.DebtStatus;
import com.ethiobooks.debts.repository.DebtRepository;
import com.ethiobooks.notifications.domain.Notification;
import com.ethiobooks.notifications.domain.NotificationType;
import com.ethiobooks.notifications.repository.NotificationRepository;
import com.ethiobooks.security.SecurityUtils;
import com.ethiobooks.users.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DebtNotificationService {

    private final DebtRepository debtRepository;
    private final NotificationRepository notificationRepository;

    @Transactional
    public int processAllReminders(LocalDate today) {
        return processDebts(debtRepository.findAllOpenWithDueDate(), today);
    }

    @Transactional
    public int syncForCurrentUser(LocalDate today) {
        UUID userId = SecurityUtils.currentUserId();
        return processDebts(debtRepository.findOpenWithDueDateForOwner(userId), today);
    }

    @Transactional
    public void notifyDebtIfDue(Debt debt, LocalDate today) {
        if (debt.getDueDate() == null) {
            return;
        }
        if (debt.getStatus() == DebtStatus.PAID || debt.getStatus() == DebtStatus.CANCELLED) {
            return;
        }
        if (debt.getRemainingAmount().signum() <= 0) {
            return;
        }
        processSingleDebt(debt, today);
    }

    private int processDebts(List<Debt> debts, LocalDate today) {
        int created = 0;
        for (Debt debt : debts) {
            if (debt.getRemainingAmount().signum() <= 0) {
                continue;
            }
            created += processSingleDebt(debt, today);
        }
        if (created > 0) {
            log.debug("Created {} debt due-date notification(s) for {}", created, today);
        }
        return created;
    }

    private int processSingleDebt(Debt debt, LocalDate today) {
        LocalDate due = debt.getDueDate();
        if (due == null) {
            return 0;
        }
        int created = 0;
        if (due.isBefore(today)) {
            if (debt.getStatus() == DebtStatus.ACTIVE) {
                debt.setStatus(DebtStatus.OVERDUE);
                debtRepository.save(debt);
            }
            created += createIfNew(debt, today, "overdue", titleOverdue(debt), messageRemaining(debt));
        } else if (due.isEqual(today)) {
            created += createIfNew(debt, today, "due-today", titleDueToday(debt), messageRemaining(debt));
        } else if (due.isEqual(today.plusDays(1))) {
            created += createIfNew(debt, today, "due-tomorrow", titleDueTomorrow(debt), messageRemaining(debt));
        }
        return created;
    }

    private int createIfNew(Debt debt, LocalDate today, String kind, String title, String message) {
        User owner = debt.getBusiness().getOwner();
        String reminderKey = kind + ":" + today;
        if (notificationRepository.existsByUserIdAndReferenceIdAndReminderKey(
                owner.getId(), debt.getId(), reminderKey)) {
            return 0;
        }
        Notification notification = Notification.builder()
                .user(owner)
                .business(debt.getBusiness())
                .type(NotificationType.DEBT_REMINDER)
                .title(title)
                .message(message)
                .referenceId(debt.getId())
                .reminderKey(reminderKey)
                .sentAt(Instant.now())
                .build();
        notificationRepository.save(notification);
        return 1;
    }

    private static String titleDueToday(Debt debt) {
        return "Due today: " + debt.getCustomerName();
    }

    private static String titleDueTomorrow(Debt debt) {
        return "Due tomorrow: " + debt.getCustomerName();
    }

    private static String titleOverdue(Debt debt) {
        return "Overdue: " + debt.getCustomerName();
    }

    private static String messageRemaining(Debt debt) {
        return "Remaining " + formatMoney(debt.getRemainingAmount()) + " ETB · due "
                + debt.getDueDate();
    }

    private static String formatMoney(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
