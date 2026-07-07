package com.ethiobooks.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardAnalyticsDto {

    private int todayTransactionCount;
    private int weekTransactionCount;
    private int monthTransactionCount;
    private BigDecimal monthProfitMargin;
    private String topPaymentMethod;
    private BigDecimal topPaymentMethodTotal;
}
