package com.ethiobooks.reports;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.debts.repository.DebtRepository;
import com.ethiobooks.subscription.PlanFeatureService;
import com.ethiobooks.transactions.domain.Transaction;
import com.ethiobooks.transactions.domain.TransactionType;
import com.ethiobooks.transactions.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReportServicePdfUnitTest {

    @Mock
    TransactionRepository transactionRepository;
    @Mock
    DebtRepository debtRepository;
    @Mock
    BusinessService businessService;
    @Mock
    PlanFeatureService planFeatureService;

    ReportI18n i18n = new ReportI18n();

    @InjectMocks
    ReportService reportService;

    UUID businessId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.invokeMethod(i18n, "loadBundles");
        ReflectionTestUtils.setField(reportService, "i18n", i18n);

        Business business = Business.builder()
                .name("Test Shop")
                .currency("ETB")
                .subscriptionPlan("business")
                .subscriptionActive(true)
                .build();

        when(businessService.findOwned(businessId)).thenReturn(business);
        doNothing().when(planFeatureService).requireActiveSubscription(business);
        doNothing().when(planFeatureService).requirePdfReports(business);
        when(debtRepository.sumUnpaid(businessId)).thenReturn(BigDecimal.ZERO);

        Transaction tx = Transaction.builder()
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("50"))
                .description("Morning sales")
                .paymentMethod("Cash")
                .transactionDate(LocalDate.now())
                .build();

        when(transactionRepository.findByBusinessIdAndTransactionDateBetweenOrderByTransactionDateAscCreatedAtAsc(
                eq(businessId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(tx));
        when(transactionRepository.sumByTypeAndDateRange(
                eq(businessId), eq(TransactionType.INCOME), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("50"));
        when(transactionRepository.sumByTypeAndDateRange(
                eq(businessId), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumCostOfGoodsSold(eq(businessId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(BigDecimal.ZERO);
    }

    @Test
    void generatePdf_returnsEnglishStatement() {
        LocalDate today = LocalDate.now();
        byte[] pdf = reportService.generatePdf(businessId, "daily", today, today);
        assertThat(pdf).isNotEmpty();
        assertThat(pdf.length).isGreaterThan(500);
    }

    @Test
    void generatePdf_withAmharicDescription_doesNotFail() {
        Transaction amharic = Transaction.builder()
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("25"))
                .description("ገቢ ከሽያጭ")
                .paymentMethod("Telebirr")
                .transactionDate(LocalDate.now())
                .build();
        when(transactionRepository.findByBusinessIdAndTransactionDateBetweenOrderByTransactionDateAscCreatedAtAsc(
                eq(businessId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(amharic));

        LocalDate today = LocalDate.now();
        byte[] pdf = reportService.generatePdf(businessId, "daily", today, today);
        assertThat(pdf).isNotEmpty();
        assertThat(pdf[0]).isEqualTo((byte) '%');
        assertThat(pdf[1]).isEqualTo((byte) 'P');
    }
}
