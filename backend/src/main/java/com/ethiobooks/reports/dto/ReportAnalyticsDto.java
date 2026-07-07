package com.ethiobooks.reports.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ReportAnalyticsDto {

    private int transactionCount;
    private int incomeCount;
    private int expenseCount;
    private BigDecimal incomeTotal;
    private BigDecimal expenseTotal;
    private BigDecimal profit;
    private BigDecimal avgIncome;
    private BigDecimal avgExpense;
    private String topPaymentMethod;
    private BigDecimal topPaymentAmount;
    private BigDecimal profitMarginPercent;
}
