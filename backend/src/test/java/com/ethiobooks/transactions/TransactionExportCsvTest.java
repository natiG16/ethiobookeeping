package com.ethiobooks.transactions;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.security.SecurityUtils;
import com.ethiobooks.subscription.PlanFeatureService;
import com.ethiobooks.transactions.domain.Transaction;
import com.ethiobooks.transactions.domain.TransactionType;
import com.ethiobooks.transactions.mapper.TransactionMapper;
import com.ethiobooks.transactions.repository.CategoryRepository;
import com.ethiobooks.transactions.repository.TransactionRepository;
import com.ethiobooks.users.domain.CalendarSystem;
import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionExportCsvTest {

    @Mock
    TransactionRepository transactionRepository;
    @Mock
    CategoryRepository categoryRepository;
    @Mock
    BusinessService businessService;
    @Mock
    UserRepository userRepository;
    @Mock
    TransactionMapper transactionMapper;
    @Mock
    PlanFeatureService planFeatureService;
    @Mock
    TransactionFilterQuery transactionFilterQuery;

    @InjectMocks
    TransactionService transactionService;

    UUID businessId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        when(businessService.findOwned(businessId)).thenReturn(Business.builder().name("Shop").build());
    }

    @Test
    void exportCsv_usesEthiopianDatesWhenUserPrefersEthiopian() {
        User user = User.builder().locale("en").calendarSystem(CalendarSystem.ETHIOPIAN).build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        LocalDate date = LocalDate.of(2026, 3, 15);
        Transaction tx = Transaction.builder()
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("100.00"))
                .description("Sale")
                .paymentMethod("Cash")
                .transactionDate(date)
                .build();

        when(transactionFilterQuery.findFiltered(
                eq(businessId), eq(null), eq(null), eq(null), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(tx)));

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::currentUserId).thenReturn(userId);
            String csv = transactionService.exportCsv(businessId, null, null, null, null, null);
            assertThat(csv).contains("Megabit 6, 2018");
        }
    }

    @Test
    void exportCsv_usesGregorianDatesWhenUserPrefersGregorian() {
        User user = User.builder().locale("en").calendarSystem(CalendarSystem.GREGORIAN).build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        Transaction tx = Transaction.builder()
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("100.00"))
                .transactionDate(LocalDate.of(2026, 3, 15))
                .build();

        when(transactionFilterQuery.findFiltered(
                eq(businessId), eq(null), eq(null), eq(null), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(tx)));

        try (MockedStatic<SecurityUtils> security = mockStatic(SecurityUtils.class)) {
            security.when(SecurityUtils::currentUserId).thenReturn(userId);
            String csv = transactionService.exportCsv(businessId, null, null, null, null, null);
            assertThat(csv).contains("\"2026-03-15\"");
        }
    }
}
